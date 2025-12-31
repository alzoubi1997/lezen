import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const kind = searchParams.get('kind') || 'EXAM'

  try {
    // Optimize: Fetch models with text/question counts in parallel
    const [models, userCompletions] = await Promise.all([
      prisma.model.findMany({
        where: { kind },
        orderBy: { number: 'asc' },
        select: {
          id: true,
          kind: true,
          number: true,
          titleNl: true,
          titleAr: true,
          totalTimeSec: true,
          texts: {
            select: {
              id: true,
              questions: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      }),
      prisma.modelCompletion.findMany({
        where: {
          userId: user.id,
          model: { kind },
        },
        select: {
          modelId: true,
          done: true,
        },
      }),
    ])

    // Create map for O(1) lookup
    const completionMap = new Map(
      userCompletions.map((c) => [c.modelId, c.done])
    )

    const modelsWithDone = models.map((model) => {
      const textCount = model.texts?.length ?? 0
      const questionCount = (model.texts ?? []).reduce(
        (sum, text) => sum + (text.questions?.length ?? 0),
        0
      )
      
      return {
        id: model.id,
        kind: model.kind,
        number: model.number,
        titleNl: model.titleNl,
        titleAr: model.titleAr,
        totalTimeSec: model.totalTimeSec,
        done: completionMap.get(model.id) || false,
        textCount: textCount || 0,
        questionCount: questionCount || 0,
      }
    })

    // Cache for 30 seconds - models don't change frequently
    return NextResponse.json(
      { models: modelsWithDone },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}

