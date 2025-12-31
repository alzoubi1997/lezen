import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { tagWrongReasonSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { questionAttemptId, wrongReasonTag } = tagWrongReasonSchema.parse(body)

    // Verify question attempt belongs to user's attempt
    const questionAttempt = await prisma.questionAttempt.findUnique({
      where: { id: questionAttemptId },
      include: {
        attempt: true,
      },
    })

    if (!questionAttempt || questionAttempt.attempt.userId !== user.id) {
      return NextResponse.json(
        { error: 'Question attempt not found' },
        { status: 404 }
      )
    }

    await prisma.questionAttempt.update({
      where: { id: questionAttemptId },
      data: {
        wrongReasonTag: wrongReasonTag as any,
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

    console.error('Error tagging wrong reason:', error)
    return NextResponse.json(
      { error: 'Failed to tag wrong reason' },
      { status: 500 }
    )
  }
}

