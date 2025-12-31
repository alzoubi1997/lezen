'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Users, TrendingUp } from 'lucide-react'

interface VisitStats {
  totalVisits: number
  visitsLast30Days: number
}

export default function VisitStats() {
  const t = useTranslations()
  const locale = useLocale() as 'nl' | 'ar'
  const [stats, setStats] = useState<VisitStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Record this visit first, then fetch stats after a short delay
    // to ensure the visit is saved before counting
    fetch('/api/visits/record', { method: 'POST' })
      .then(() => {
        // Small delay to ensure visit is committed to database
        return new Promise(resolve => setTimeout(resolve, 100))
      })
      .then(() => {
        // Fetch visit statistics with cache-busting
        return fetch('/api/visits/stats', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
      })
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch visit stats:', err)
        setLoading(false)
      })
  }, [])

  // Always show the component, default to 0 if no data or error
  const visitsLast30Days = (stats && !('error' in stats)) ? (stats.visitsLast30Days ?? 0) : 0
  const totalVisits = (stats && !('error' in stats)) ? (stats.totalVisits ?? 0) : 0

  if (loading) {
    return (
      <div className="mb-8 rounded-2xl border-2 border-blue-300/60 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-300/30 via-indigo-300/20 to-transparent rounded-full blur-3xl -z-0"></div>
        <div className="absolute -bottom-5 -left-5 w-32 h-32 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-full blur-2xl -z-0"></div>
        <div className={`flex items-center gap-3 mb-6 relative z-10 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          <div className="rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-2.5 shadow-lg flex-shrink-0">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg md:text-xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('home.websiteStats')}</h3>
            <div className={`mt-1 h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 ${locale === 'ar' ? 'ml-auto' : ''}`}></div>
          </div>
        </div>
        <div className="animate-pulse relative z-10">
          <div className="grid grid-cols-1 gap-5">
            <div className="bg-white/90 rounded-xl p-5 border-2 border-blue-200/60 shadow-lg">
              <div className="h-4 w-32 bg-gray-300 rounded mb-3"></div>
              <div className="h-10 w-24 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8 rounded-2xl border-2 border-blue-300/60 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 p-6 shadow-xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-300/30 via-indigo-300/20 to-transparent rounded-full blur-3xl -z-0"></div>
      <div className="absolute -bottom-5 -left-5 w-32 h-32 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-full blur-2xl -z-0"></div>
      <div className={`flex items-center gap-3 mb-6 relative z-10 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className="rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-2.5 shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg md:text-xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('home.websiteStats')}</h3>
          <div className={`mt-1 h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 ${locale === 'ar' ? 'ml-auto' : ''}`}></div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 relative z-10">
        <div className="group relative bg-white/90 rounded-xl p-5 border-2 border-blue-200/60 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
          <div className="absolute -top-5 -right-5 w-24 h-24 bg-gradient-to-br from-blue-200/30 via-indigo-200/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 -z-0"></div>
          <div className={`flex items-center gap-2 mb-3 relative z-10 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className="rounded-lg bg-gradient-to-br from-blue-200 via-indigo-300 to-purple-200 p-1.5 shadow-md group-hover:shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Users className="h-4 w-4 text-blue-700 group-hover:text-blue-800 transition-colors" />
            </div>
            <span className={`text-sm font-bold text-gray-800 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('home.totalSinceLaunch')}</span>
          </div>
          <p className={`text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1 group-hover:scale-105 transition-transform duration-300 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
            {totalVisits.toLocaleString()}
          </p>
          <p className={`text-xs font-bold text-gray-700 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('home.visits')}</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
        </div>
      </div>
    </div>
  )
}

