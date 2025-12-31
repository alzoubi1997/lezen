import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const tag = searchParams.get('tag')

    const questionAttempts = await prisma.questionAttempt.findMany({
      where: {
        attempt: {
          userId: user.id,
        },
        isCorrect: false,
        ...(tag && { wrongReasonTag: tag as any }),
      },
      include: {
        question: {
          include: {
            text: {
              include: {
                model: true,
              },
            },
          },
        },
        attempt: true,
      },
      orderBy: {
        attempt: {
          finishedAt: 'desc',
        },
      },
    })

    const cookieStore = await cookies()
    const locale = (cookieStore.get('locale')?.value || 'nl') as 'nl' | 'ar'

    const errors = questionAttempts.map((qa) => {
      const prompt =
        locale === 'ar' ? qa.question.promptAr : qa.question.promptNl
      const options = JSON.parse(qa.question.optionsJson) as string[]

      return {
        id: qa.id,
        questionId: qa.questionId,
        attemptId: qa.attemptId,
        modelTitle:
          locale === 'ar'
            ? qa.question.text.model.titleAr
            : qa.question.text.model.titleNl,
        prompt,
        options,
        chosenIndex: qa.chosenIndex,
        correctIndex: qa.question.correctIndex,
        explanation:
          locale === 'ar'
            ? qa.question.explanationAr
            : qa.question.explanationNl,
        wrongReasonTag: qa.wrongReasonTag,
        finishedAt: qa.attempt.finishedAt?.toISOString() || '',
      }
    })

    return NextResponse.json({ errors })
  } catch (error) {
    console.error('Error fetching errors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch errors' },
      { status: 500 }
    )
  }
}

