'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { RotateCcw, Filter } from 'lucide-react'

interface ErrorQuestion {
  id: string
  questionId: string
  attemptId: string
  modelTitle: string
  prompt: string
  options: string[]
  chosenIndex: number | null
  correctIndex: number
  explanation: string
  wrongReasonTag: string | null
  finishedAt: string
}

export default function ErrorsContent() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [errors, setErrors] = useState<ErrorQuestion[]>([])
  const [daily10, setDaily10] = useState<ErrorQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTag, setFilterTag] = useState<string | null>(null)

  const fetchErrors = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/errors/list${filterTag ? `?tag=${filterTag}` : ''}`
      )
      const data = await res.json()
      setErrors(data.errors || [])
    } catch (err) {
      console.error('Failed to fetch errors:', err)
    } finally {
      setLoading(false)
    }
  }, [filterTag])

  const fetchDaily10 = useCallback(async () => {
    try {
      const res = await fetch('/api/errors/daily10')
      const data = await res.json()
      setDaily10(data.questions || [])
    } catch (err) {
      console.error('Failed to fetch daily 10:', err)
    }
  }, [])

  useEffect(() => {
    fetchErrors()
    fetchDaily10()
  }, [fetchErrors, fetchDaily10])

  const resetDaily10 = async () => {
    try {
      await fetch('/api/errors/daily10-reset', { method: 'POST' })
      fetchDaily10()
    } catch (err) {
      console.error('Failed to reset daily 10:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold">{t('errors.title')}</h2>

      {/* Daily 10 */}
      <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{t('errors.daily10')}</h3>
            <p className="text-sm text-gray-600">
              {t('errors.daily10Description')}
            </p>
          </div>
          <button
            onClick={resetDaily10}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
          >
            <RotateCcw className="h-4 w-4" />
            {t('errors.reset')}
          </button>
        </div>

        {daily10.length === 0 ? (
          <p className="text-gray-500">{t('errors.noErrors')}</p>
        ) : (
          <div className="space-y-3">
            {daily10.map((error, index) => (
              <button
                key={error.id}
                onClick={() => router.push(`/attempt/${error.attemptId}/results`)}
                className="w-full rounded border p-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">
                      {index + 1}. {error.prompt.slice(0, 100)}...
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {error.modelTitle}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm text-red-600">
                      {String.fromCharCode(65 + (error.chosenIndex ?? -1))} →{' '}
                      {String.fromCharCode(65 + error.correctIndex)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* All Errors */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('errors.allErrors')}</h3>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterTag || ''}
              onChange={(e) => setFilterTag(e.target.value || null)}
              className="rounded border border-gray-300 px-3 py-1 text-sm"
            >
              <option value="">{t('errors.filterByReason')}</option>
              {[
                'SYNONYM_MISS',
                'NEGATION_MISS',
                'MAIN_IDEA',
                'INFERENCE_JUMP',
                'TIME_PRESSURE',
                'CARELESS',
              ].map((tag) => (
                <option key={tag} value={tag}>
                  {t(`errors.wrongReason.${tag}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errors.length === 0 ? (
          <p className="text-gray-500">{t('errors.noErrors')}</p>
        ) : (
          <div className="space-y-3">
            {errors.map((error) => (
              <button
                key={error.id}
                onClick={() => router.push(`/attempt/${error.attemptId}/results`)}
                className="w-full rounded border p-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">
                      {error.prompt.slice(0, 100)}...
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                      <span>{error.modelTitle}</span>
                      {error.wrongReasonTag && (
                        <>
                          <span>•</span>
                          <span className="rounded bg-gray-100 px-2 py-0.5">
                            {t(`errors.wrongReason.${error.wrongReasonTag}`)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm text-red-600">
                      {String.fromCharCode(65 + (error.chosenIndex ?? -1))} →{' '}
                      {String.fromCharCode(65 + error.correctIndex)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(error.finishedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

