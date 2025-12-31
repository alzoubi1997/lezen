import { PrismaClient } from '@prisma/client'

// Note: We don't validate DATABASE_URL at module load time to avoid build errors
// Validation happens at runtime in API routes and via testDatabaseConnection()

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
 * Validate DATABASE_URL is set (runtime check)
 * @throws Error if DATABASE_URL is not set
 */
function validateDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please set it in your .env file or Vercel environment variables.'
    )
  }
}

/**
 * Test database connection
 * @returns Promise<boolean> - true if connection successful, false otherwise
 */
export async function testDatabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    validateDatabaseUrl()
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
