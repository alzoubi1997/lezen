import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    if (!sessionToken) {
      return null
    }

    const tokenHash = hashToken(sessionToken)

    // Optimize: Use findUnique with indexed field if available, or findFirst with better query
    const session = await prisma.session.findFirst({
      where: {
        tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            handle: true,
            locale: true,
            // Only select needed fields to reduce data transfer
          },
        },
      },
    })

    if (!session) {
      return null
    }

    return session.user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  })

  return token
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}

export async function clearSession(token: string) {
  const tokenHash = hashToken(token)
  await prisma.session.deleteMany({
    where: {
      tokenHash,
    },
  })
}

