import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startAttemptSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { modelId, mode } = startAttemptSchema.parse(body)

    // Optimize: Only fetch what we need - count questions directly in database
    const [model, questionCount] = await Promise.all([
      prisma.model.findUnique({
        where: { id: modelId },
        select: {
          id: true,
          titleNl: true,
        },
      }),
      prisma.question.count({
        where: {
          text: {
            modelId: modelId,
          },
        },
      }),
    ])

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    const totalQuestions = questionCount

    const attempt = await prisma.attempt.create({
      data: {
        userId: user.id,
        modelId,
        mode,
        totalQuestions,
      },
    })

    return NextResponse.json({ attemptId: attempt.id })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data' },
        { status: 400 }
      )
    }

    console.error('Error starting attempt:', error)
    return NextResponse.json(
      { error: 'Failed to start attempt' },
      { status: 500 }
    )
  }
}

