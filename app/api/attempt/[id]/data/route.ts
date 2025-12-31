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
        questionAttempt: q.questionAttempts[0] || undefined,
      })),
    }))

    return NextResponse.json({
      attempt,
      texts: textsWithAttempts,
    })
  } catch (error) {
    console.error('Error fetching attempt data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attempt data' },
      { status: 500 }
    )
  }
}

