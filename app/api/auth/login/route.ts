import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPin, createSession } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[LOGIN] Request received')
  
  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('[LOGIN] DATABASE_URL is not set')
    return NextResponse.json(
      { 
        error: 'Database niet geconfigureerd. Voeg DATABASE_URL toe in Vercel Environment Variables.',
        details: 'Ga naar Vercel Dashboard → Settings → Environment Variables → Voeg DATABASE_URL toe'
      },
      { status: 503 }
    )
  }
  
  try {
    // Log request body
    const body = await request.json()
    console.log('[LOGIN] Request body:', {
      handle: body.handle,
      handleType: typeof body.handle,
      pin: '***', // Don't log actual PIN
      pinLength: body.pin?.length,
    })
    
    // Validate input
    console.log('[LOGIN] Validating input...')
    let validatedData
    try {
      validatedData = loginSchema.parse(body)
      console.log('[LOGIN] Validation passed:', {
        handle: validatedData.handle,
        pinLength: validatedData.pin?.length,
      })
    } catch (validationError: any) {
      console.error('[LOGIN] Validation failed:', {
        error: validationError.name,
        errors: validationError.errors,
        receivedBody: body,
      })
      throw validationError
    }
    
    const { handle, pin } = validatedData

    // Check database connection
    console.log('[LOGIN] Checking database connection...')
    try {
      await prisma.$connect()
      console.log('[LOGIN] Database connected')
    } catch (dbError: any) {
      console.error('[LOGIN] Database connection failed:', {
        code: dbError.code,
        message: dbError.message,
      })
      throw dbError
    }

    // Find user
    console.log('[LOGIN] Looking up user with handle:', handle)
    const user = await prisma.user.findUnique({
      where: { handle },
    })

    if (!user) {
      console.log('[LOGIN] User not found for handle:', handle)
      return NextResponse.json(
        { error: 'Ongeldig Profiel ID of PIN' },
        { status: 401 }
      )
    }
    console.log('[LOGIN] User found:', { id: user.id, handle: user.handle })

    // Verify PIN
    console.log('[LOGIN] Verifying PIN...')
    const isValid = await verifyPin(pin, user.pinHash)
    if (!isValid) {
      console.log('[LOGIN] PIN verification failed')
      return NextResponse.json(
        { error: 'Ongeldig Profiel ID of PIN' },
        { status: 401 }
      )
    }
    console.log('[LOGIN] PIN verified successfully')

    // Create session
    console.log('[LOGIN] Creating session...')
    const token = await createSession(user.id)
    console.log('[LOGIN] Session created successfully')

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

    const duration = Date.now() - startTime
    console.log(`[LOGIN] Success - Completed in ${duration}ms`)
    return response
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`[LOGIN] Error after ${duration}ms:`, {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      meta: error.meta,
      cause: error.cause,
    })
    
    if (error.name === 'ZodError') {
      console.error('Validation error:', error.errors)
      return NextResponse.json(
        { error: 'Ongeldige gegevens' },
        { status: 400 }
      )
    }

    // Handle database connection errors
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database') || error.message?.includes('connect')) {
      console.error('Database connection error:', error.message)
      return NextResponse.json(
        { error: 'Database verbinding mislukt. Controleer de database instellingen.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Er is iets misgegaan',
        details: error.message || 'Onbekende fout opgetreden',
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    )
  }
}

