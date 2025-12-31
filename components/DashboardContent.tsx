'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { BarChart3, Clock, CheckCircle2, TrendingUp, Trash2, XCircle, X } from 'lucide-react'
import NT2ProgressDashboard from './NT2ProgressDashboard'

interface DashboardSummary {
  totalAttempts: number
  averageScore: number
  totalTimeSpent: number
  completedModels: number
  totalModels: number
  recentAttempts: Array<{
    id: string
    modelTitle: string
    score: number
    finishedAt: string
    modelKind: string
    totalQuestions: number
  }>
}

export default function DashboardContent() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [deletingAttemptId, setDeletingAttemptId] = useState<string | null>(null)
  const fetchingRef = useRef<Promise<void> | null>(null)
  
  // Read tab from URL query parameter, default to 'overview'
  const tabFromUrl = searchParams.get('tab') as 'overview' | 'nt2' | null
  const [activeTab, setActiveTab] = useState<'overview' | 'nt2'>(
    tabFromUrl === 'nt2' ? 'nt2' : 'overview'
  )
  
  // Sync tab state with URL when URL changes (e.g., after language switch)
  useEffect(() => {
    const tab = searchParams.get('tab') as 'overview' | 'nt2' | null
    if (tab === 'nt2' || tab === 'overview') {
      setActiveTab(tab)
    }
  }, [searchParams])


  const fetchSummary = useCallback(async (bypassCache = false) => {
    // Request deduplication: if already fetching, return existing promise
    if (fetchingRef.current && !bypassCache) {
      return fetchingRef.current
    }

    const promise = (async () => {
      try {
        setLoading(true)
        // Add cache-busting parameter if needed
        const url = bypassCache 
          ? `/api/dashboard/summary?t=${Date.now()}`
          : '/api/dashboard/summary'
        const res = await fetch(url, {
          cache: bypassCache ? 'no-store' : 'default',
        })
        const data = await res.json()
        setSummary(data)
      } catch (err) {
        console.error('Failed to fetch summary:', err)
      } finally {
        setLoading(false)
        fetchingRef.current = null
      }
    })()

    fetchingRef.current = promise
    return promise
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchSummary()
    
    // Also refresh after a short delay to ensure we get fresh data
    // This helps when navigating back from results page
    const timeoutId = setTimeout(() => {
      fetchSummary(true) // Bypass cache on delayed refresh
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [fetchSummary])

  // Refresh dashboard when component becomes visible or page gets focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh with cache bypass when page becomes visible
        fetchSummary(true)
      }
    }

    const handleFocus = () => {
      // Refresh when window gets focus (user returns to tab)
      fetchSummary(true)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchSummary])

  const handleClearHistory = async () => {
    if (!confirm(t('dashboard.confirmClearHistory'))) {
      return
    }

    try {
      setClearing(true)
      const res = await fetch('/api/dashboard/clear-history', {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to clear history')
      }

      await fetchSummary()
      alert(t('dashboard.historyCleared'))
    } catch (err) {
      console.error('Failed to clear history:', err)
      alert('Failed to clear history')
    } finally {
      setClearing(false)
    }
  }

  const handleDeleteAttempt = async (attemptId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation to attempt results

    if (!confirm(t('dashboard.confirmDeleteAttempt'))) {
      return
    }

    try {
      setDeletingAttemptId(attemptId)
      const res = await fetch(`/api/attempt/${attemptId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete attempt')
      }

      // Refresh summary to recalculate statistics
      await fetchSummary()
      alert(t('dashboard.attemptDeleted'))
    } catch (err) {
      console.error('Failed to delete attempt:', err)
      alert('Failed to delete attempt')
    } finally {
      setDeletingAttemptId(null)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-1 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/30 p-6 shadow-lg">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="h-10 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-lg">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border-2 bg-white p-5">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>{t('dashboard.noAttempts')}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className={`mb-8 flex items-center ${locale === 'ar' ? 'flex-row-reverse' : ''} justify-between`}>
        <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 via-purple-600 to-primary-600 bg-clip-text text-transparent mb-1.5">
            {t('dashboard.title')}
          </h2>
          <div className={`flex items-center gap-1.5 ${locale === 'ar' ? 'justify-end' : 'justify-start'}`}>
            <div className={`h-1 w-8 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 ${locale === 'ar' ? '' : ''}`}></div>
            <div className="h-1.5 w-1.5 rounded-full bg-primary-500"></div>
            <div className={`h-1 w-8 rounded-full bg-gradient-to-r from-purple-600 to-primary-600 ${locale === 'ar' ? '' : ''}`}></div>
          </div>
        </div>
        <div className="flex gap-1 rounded-xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/50 p-1.5 shadow-lg backdrop-blur-sm">
          <button
            onClick={() => {
              setActiveTab('overview')
              // Update URL without reloading to preserve state
              const params = new URLSearchParams(searchParams.toString())
              params.set('tab', 'overview')
              const url = `/dashboard?${params.toString()}`
              router.prefetch(url)
              router.push(url, { scroll: false })
            }}
            className={`relative rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md shadow-primary-500/30'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
            }`}
          >
            {t('dashboard.title')}
            {activeTab === 'overview' && (
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-600/20 to-purple-600/20 blur-sm -z-10"></div>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('nt2')
              // Update URL without reloading to preserve state
              const params = new URLSearchParams(searchParams.toString())
              params.set('tab', 'nt2')
              const url = `/dashboard?${params.toString()}`
              router.prefetch(url)
              router.push(url, { scroll: false })
            }}
            className={`relative rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'nt2'
                ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md shadow-primary-500/30'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
            }`}
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
          >
            {t('dashboard.nt2Progress')}
            {activeTab === 'nt2' && (
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-600/20 to-purple-600/20 blur-sm -z-10"></div>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'nt2' ? (
        <NT2ProgressDashboard />
      ) : (
        <>

      {/* Clear History Button */}
      <div className="mb-8 flex justify-end">
        <button
          onClick={handleClearHistory}
          disabled={clearing || summary?.totalAttempts === 0}
          className="flex items-center gap-2 rounded-xl border border-red-200/60 bg-gradient-to-br from-white to-red-50/30 px-5 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-all hover:border-red-300 hover:bg-red-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-sm"
        >
          <Trash2 className="h-4 w-4" />
          {t('dashboard.clearHistory')}
        </button>
      </div>

      <div className="mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
        <div className="group rounded-2xl border border-gray-200/60 bg-gradient-to-br from-white to-primary-50/30 p-6 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
          <div className="mb-3 flex items-center gap-2 w-full">
            {locale === 'ar' ? (
              <>
                <div className="rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 p-2 shadow-sm shrink-0">
                  <BarChart3 className="h-5 w-5 text-primary-600" />
                </div>
                <p className="text-sm font-semibold text-gray-600">{t('dashboard.totalAttempts')}</p>
              </>
            ) : (
              <>
                <div className="rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 p-2 shadow-sm">
                  <BarChart3 className="h-5 w-5 text-primary-600" />
                </div>
                <p className="text-sm font-semibold text-gray-600">{t('dashboard.totalAttempts')}</p>
              </>
            )}
          </div>
          <p className={`text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
            {summary.totalAttempts}
          </p>
        </div>

        <div className="group rounded-2xl border border-gray-200/60 bg-gradient-to-br from-white to-emerald-50/30 p-6 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
          <div className="mb-3 flex items-center gap-2 w-full">
            {locale === 'ar' ? (
              <>
                <div className="rounded-xl bg-gradient-to-br from-emerald-100 to-green-200 p-2 shadow-sm shrink-0">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-gray-600">{t('dashboard.averageScore')}</p>
              </>
            ) : (
              <>
                <div className="rounded-xl bg-gradient-to-br from-emerald-100 to-green-200 p-2 shadow-sm">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-gray-600">{t('dashboard.averageScore')}</p>
              </>
            )}
          </div>
          <p className={`text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
            {summary.averageScore.toFixed(1)}%
          </p>
        </div>

        <div className="group rounded-2xl border border-gray-200/60 bg-gradient-to-br from-white to-blue-50/30 p-6 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
          <div className="mb-3 flex items-center gap-2 w-full">
            {locale === 'ar' ? (
              <>
                <div className="rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 p-2 shadow-sm shrink-0">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-gray-600">{t('dashboard.timeSpent')}</p>
              </>
            ) : (
              <>
                <div className="rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 p-2 shadow-sm">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-gray-600">{t('dashboard.timeSpent')}</p>
              </>
            )}
          </div>
          <p className={`text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
            {Math.floor(summary.totalTimeSpent / 60)}m
          </p>
        </div>

        <div className="group rounded-2xl border border-gray-200/60 bg-gradient-to-br from-white to-purple-50/30 p-6 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
          <div className="mb-3 flex items-center gap-2 w-full">
            {locale === 'ar' ? (
              <>
                <div className="rounded-xl bg-gradient-to-br from-purple-100 to-pink-200 p-2 shadow-sm shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm font-semibold text-gray-600">{t('dashboard.completedModels')}</p>
              </>
            ) : (
              <>
                <div className="rounded-xl bg-gradient-to-br from-purple-100 to-pink-200 p-2 shadow-sm">
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm font-semibold text-gray-600">{t('dashboard.completedModels')}</p>
              </>
            )}
          </div>
          <p className={`text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
            {summary.completedModels} / {summary.totalModels}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-lg">
        <div className={`mb-6 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {t('dashboard.recentAttempts')}
          </h3>
          <div className={`h-1 w-16 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 ${locale === 'ar' ? 'ml-auto' : ''}`}></div>
        </div>
        {summary.recentAttempts.length === 0 ? (
          <div className="rounded-xl border border-gray-200/60 bg-gray-50/50 p-8 text-center">
            <p className="text-gray-500 font-medium">{t('dashboard.noAttempts')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {summary.recentAttempts.map((attempt) => {
              const isExam = attempt.modelKind === 'EXAM' || attempt.totalQuestions === 36
              const requiredPassPercent = isExam ? 63.89 : 66.67
              const isPass = attempt.score >= requiredPassPercent
              return (
                <div
                  key={attempt.id}
                  className="group relative w-full overflow-visible rounded-2xl border-2 bg-white p-5 shadow-md transition-all hover:shadow-xl hover:scale-[1.01]"
                  style={{
                    borderLeft: `4px solid ${isPass ? '#10b981' : '#ef4444'}`,
                    borderColor: isPass ? '#d1fae5' : '#fee2e2',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => {
                        const url = `/attempt/${attempt.id}/results`
                        router.prefetch(url)
                        router.push(url)
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                                isPass
                                  ? 'bg-gradient-to-br from-emerald-100 to-green-200 text-emerald-700'
                                  : 'bg-gradient-to-br from-rose-100 to-red-200 text-rose-700'
                              }`}
                            >
                              {isPass ? (
                                <CheckCircle2 className="h-6 w-6" />
                              ) : (
                                <XCircle className="h-6 w-6" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-gray-500 mb-1">
                                {new Date(attempt.finishedAt).toLocaleDateString()}
                              </p>
                              <p className="text-base font-bold text-gray-900 truncate">
                                {attempt.modelTitle}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <p
                            className={`text-3xl font-bold ${
                              isPass ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {attempt.score.toFixed(1)}%
                          </p>
                          <div
                            className={`rounded-full px-4 py-1.5 text-xs font-bold shadow-sm ${
                              isPass
                                ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700'
                                : 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-700'
                            }`}
                          >
                            {isPass ? t('dashboard.geslaagd') : t('dashboard.gezakt')}
                          </div>
                          {!isPass && (
                            <p className="mt-1 text-xs font-medium text-gray-500">
                              {t('dashboard.requiredToPass')} {requiredPassPercent.toFixed(2)}%
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteAttempt(attempt.id, e)
                      }}
                      disabled={deletingAttemptId === attempt.id}
                      className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-red-500 text-white shadow-lg transition-all hover:bg-red-600 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation"
                      title={t('dashboard.deleteAttempt')}
                      aria-label={t('dashboard.deleteAttempt')}
                    >
                      {deletingAttemptId === attempt.id ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : (
                        <X className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  )
}

