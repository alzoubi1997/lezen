import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { finishAttemptSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { attemptId, totalTimeSec } = finishAttemptSchema.parse(body)

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        questionAttempts: true,
      },
    })

    if (!attempt || attempt.userId !== user.id) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      )
    }

    const correctCount = attempt.questionAttempts.filter(
      (qa) => qa.isCorrect
    ).length
    const scorePercent = (correctCount / attempt.totalQuestions) * 100

    await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        finishedAt: new Date(),
        correctCount,
        scorePercent,
        totalTimeSec,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data' },
        { status: 400 }
      )
    }

    console.error('Error finishing attempt:', error)
    return NextResponse.json(
      { error: 'Failed to finish attempt' },
      { status: 500 }
    )
  }
}

