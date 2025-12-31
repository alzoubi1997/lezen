import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPin, createSession } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { handle, pin } = loginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { handle },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Ongeldig Profiel ID of PIN' },
        { status: 401 }
      )
    }

    const isValid = await verifyPin(pin, user.pinHash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Ongeldig Profiel ID of PIN' },
        { status: 401 }
      )
    }

    const token = await createSession(user.id)

    const response = NextResponse.json(
      { success: true },
      { status: 200 }
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

