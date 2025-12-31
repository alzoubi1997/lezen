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

// Allow caching for better performance
export const dynamic = 'force-dynamic'
export const revalidate = 10 // Revalidate every 10 seconds

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

    // Separate exams and practices
    const examAttempts = allAttempts.filter(a => a.model?.kind === 'EXAM')
    const practiceAttempts = allAttempts.filter(a => a.model?.kind === 'PRACTICE')

    // For block creation: use only unique practices (one per practice number)
    // But for display: show all attempts in incompleteBlock
    // This allows users to see all their attempts while only counting unique practices for blocks
    const seenPractices = new Map<number, number>() // practice number -> index of latest attempt
    const uniquePracticeAttempts: typeof practiceAttempts = []
    const allPracticeAttemptsForDisplay: typeof practiceAttempts = []
    
    // Sort by date first
    const sortedPracticeAttempts = [...practiceAttempts].sort((a, b) => {
      if (!a.finishedAt || !b.finishedAt) return 0
      return a.finishedAt.getTime() - b.finishedAt.getTime()
    })
    
    // For block creation: keep only unique practices (latest attempt per practice)
    for (let i = sortedPracticeAttempts.length - 1; i >= 0; i--) {
      const attempt = sortedPracticeAttempts[i]
      const practiceNum = attempt.model?.number
      if (practiceNum === undefined || practiceNum === null) {
        uniquePracticeAttempts.unshift(attempt) // Include it anyway
        continue
      }
      if (!seenPractices.has(practiceNum)) {
        seenPractices.set(practiceNum, i)
        uniquePracticeAttempts.unshift(attempt) // Add to front to maintain chronological order
      }
    }
    
    // For display: keep all attempts (including duplicates)
    allPracticeAttemptsForDisplay.push(...sortedPracticeAttempts)

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
    let incompleteBlock: AttemptMetrics[] = []
    let prevBlock: Block36Metrics | null = null

    // Process all attempts chronologically, interleaving practices and exams
    const allSortedAttempts = [...practiceMetrics, ...examMetrics].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    )

    // Track practices that haven't been grouped yet (for block creation)
    let practiceBuffer: AttemptMetrics[] = []
    
    // Track which practice numbers are already in blocks
    const practiceNumbersInBlocks = new Set<number>()

    for (const attempt of allSortedAttempts) {
      if (attempt.modelKind === 'EXAM') {
        // First, try to complete any pending practice block
        if (practiceBuffer.length === 3) {
          const block = calculateBlock36Metrics(practiceBuffer, prevBlock)
          blocks.push(block)
          // Mark these practice numbers as used in blocks
          practiceBuffer.forEach(p => {
            if (p.modelNumber !== undefined) {
              practiceNumbersInBlocks.add(p.modelNumber)
            }
          })
          prevBlock = block
          practiceBuffer = []
        } else if (practiceBuffer.length > 0) {
          // Save incomplete practice block
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
        
        // If we have 3 practices, create a block
        if (practiceBuffer.length === 3) {
          const block = calculateBlock36Metrics(practiceBuffer, prevBlock)
          blocks.push(block)
          // Mark these practice numbers as used in blocks
          practiceBuffer.forEach(p => {
            if (p.modelNumber !== undefined) {
              practiceNumbersInBlocks.add(p.modelNumber)
            }
          })
          prevBlock = block
          practiceBuffer = []
        }
      }
    }

    // Handle any remaining practices in buffer
    if (practiceBuffer.length > 0) {
      incompleteBlock.push(...practiceBuffer)
    }

    // Now add all practice attempts (including duplicates) that are not in blocks to incompleteBlock
    // This allows users to see all their attempts even if they're duplicates
    // Track which attempt IDs are already in incompleteBlock
    const incompleteBlockAttemptIds = new Set(incompleteBlock.map(a => a.id))
    
    // Track which attempt IDs are in blocks (to exclude them from incompleteBlock)
    const attemptIdsInBlocks = new Set<string>()
    blocks.forEach(block => {
      block.attemptIds.forEach(id => attemptIdsInBlocks.add(id))
    })
    
    // Calculate metrics for all practice attempts (including duplicates) for display
    for (const attempt of allPracticeAttemptsForDisplay) {
      const practiceNum = attempt.model?.number
      // Only add if this attempt is not already in a block
      // AND this attempt is not already in incompleteBlock
      if (!attemptIdsInBlocks.has(attempt.id) && !incompleteBlockAttemptIds.has(attempt.id)) {
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
          null // Don't track previous for display purposes
        )
        incompleteBlock.push(metrics)
        incompleteBlockAttemptIds.add(attempt.id)
      }
    }

    // CRITICAL: Check if incompleteBlock has exactly 3 unique practices - if so, create a block!
    // This ensures that if user has 3 different practices, they form a complete block
    // Get unique practices from incompleteBlock (by practice number, using latest attempt per practice)
    const uniquePracticesInIncomplete = new Map<number, AttemptMetrics>()
    for (const attempt of incompleteBlock) {
      const practiceNum = attempt.modelNumber
      if (practiceNum !== undefined) {
        // Keep the latest attempt for each practice number
        if (!uniquePracticesInIncomplete.has(practiceNum)) {
          uniquePracticesInIncomplete.set(practiceNum, attempt)
        } else {
          const existing = uniquePracticesInIncomplete.get(practiceNum)!
          // Keep the one with the latest date
          if (attempt.date > existing.date) {
            uniquePracticesInIncomplete.set(practiceNum, attempt)
          }
        }
      }
    }

    // If we have exactly 3 unique practices, create a block from them!
    if (uniquePracticesInIncomplete.size === 3) {
      const threePractices = Array.from(uniquePracticesInIncomplete.values()).sort((a, b) => 
        a.date.getTime() - b.date.getTime()
      )
      const block = calculateBlock36Metrics(threePractices, prevBlock)
      blocks.push(block)
      prevBlock = block
      
      // Remove these practices from incompleteBlock (keep only duplicates or other practices)
      const practiceNumbersToRemove = new Set(threePractices.map(p => p.modelNumber).filter(n => n !== undefined) as number[])
      incompleteBlock = incompleteBlock.filter(attempt => {
        const practiceNum = attempt.modelNumber
        return practiceNum === undefined || !practiceNumbersToRemove.has(practiceNum)
      })
    }

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

    return NextResponse.json(
      {
        attempts: allAttemptMetrics,
        blocks,
        latestBlock,
        avgCompletedBlocks,
        incompleteBlock: incompleteBlockFormatted,
        totalAttempts: allAttemptMetrics.length,
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=30',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching NT2 progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NT2 progress' },
      { status: 500 }
    )
  }
}

