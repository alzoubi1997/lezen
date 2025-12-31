import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Optimize: Run queries in parallel and only fetch what we need
    const [attempts, completions, totalModels] = await Promise.all([
      // Only fetch the 10 most recent attempts for display
      prisma.attempt.findMany({
        where: {
          userId: user.id,
          finishedAt: { not: null },
        },
        take: 10, // Limit to 10 most recent
        include: {
          model: {
            select: {
              titleNl: true,
              kind: true,
            },
          },
        },
        orderBy: {
          finishedAt: 'desc',
        },
      }),
      prisma.modelCompletion.findMany({
        where: {
          userId: user.id,
          done: true,
        },
        select: {
          id: true,
        },
      }),
      prisma.model.count(),
    ])

    // Get total count and stats separately (faster than fetching all)
    const [totalAttemptsCount, statsResult] = await Promise.all([
      prisma.attempt.count({
        where: {
          userId: user.id,
          finishedAt: { not: null },
        },
      }),
      prisma.attempt.aggregate({
        where: {
          userId: user.id,
          finishedAt: { not: null },
        },
        _avg: {
          scorePercent: true,
        },
        _sum: {
          totalTimeSec: true,
        },
      }),
    ])

    const totalAttempts = totalAttemptsCount
    const averageScore = statsResult._avg.scorePercent || 0
    const totalTimeSpent = statsResult._sum.totalTimeSec || 0

    const recentAttemptsFormatted = attempts.map((attempt) => ({
      id: attempt.id,
      modelTitle: attempt.model.titleNl,
      score: attempt.scorePercent,
      finishedAt: attempt.finishedAt!.toISOString(),
      modelKind: attempt.model.kind,
      totalQuestions: attempt.totalQuestions,
    }))

    // Debug: Log to verify exams are included
    const examCount = attempts.filter(a => a.model.kind === 'EXAM').length
    const practiceCount = attempts.filter(a => a.model.kind === 'PRACTICE').length
    console.log(`[Dashboard Summary] Total: ${attempts.length}, Exams: ${examCount}, Practices: ${practiceCount}`)

    // Cache for 10 seconds - dashboard data changes frequently
    return NextResponse.json(
      {
        totalAttempts,
        averageScore,
        totalTimeSpent,
        completedModels: completions.length,
        totalModels,
        recentAttempts: recentAttemptsFormatted,
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=30',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch summary' },
      { status: 500 }
    )
  }
}

