import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Run both queries in parallel for better performance
    const [totalVisits, visitsLast30Days] = await Promise.all([
      prisma.visit.count(),
      prisma.visit.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
    ])

    // Ensure totalVisits is always >= visitsLast30Days (logical consistency)
    // This prevents display issues where total appears less than a subset
    // This can happen due to race conditions, timezone issues, or data inconsistencies
    const correctedTotalVisits = Math.max(totalVisits, visitsLast30Days)

    // Log if correction was needed for debugging
    if (correctedTotalVisits !== totalVisits) {
      console.warn(
        `Visit stats correction: totalVisits (${totalVisits}) was less than visitsLast30Days (${visitsLast30Days}), corrected to ${correctedTotalVisits}`
      )
    }

    return NextResponse.json({
      totalVisits: correctedTotalVisits,
      visitsLast30Days,
    })
  } catch (error) {
    console.error('Error fetching visit stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch visit stats' },
      { status: 500 }
    )
  }
}

