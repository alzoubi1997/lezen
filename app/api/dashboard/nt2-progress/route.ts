import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  calculateAttemptMetrics,
  calculateBlock36Metrics,
  calculateExamBlockMetrics,
  calculateOverallStats,
  type AttemptMetrics,
  type Block36Metrics,
  type OverallStats,
} from '@/lib/nt2-scoring'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch all finished attempts ordered by date, include model info
    // Include both PRACTICE and EXAM attempts
    const allAttempts = await prisma.attempt.findMany({
      where: {
        userId: user.id,
        finishedAt: { not: null },
        mode: { in: ['PRACTICE', 'EXAM'] },
      },
      include: {
        model: true,
      },
      orderBy: {
        finishedAt: 'asc',
      },
    })

    // Debug logging
    console.log(`[NT2 Progress] Total attempts fetched: ${allAttempts.length}`)
    const attemptsByKind = allAttempts.reduce((acc, a) => {
      const kind = a.model?.kind || 'UNKNOWN'
      acc[kind] = (acc[kind] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log(`[NT2 Progress] Attempts by kind:`, attemptsByKind)

    // Separate exams and practices
    const examAttempts = allAttempts.filter(a => a.model?.kind === 'EXAM')
    const practiceAttempts = allAttempts.filter(a => a.model?.kind === 'PRACTICE')
    
    console.log(`[NT2 Progress] Exam attempts: ${examAttempts.length}, Practice attempts: ${practiceAttempts.length}`)

    // Filter out duplicates: same practice number should only be counted once
    // (unless we want to allow repeats - for now, we'll use the latest attempt per practice)
    const seenPractices = new Map<number, number>() // practice number -> index of latest attempt
    const uniquePracticeAttempts: typeof practiceAttempts = []
    
    console.log(`[NT2 Progress] Processing ${practiceAttempts.length} practice attempts for deduplication`)
    
    for (let i = practiceAttempts.length - 1; i >= 0; i--) {
      const attempt = practiceAttempts[i]
      const practiceNum = attempt.model?.number
      if (practiceNum === undefined || practiceNum === null) {
        console.warn(`[NT2 Progress] Practice attempt ${attempt.id} has no model.number, skipping deduplication`)
        uniquePracticeAttempts.unshift(attempt) // Include it anyway
        continue
      }
      if (!seenPractices.has(practiceNum)) {
        seenPractices.set(practiceNum, i)
        uniquePracticeAttempts.unshift(attempt) // Add to front to maintain chronological order
      } else {
        console.log(`[NT2 Progress] Duplicate practice ${practiceNum} found, using latest attempt`)
      }
    }
    
    console.log(`[NT2 Progress] After deduplication: ${uniquePracticeAttempts.length} unique practice attempts`)
    
    // Sort by date again after deduplication
    uniquePracticeAttempts.sort((a, b) => {
      if (!a.finishedAt || !b.finishedAt) return 0
      return a.finishedAt.getTime() - b.finishedAt.getTime()
    })

    // Exams are already unique (each exam attempt counts)
    const uniqueExamAttempts = examAttempts

    // Layer 1: Calculate per-attempt metrics for practices
    const practiceMetrics: AttemptMetrics[] = []
    let prevPracticeAttempt: AttemptMetrics | null = null

    for (const attempt of uniquePracticeAttempts) {
      const metrics = calculateAttemptMetrics(
        {
          id: attempt.id,
          finishedAt: attempt.finishedAt,
          totalQuestions: attempt.totalQuestions,
          correctCount: attempt.correctCount,
          modelKind: attempt.model.kind,
          modelNumber: attempt.model.number,
          modelTitle: attempt.model.titleNl,
        },
        prevPracticeAttempt
      )
      practiceMetrics.push(metrics)
      prevPracticeAttempt = metrics
    }

    // Layer 1: Calculate per-attempt metrics for exams
    const examMetrics: AttemptMetrics[] = []
    let prevExamAttempt: AttemptMetrics | null = null

    for (const attempt of uniqueExamAttempts) {
      const metrics = calculateAttemptMetrics(
        {
          id: attempt.id,
          finishedAt: attempt.finishedAt,
          totalQuestions: attempt.totalQuestions,
          correctCount: attempt.correctCount,
          modelKind: attempt.model.kind,
          modelNumber: attempt.model.number,
          modelTitle: attempt.model.titleNl,
        },
        prevExamAttempt
      )
      examMetrics.push(metrics)
      prevExamAttempt = metrics
    }

    // Combine all attempts for return (sorted by date)
    const allAttemptMetrics = [...practiceMetrics, ...examMetrics].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    )

    // Layer 2: Create blocks
    // - Each exam = 1 block (exams already have 36 questions)
    // - 3 practices = 1 block (3 × 12 = 36 questions)
    const blocks: Block36Metrics[] = []
    const incompleteBlock: AttemptMetrics[] = []
    let prevBlock: Block36Metrics | null = null

    // Process all attempts chronologically, interleaving practices and exams
    const allSortedAttempts = [...practiceMetrics, ...examMetrics].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    )

    // Track practices that haven't been grouped yet
    let practiceBuffer: AttemptMetrics[] = []

    console.log(`[NT2 Progress] Processing ${allSortedAttempts.length} sorted attempts (${practiceMetrics.length} practices, ${examMetrics.length} exams)`)

    for (const attempt of allSortedAttempts) {
      if (attempt.modelKind === 'EXAM') {
        // First, try to complete any pending practice block
        if (practiceBuffer.length === 3) {
          console.log(`[NT2 Progress] Creating practice block from buffer before exam`)
          const block = calculateBlock36Metrics(practiceBuffer, prevBlock)
          blocks.push(block)
          prevBlock = block
          practiceBuffer = []
        } else if (practiceBuffer.length > 0) {
          // Save incomplete practice block
          console.log(`[NT2 Progress] Saving ${practiceBuffer.length} incomplete practices before exam`)
          incompleteBlock.push(...practiceBuffer)
          practiceBuffer = []
        }
        
        // Each exam is its own block
        const block = calculateExamBlockMetrics(attempt, prevBlock)
        blocks.push(block)
        prevBlock = block
      } else {
        // It's a practice - add to buffer
        practiceBuffer.push(attempt)
        console.log(`[NT2 Progress] Added practice to buffer: ${attempt.modelTitle} (buffer size: ${practiceBuffer.length})`)
        
        // If we have 3 practices, create a block
        if (practiceBuffer.length === 3) {
          console.log(`[NT2 Progress] Creating practice block from 3 practices: ${practiceBuffer.map(a => a.modelTitle).join(', ')}`)
          const block = calculateBlock36Metrics(practiceBuffer, prevBlock)
          blocks.push(block)
          prevBlock = block
          practiceBuffer = []
        }
      }
    }

    // Handle any remaining practices in buffer
    if (practiceBuffer.length > 0) {
      console.log(`[NT2 Progress] Saving ${practiceBuffer.length} remaining incomplete practices`)
      incompleteBlock.push(...practiceBuffer)
    }

    console.log(`[NT2 Progress] Final: ${blocks.length} blocks, ${incompleteBlock.length} incomplete practices`)

    // Layer 3: Calculate overall stats (simplified)
    // Only use complete blocks for average
    const avgCompletedBlocks =
      blocks.length > 0
        ? blocks.reduce((sum, b) => sum + b.yourPercent36, 0) / blocks.length
        : null

    const latestBlock = blocks.length > 0 ? blocks[blocks.length - 1] : null

    // Format incomplete block with model info
    const incompleteBlockFormatted = incompleteBlock.map((attempt) => ({
      id: attempt.id,
      date: attempt.date,
      correctAnswers: attempt.correctAnswers,
      totalQuestions: attempt.totalQuestions,
      yourPercentAttempt: attempt.yourPercentAttempt,
      passFailAttempt: attempt.passFailAttempt,
      modelTitle: attempt.modelTitle,
      modelNumber: attempt.modelNumber,
    }))

    // Debug logging for response
    console.log(`[NT2 Progress] Response: blocks=${blocks.length}, incompleteBlock=${incompleteBlockFormatted.length}, totalAttempts=${allAttemptMetrics.length}`)
    console.log(`[NT2 Progress] Practice attempts in allAttemptMetrics: ${allAttemptMetrics.filter(a => a.modelKind === 'PRACTICE').length}`)
    console.log(`[NT2 Progress] Exam attempts in allAttemptMetrics: ${allAttemptMetrics.filter(a => a.modelKind === 'EXAM').length}`)

    return NextResponse.json({
      attempts: allAttemptMetrics,
      blocks,
      latestBlock,
      avgCompletedBlocks,
      incompleteBlock: incompleteBlockFormatted,
      totalAttempts: allAttemptMetrics.length,
    })
  } catch (error) {
    console.error('Error fetching NT2 progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NT2 progress' },
      { status: 500 }
    )
  }
}

