import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { saveAnswerSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = saveAnswerSchema.parse(body)

    // Verify attempt belongs to user
    const attempt = await prisma.attempt.findUnique({
      where: { id: data.attemptId },
    })

    if (!attempt || attempt.userId !== user.id) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      )
    }

    // Prevent saving answers if attempt is already finished
    if (attempt.finishedAt) {
      return NextResponse.json(
        { error: 'Cannot modify answers after submission' },
        { status: 403 }
      )
    }

    // Get question to check correct answer
    const question = await prisma.question.findUnique({
      where: { id: data.questionId },
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    const isCorrect =
      data.chosenIndex !== null &&
      data.chosenIndex === question.correctIndex

    // Upsert question attempt
    await prisma.questionAttempt.upsert({
      where: {
        attemptId_questionId: {
          attemptId: data.attemptId,
          questionId: data.questionId,
        },
      },
      update: {
        chosenIndex: data.chosenIndex,
        isCorrect,
        timeSpentSec: data.timeSpentSec ?? 0,
        flagged: data.flagged ?? false,
        confidence: data.confidence ?? null,
      },
      create: {
        attemptId: data.attemptId,
        questionId: data.questionId,
        chosenIndex: data.chosenIndex,
        isCorrect,
        timeSpentSec: data.timeSpentSec ?? 0,
        flagged: data.flagged ?? false,
        confidence: data.confidence ?? null,
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

    console.error('Error saving answer:', error)
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    )
  }
}

