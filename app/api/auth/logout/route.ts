import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { clearSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('session_token')?.value

  if (token) {
    await clearSession(token)
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete('session_token')

  return response
}

