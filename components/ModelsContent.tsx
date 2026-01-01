'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Circle, Play, Download, X } from 'lucide-react'

interface Model {
  id: string
  kind: string
  number: number
  titleNl: string
  titleAr: string
  totalTimeSec: number
  done: boolean
  textCount?: number
  questionCount?: number
}

export default function ModelsContent({ initialKind }: { initialKind?: string }) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [models, setModels] = useState<Model[]>([])
  
  // Read tab from URL query parameter, fallback to initialKind prop, default to 'EXAM'
  const kindFromUrl = searchParams.get('kind')
  const initialTab = (kindFromUrl === 'PRACTICE' || initialKind === 'PRACTICE') ? 'PRACTICE' : 'EXAM'
  const [activeTab, setActiveTab] = useState<'EXAM' | 'PRACTICE'>(initialTab)
  const [loading, setLoading] = useState(true)
  const fetchingRef = useRef<Promise<void> | null>(null)
  
  // Sync tab state with URL when URL changes (e.g., after language switch)
  useEffect(() => {
    const kind = searchParams.get('kind')
    if (kind === 'PRACTICE' || kind === 'EXAM') {
      setActiveTab(kind)
    } else if (initialKind === 'PRACTICE' || initialKind === 'EXAM') {
      setActiveTab(initialKind)
    }
  }, [searchParams, initialKind])

  const fetchModels = useCallback(async () => {
    // Request deduplication: if already fetching, return existing promise
    if (fetchingRef.current) {
      return fetchingRef.current
    }

    const promise = (async () => {
      setLoading(true)
      try {
        // API route has caching headers, browser will cache automatically
        const res = await fetch(`/api/models?kind=${activeTab}`)
        const data = await res.json()
        setModels(data.models || [])
      } catch (err) {
        console.error('Failed to fetch models:', err)
      } finally {
        setLoading(false)
        fetchingRef.current = null
      }
    })()

    fetchingRef.current = promise
    return promise
  }, [activeTab])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  const toggleDone = async (modelId: string, currentDone: boolean) => {
    try {
      await fetch('/api/model/toggle-done', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, done: !currentDone }),
      })
      fetchModels()
    } catch (err) {
      console.error('Failed to toggle done:', err)
    }
  }

  const [showStartOptions, setShowStartOptions] = useState<string | null>(null)
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const downloadPDF = async (modelId: string, type: 'full' | 'questions') => {
    setDownloadError(null)
    setDownloadingModelId(modelId)
    
    try {
      // Create temporary attempt for PDF generation
      const res = await fetch('/api/attempt/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, mode: activeTab }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        if (res.status === 401) {
          setDownloadError(locale === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Je moet eerst inloggen')
          setTimeout(() => setDownloadError(null), 5000)
          return
        }
        setDownloadError(errorData.error || (locale === 'ar' ? 'فشل التحميل' : 'Download mislukt'))
        setTimeout(() => setDownloadError(null), 5000)
        return
      }

      const data = await res.json()
      if (!data.attemptId) {
        setDownloadError(locale === 'ar' ? 'فشل في إنشاء المحاولة' : 'Kon poging niet aanmaken')
        setTimeout(() => setDownloadError(null), 5000)
        return
      }

      // Build PDF URL
      const pdfUrl = type === 'questions' 
        ? `/api/pdf/questions?attemptId=${data.attemptId}`
        : `/api/pdf/full?attemptId=${data.attemptId}&includeText=true`

      // Try to download using fetch + blob (more reliable than window.open)
      try {
        const pdfRes = await fetch(pdfUrl, {
          credentials: 'include', // Include cookies for authentication
        })

        if (!pdfRes.ok) {
          if (pdfRes.status === 401) {
            setDownloadError(locale === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Je moet eerst inloggen')
          } else if (pdfRes.status === 404) {
            setDownloadError(locale === 'ar' ? 'الملف غير موجود' : 'Bestand niet gevonden')
          } else {
            setDownloadError(locale === 'ar' ? 'فشل في تحميل الملف' : 'Kon bestand niet downloaden')
          }
          setTimeout(() => setDownloadError(null), 5000)
          return
        }

        const blob = await pdfRes.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = pdfRes.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `download-${type}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } catch (fetchError) {
        // Fallback to window.open if fetch fails
        console.warn('Fetch download failed, trying window.open:', fetchError)
        window.open(pdfUrl, '_blank')
      }
    } catch (err) {
      console.error('Failed to download PDF:', err)
      setDownloadError(locale === 'ar' ? 'حدث خطأ أثناء التحميل' : 'Er is een fout opgetreden bij het downloaden')
      setTimeout(() => setDownloadError(null), 5000)
    } finally {
      setDownloadingModelId(null)
    }
  }

  const [startingModelId, setStartingModelId] = useState<string | null>(null)

  const startModel = async (modelId: string, mode: 'EXAM' | 'PRACTICE') => {
    if (startingModelId) return // Prevent double-click
    
    try {
      setStartingModelId(modelId)
      // Start API call immediately
      const res = await fetch('/api/attempt/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, mode }),
      })
      const data = await res.json()
      if (data.attemptId) {
        const url = `/attempt/${data.attemptId}`
        // Prefetch and navigate immediately
        router.prefetch(url)
        router.push(url, { scroll: false })
      }
    } catch (err) {
      console.error('Failed to start attempt:', err)
    } finally {
      setStartingModelId(null)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-1 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="mb-6 flex gap-1 rounded-xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/50 p-1.5 shadow-lg">
          <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border-2 border-gray-200/60 bg-gradient-to-br from-white via-gray-50/30 to-white p-6 shadow-lg">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {downloadError && (
        <div className={`mb-6 rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-red-100/50 px-4 py-3 shadow-lg ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <p className="text-sm font-bold text-red-700">{downloadError}</p>
          </div>
        </div>
      )}
      <div className={`mb-8 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
          {t('models.title')}
        </h2>
        <div className={`mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 ${locale === 'ar' ? 'ml-auto' : ''}`}></div>
      </div>

      <div className={`mb-6 flex gap-1 rounded-xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/50 p-1.5 shadow-lg backdrop-blur-sm ${locale === 'ar' ? 'justify-end' : 'justify-start'}`}>
        <button
          onClick={() => {
            setActiveTab('EXAM')
            // Update URL without reloading to preserve state
            const params = new URLSearchParams(searchParams.toString())
            params.set('kind', 'EXAM')
            const url = `/models?${params.toString()}`
            router.prefetch(url)
            router.push(url, { scroll: false })
          }}
          className={`relative rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'EXAM'
              ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md shadow-primary-500/30'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          {t('models.exams')}
          {activeTab === 'EXAM' && (
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-600/20 to-purple-600/20 blur-sm -z-10"></div>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('PRACTICE')
            // Update URL without reloading to preserve state
            const params = new URLSearchParams(searchParams.toString())
            params.set('kind', 'PRACTICE')
            const url = `/models?${params.toString()}`
            router.prefetch(url)
            router.push(url, { scroll: false })
          }}
          className={`relative rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'PRACTICE'
              ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md shadow-primary-500/30'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          {t('models.practice')}
          {activeTab === 'PRACTICE' && (
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-600/20 to-purple-600/20 blur-sm -z-10"></div>
          )}
        </button>
      </div>

      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${locale === 'ar' ? 'direction-rtl' : ''}`} style={locale === 'ar' ? { direction: 'rtl' } : {}}>
        {models.map((model) => {
          const title = locale === 'ar' ? model.titleAr : model.titleNl
          return (
            <div
              key={model.id}
              className="group relative flex flex-col rounded-2xl border-2 border-gray-200/60 bg-gradient-to-br from-white via-gray-50/30 to-white p-6 shadow-lg transition-all hover:border-primary-300 hover:shadow-xl hover:scale-[1.02]"
            >
              {/* Status Badge */}
              <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => toggleDone(model.id, model.done)}
                  className="shrink-0 transition-transform hover:scale-110"
                aria-label={model.done ? t('models.done') : t('models.notDone')}
              >
                {model.done ? (
                    <div className="rounded-full bg-gradient-to-br from-emerald-100 to-green-200 p-2 shadow-md">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    </div>
                ) : (
                    <div className="rounded-full bg-gray-100 p-2 border-2 border-gray-200">
                  <Circle className="h-6 w-6 text-gray-400" />
                    </div>
                )}
              </button>
                {model.done && (
                  <span className="rounded-full bg-gradient-to-r from-emerald-100 to-green-100 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                    {t('models.done')}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                  <div className="rounded-lg bg-blue-100 px-2 py-1">
                    <span className="font-semibold text-blue-700">
                      {model.kind === 'EXAM' 
                        ? (() => {
                            const hours = Math.floor(model.totalTimeSec / 3600)
                            const minutes = Math.floor((model.totalTimeSec % 3600) / 60)
                            return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : `${minutes} min`
                          })()
                        : `${Math.floor(model.totalTimeSec / 60)} min`
                      }
                    </span>
                  </div>
                  {model.kind === 'PRACTICE' && (model.textCount ?? 0) > 0 && (
                    <div className="rounded-lg bg-purple-100 px-2 py-1">
                      <span className="font-semibold text-purple-700">
                        {model.textCount ?? 0} {(model.textCount ?? 0) === 1 ? 'text' : 'texts'} ({(model.questionCount ?? 0)} {(model.questionCount ?? 0) === 1 ? 'question' : 'questions'})
                      </span>
                    </div>
                  )}
                  {model.kind === 'EXAM' && (model.questionCount ?? 0) > 0 && (
                    <div className="rounded-lg bg-emerald-100 px-2 py-1">
                      <span className="font-semibold text-emerald-700">
                        {model.questionCount ?? 0} {(model.questionCount ?? 0) === 1 ? 'question' : 'questions'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {showStartOptions === model.id ? (
                  <div className="flex flex-col gap-3 w-full rounded-2xl border-2 border-red-200/60 bg-gradient-to-br from-white via-red-50/20 to-white p-0 shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 shadow-md">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-white" />
                        <span className="text-sm font-bold uppercase tracking-wide text-white">
                          {locale === 'ar' ? 'خيارات التحميل' : t('models.downloadOptions')}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowStartOptions(null)}
                        className="rounded-lg p-1.5 text-white/95 hover:bg-white/25 hover:text-white transition-all hover:scale-110 active:scale-95 shadow-sm"
                        aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="px-4 pb-4 pt-2 flex flex-col gap-3">
                      {downloadError && downloadingModelId === model.id && (
                        <div className="rounded-lg bg-red-50 border-2 border-red-200 px-3 py-2 text-sm font-bold text-red-700">
                          {downloadError}
                        </div>
                      )}
                      <button
                        onClick={() => downloadPDF(model.id, 'full')}
                        disabled={downloadingModelId === model.id}
                        className="flex items-center justify-center gap-2 rounded-xl border-2 border-primary-200/60 bg-gradient-to-br from-white to-primary-50/30 px-4 py-3 text-sm font-bold text-primary-700 shadow-md transition-all hover:border-primary-400 hover:bg-primary-100 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        title={locale === 'ar' ? 'تحميل الامتحان الكامل' : 'Download full exam'}
                      >
                        {downloadingModelId === model.id ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-700 border-t-transparent"></div>
                        ) : (
                          <Download className="h-5 w-5" />
                        )}
                        {downloadingModelId === model.id ? (locale === 'ar' ? 'جاري التحميل...' : 'Downloaden...') : (locale === 'ar' ? 'كامل' : 'Full')}
                      </button>
                      <button
                        onClick={() => downloadPDF(model.id, 'questions')}
                        disabled={downloadingModelId === model.id}
                        className="flex items-center justify-center gap-2 rounded-xl border-2 border-primary-200/60 bg-gradient-to-br from-white to-primary-50/30 px-4 py-3 text-sm font-bold text-primary-700 shadow-md transition-all hover:border-primary-400 hover:bg-primary-100 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        title={locale === 'ar' ? 'تحميل الأسئلة فقط' : 'Download questions only'}
                      >
                        {downloadingModelId === model.id ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-700 border-t-transparent"></div>
                        ) : (
                          <Download className="h-5 w-5" />
                        )}
                        {downloadingModelId === model.id ? (locale === 'ar' ? 'جاري التحميل...' : 'Downloaden...') : (locale === 'ar' ? 'أسئلة' : 'Questions')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowStartOptions(model.id)}
                      className="flex items-center justify-center rounded-xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/50 p-2.5 shadow-sm transition-all hover:border-primary-300 hover:shadow-md hover:scale-105"
                      title={locale === 'ar' ? 'خيارات التحميل' : 'Download options'}
                    >
                      <Download className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => startModel(model.id, activeTab)}
                      disabled={startingModelId === model.id}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 px-4 py-2.5 font-bold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {startingModelId === model.id ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                      {startingModelId === model.id ? (locale === 'ar' ? 'جاري التحميل...' : 'Loading...') : t('models.start')}
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {models.length === 0 && (
        <div className="rounded-2xl border border-gray-200/60 bg-gradient-to-br from-gray-50 to-white p-12 text-center shadow-lg">
          <p className="text-lg font-semibold text-gray-500">
          Geen modellen beschikbaar
        </p>
        </div>
      )}
    </div>
  )
}

