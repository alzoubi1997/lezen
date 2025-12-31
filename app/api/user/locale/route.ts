import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { locale } = body

    if (locale !== 'nl' && locale !== 'ar') {
      return NextResponse.json(
        { error: 'Invalid locale' },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { locale },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating locale:', error)
    return NextResponse.json(
      { error: 'Failed to update locale' },
      { status: 500 }
    )
  }
}

