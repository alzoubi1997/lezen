import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      database: {
        status: 'unknown',
        message: '',
        connectionString: process.env.DATABASE_URL ? 'set' : 'missing',
      },
      prisma: {
        status: 'unknown',
        message: '',
      },
    },
  }

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    health.status = 'error'
    health.checks.database.status = 'error'
    health.checks.database.message = 'DATABASE_URL environment variable is not set'
    return NextResponse.json(health, { status: 503 })
  }

  // Test Prisma connection
  try {
    await prisma.$connect()
    health.checks.database.status = 'ok'
    health.checks.database.message = 'Database connection successful'
    health.checks.prisma.status = 'ok'
    health.checks.prisma.message = 'Prisma client initialized'
    
    // Test a simple query
    await prisma.$queryRaw`SELECT 1`
    health.checks.database.message = 'Database connection and query successful'
  } catch (error: any) {
    health.status = 'error'
    health.checks.database.status = 'error'
    health.checks.database.message = error.message || 'Database connection failed'
    health.checks.prisma.status = 'error'
    health.checks.prisma.message = error.message || 'Prisma error'
    
    return NextResponse.json(health, { status: 503 })
  } finally {
    await prisma.$disconnect()
  }

  return NextResponse.json(health, { status: 200 })
}

