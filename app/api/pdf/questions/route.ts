import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateQuestionsOnlyPDF } from '@/lib/pdf-generator'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const attemptId = searchParams.get('attemptId')

    if (!attemptId) {
      return NextResponse.json(
        { error: 'attemptId is required' },
        { status: 400 }
      )
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
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
        },
      },
    })

    const textsWithQuestions = texts.map((text) => ({
      ...text,
      questions: text.questions.map((q) => ({
        ...q,
        type: q.type as 'INFO' | 'MAIN_IDEA' | 'INFERENCE' | 'TONE' | 'INTENT' | 'PARAPHRASE' | 'NEGATION',
        questionAttempt: undefined, // No attempt data needed
      })),
    }))

    // Always use Dutch for PDF downloads, regardless of site language
    const locale = 'nl' as const

    const review = {
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
      texts: textsWithQuestions,
    }

    const pdfBytes = await generateQuestionsOnlyPDF(review, locale)

    // Generate descriptive filename
    const modelTitle = attempt.model.titleNl || `Examen ${attempt.model.number}`
    const pdfType = 'Questions'
    const baseName = `${modelTitle} - ${pdfType}`.replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, ' ')
    const filename = `${baseName}.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

