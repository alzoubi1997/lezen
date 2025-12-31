import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { toggleDoneSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { modelId, done } = toggleDoneSchema.parse(body)

    await prisma.modelCompletion.upsert({
      where: {
        userId_modelId: {
          userId: user.id,
          modelId,
        },
      },
      update: {
        done,
        doneAt: done ? new Date() : null,
      },
      create: {
        userId: user.id,
        modelId,
        done,
        doneAt: done ? new Date() : null,
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

    return NextResponse.json(
      { error: 'Failed to toggle done' },
      { status: 500 }
    )
  }
}

