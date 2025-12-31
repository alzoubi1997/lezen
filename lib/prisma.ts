import { PrismaClient } from '@prisma/client'

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  const error = new Error(
    'DATABASE_URL environment variable is not set. ' +
    'Please set it in your .env file or Vercel environment variables.'
  )
  console.error('[PRISMA] Configuration error:', error.message)
  throw error
}

// Validate DATABASE_URL format
const dbUrl = process.env.DATABASE_URL
if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://') && !dbUrl.startsWith('file:')) {
  console.warn('[PRISMA] Warning: DATABASE_URL does not start with expected prefix (postgresql://, postgres://, or file:)')
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error'],
  })
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    })
  }
  prisma = globalForPrisma.prisma
}

/**
 * Test database connection
 * @returns Promise<boolean> - true if connection successful, false otherwise
 */
export async function testDatabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$connect()
    // Test with a simple query
    await prisma.$queryRaw`SELECT 1`
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Database connection failed',
    }
  }
}

export { prisma }
