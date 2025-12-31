import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPin } from '@/lib/auth'
import { generateHandle } from '@/lib/utils'
import { createProfileSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prefix, pin } = createProfileSchema.parse(body)

    const handle = generateHandle(prefix)
    const pinHash = await hashPin(pin)

    const user = await prisma.user.create({
      data: {
        handle,
        pinHash,
        locale: 'nl',
      },
    })

    // Create session
    const { createSession } = await import('@/lib/auth')
    const token = await createSession(user.id)

    const response = NextResponse.json(
      { handle: user.handle },
      { status: 201 }
    )

    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Ongeldige gegevens' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Er is iets misgegaan' },
      { status: 500 }
    )
  }
}

