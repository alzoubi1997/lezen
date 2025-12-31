import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get or create daily 10 selection
    // For simplicity, we'll just get 10 random wrong questions
    // In production, you'd want to store this selection and reset it daily

    const allErrors = await prisma.questionAttempt.findMany({
      where: {
        attempt: {
          userId: user.id,
        },
        isCorrect: false,
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
    })

    // Shuffle and take 10
    const shuffled = allErrors.sort(() => 0.5 - Math.random())
    const daily10 = shuffled.slice(0, 10)

    const cookieStore = await cookies()
    const locale = (cookieStore.get('locale')?.value || 'nl') as 'nl' | 'ar'

    const questions = daily10.map((qa) => {
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

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error fetching daily 10:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily 10' },
      { status: 500 }
    )
  }
}

