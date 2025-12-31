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
      <div className="mb-8 rounded-2xl border-2 border-gradient-to-r from-violet-400/40 via-purple-400/40 to-fuchsia-400/40 bg-gradient-to-br from-violet-50/80 via-purple-50/60 to-fuchsia-50/40 p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-violet-400/40 via-purple-400/30 to-fuchsia-400/20 rounded-full blur-3xl animate-pulse -z-0"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-fuchsia-400/30 via-purple-400/20 to-violet-400/20 rounded-full blur-3xl animate-pulse -z-0" style={{ animationDelay: '1s' }}></div>
        <div className="animate-pulse relative z-10">
          <div className="bg-gradient-to-br from-white via-violet-50/30 to-purple-50/20 rounded-xl p-6 border-2 border-violet-200/60 shadow-xl">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-10 w-10 bg-gray-300 rounded-xl mb-4"></div>
              <div className="h-4 w-40 bg-gray-300 rounded mb-3"></div>
              <div className="h-12 w-24 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 w-20 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8 rounded-2xl border-2 border-gradient-to-r from-violet-400/40 via-purple-400/40 to-fuchsia-400/40 bg-gradient-to-br from-violet-50/80 via-purple-50/60 to-fuchsia-50/40 p-5 shadow-xl relative overflow-hidden group hover:shadow-violet-500/20 transition-all duration-500">
      {/* Animated background gradients */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-violet-400/40 via-purple-400/30 to-fuchsia-400/20 rounded-full blur-3xl animate-pulse -z-0"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-fuchsia-400/30 via-purple-400/20 to-violet-400/20 rounded-full blur-3xl animate-pulse -z-0" style={{ animationDelay: '1s' }}></div>
      
      {/* Stats Card - Centered */}
      <div className="relative z-10">
        <div className="group relative bg-gradient-to-br from-white via-violet-50/30 to-purple-50/20 rounded-xl p-6 border-2 border-violet-200/60 shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] hover:border-violet-300/80 transition-all duration-500 overflow-hidden backdrop-blur-sm">
          {/* Animated glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-purple-500/0 to-fuchsia-500/0 group-hover:from-violet-500/10 group-hover:via-purple-500/10 group-hover:to-fuchsia-500/10 transition-all duration-500 -z-0"></div>
          
          {/* Floating particles effect */}
          <div className="absolute top-2 right-2 w-20 h-20 bg-gradient-to-br from-violet-300/40 via-purple-300/30 to-fuchsia-300/40 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-60 transition-all duration-700 -z-0"></div>
          <div className="absolute bottom-2 left-2 w-16 h-16 bg-gradient-to-tr from-fuchsia-300/30 via-purple-300/20 to-violet-300/30 rounded-full blur-xl group-hover:scale-125 group-hover:opacity-50 transition-all duration-700 -z-0"></div>
          
          {/* Content - Centered */}
          <div className="flex flex-col items-center justify-center text-center relative z-10">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500 blur-md opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
              <div className="relative rounded-xl bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 p-2.5 shadow-lg group-hover:shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Users className="h-5 w-5 text-white drop-shadow-sm" />
              </div>
            </div>
            
            <span className="text-sm font-bold text-gray-800 group-hover:text-gray-900 transition-colors mb-3">
              {t('home.totalSinceLaunch')}
            </span>
            
            <p className="text-5xl md:text-6xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-2 group-hover:scale-105 transition-transform duration-300 drop-shadow-sm">
              {totalVisits.toLocaleString()}
            </p>
            
            <p className="text-xs font-bold text-gray-600 group-hover:text-gray-700 transition-colors uppercase tracking-wider">
              {t('home.visits')}
            </p>
          </div>
          
          {/* Animated bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center shadow-lg"></div>
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 -z-0"></div>
        </div>
      </div>
    </div>
  )
}

