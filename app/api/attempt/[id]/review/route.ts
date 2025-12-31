import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const attempt = await prisma.attempt.findUnique({
      where: { id: params.id },
      include: {
        model: true,
      },
    })

    if (!attempt || attempt.userId !== user.id) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      )
    }

    const texts = await prisma.text.findMany({
      where: { modelId: attempt.modelId },
      orderBy: { orderIndex: 'asc' },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            questionAttempts: {
              where: { attemptId: attempt.id },
            },
          },
        },
      },
    })

    const textsWithAttempts = texts.map((text) => ({
      ...text,
      questions: text.questions.map((q) => ({
        ...q,
        type: q.type as 'INFO' | 'MAIN_IDEA' | 'INFERENCE' | 'TONE' | 'INTENT' | 'PARAPHRASE' | 'NEGATION',
        questionAttempt: q.questionAttempts[0] ? {
          id: q.questionAttempts[0].id,
          chosenIndex: q.questionAttempts[0].chosenIndex,
          isCorrect: q.questionAttempts[0].isCorrect,
          timeSpentSec: q.questionAttempts[0].timeSpentSec,
          flagged: q.questionAttempts[0].flagged,
          confidence: q.questionAttempts[0].confidence,
          wrongReasonTag: q.questionAttempts[0].wrongReasonTag as 'SYNONYM_MISS' | 'NEGATION_MISS' | 'MAIN_IDEA' | 'INFERENCE_JUMP' | 'TIME_PRESSURE' | 'CARELESS' | null,
        } : undefined,
      })),
    }))

    return NextResponse.json({
      id: attempt.id,
      mode: attempt.mode,
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt,
      totalQuestions: attempt.totalQuestions,
      correctCount: attempt.correctCount,
      scorePercent: attempt.scorePercent,
      totalTimeSec: attempt.totalTimeSec,
      model: {
        id: attempt.model.id,
        kind: attempt.model.kind,
        number: attempt.model.number,
        titleNl: attempt.model.titleNl,
        titleAr: attempt.model.titleAr,
      },
      texts: textsWithAttempts,
    })
  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    )
  }
}

