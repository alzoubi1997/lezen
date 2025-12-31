'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { type Block36Metrics } from '@/lib/nt2-scoring'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface NT2ProgressData {
  attempts: any[]
  blocks: Block36Metrics[]
  latestBlock: Block36Metrics | null
  avgCompletedBlocks: number | null
  incompleteBlock: any[]
  totalAttempts: number
}

export default function NT2ProgressDashboard() {
  const t = useTranslations()
  const locale = useLocale() as 'nl' | 'ar'
  const [data, setData] = useState<NT2ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard/nt2-progress')
      const data = await res.json()
      setData(data)
    } catch (err) {
      console.error('Failed to fetch NT2 progress:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  if (!data || (data.attempts.length === 0 && (!data.incompleteBlock || data.incompleteBlock.length === 0))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>{t('dashboard.noAttempts')}</p>
      </div>
    )
  }

  const formatPercent = (value: number) => value.toFixed(2)
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString()
  }

  const toggleBlock = (blockIndex: number) => {
    setExpandedBlocks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(blockIndex)) {
        newSet.delete(blockIndex)
      } else {
        newSet.add(blockIndex)
      }
      return newSet
    })
  }

  return (
    <div className="mx-auto max-w-4xl px-3 sm:px-4 py-4 sm:py-8">
      <div className={`mb-4 sm:mb-8 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
        <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-600 via-blue-600 to-slate-600 bg-clip-text text-transparent mb-1.5 ${locale === 'ar' ? 'direction-rtl' : ''}`} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          {t('dashboard.nt2Progress')}
        </h2>
        <div className={`flex items-center gap-1.5 ${locale === 'ar' ? 'justify-end' : 'justify-start'}`}>
          <div className={`h-1 w-8 rounded-full bg-gradient-to-r from-slate-600 to-blue-600 ${locale === 'ar' ? '' : ''}`}></div>
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
          <div className={`h-1 w-8 rounded-full bg-gradient-to-r from-blue-600 to-slate-600 ${locale === 'ar' ? '' : ''}`}></div>
        </div>
      </div>

      {/* Info Box - Explain Blocks Concept */}
      <div className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-blue-50 p-4 sm:p-6 shadow-lg backdrop-blur-sm" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
        <div className="mb-3 sm:mb-4 flex items-start gap-2 sm:gap-3 w-full">
          {locale === 'ar' ? (
            <>
              <div className="flex-1 min-w-0">
                <h3 className="mb-2 sm:mb-3 text-sm sm:text-base font-bold text-blue-900">{t('dashboard.blockInfo')}</h3>
                <p className="text-xs sm:text-sm md:text-base font-medium sm:font-bold leading-relaxed text-blue-800">
                  {t('dashboard.blockExplanation')}
                </p>
              </div>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="mb-2 sm:mb-3 text-sm sm:text-base font-bold text-blue-900">{t('dashboard.blockInfo')}</h3>
                <p className="text-xs sm:text-sm md:text-base font-medium sm:font-bold leading-relaxed text-blue-800">
                  {t('dashboard.blockExplanation')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Average of all completed Exam Equivalent cards */}
      {data.avgCompletedBlocks !== null && (
        <div className="mb-4 sm:mb-6 rounded-xl border-l-4 border-blue-500 bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6 shadow-md" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
          <div className={`mb-3 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center ${locale === 'ar' ? 'sm:flex-row-reverse' : ''} gap-2 sm:gap-0 sm:justify-between`}>
            {locale === 'ar' ? (
              <>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 text-right w-full sm:w-auto" dir="rtl">
                  {t('dashboard.avgCompletedBlocks')}
                </h3>
                <span className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-semibold text-white shadow-md">
                  {data.blocks.length} {data.blocks.length === 1 ? 'blok' : 'blokken'}
                </span>
              </>
            ) : (
              <>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 text-left w-full sm:w-auto">
                  {t('dashboard.avgCompletedBlocks')}
                </h3>
                <span className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-semibold text-white shadow-md">
                  {data.blocks.length} {data.blocks.length === 1 ? 'blok' : 'blokken'}
                </span>
              </>
            )}
          </div>
          <p className={`text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
            {formatPercent(data.avgCompletedBlocks)}%
          </p>
        </div>
      )}

      {/* All Blocks - Latest first with full details, then previous blocks */}
      {data.blocks.length > 0 && (
        <div className="space-y-6">
          {/* Latest Block - Full Details */}
          {data.latestBlock && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:shadow-xl"
                 style={{
                   borderLeft: `4px solid ${data.latestBlock.passFail36 ? '#10b981' : '#ef4444'}`,
                 }}>
              {/* Header */}
              <div className={`px-6 py-5 border-b border-gray-200/60 ${
                data.latestBlock.passFail36
                  ? 'bg-gradient-to-br from-emerald-50/80 via-green-50/50 to-emerald-50/80'
                  : 'bg-gradient-to-br from-rose-50/80 via-red-50/50 to-rose-50/80'
              }`}>
                <div className="flex items-center justify-between">
                  {locale === 'ar' ? (
                    <>
                      <div className="text-left">
                        <span className="text-lg font-bold text-gray-900">
                          Blok {data.latestBlock.blockIndex + 1}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900" dir="rtl">
                          {t('dashboard.latestExamEquivalent')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-left">
                        <span className="text-lg font-bold text-gray-900">
                          {t('dashboard.latestExamEquivalent')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">
                          Blok {data.latestBlock.blockIndex + 1}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

          <div className="p-4 bg-gradient-to-b from-white to-gray-50/50" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
            {/* Main Stats Row */}
            <div className={`mb-4 grid gap-3 grid-cols-4 ${locale === 'ar' ? 'justify-items-end' : 'justify-items-start'}`} style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
              <div className="w-full rounded-xl bg-gradient-to-br from-slate-50 to-white p-4 shadow-md border-l-4 border-slate-500 hover:shadow-lg transition-all" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
                <p className={`mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('dashboard.blockDate')}
                </p>
                <p className={`text-lg font-bold text-slate-900 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{formatDate(data.latestBlock.blockDate)}</p>
              </div>
              <div className={`w-full rounded-xl bg-gradient-to-br p-4 shadow-md border-l-4 hover:shadow-lg transition-all ${
                data.latestBlock.passFail36 
                  ? 'from-green-50 to-white border-green-500' 
                  : 'from-red-50 to-white border-red-500'
              }`} style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
                <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
                  data.latestBlock.passFail36 ? 'text-green-700' : 'text-red-700'
                } ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('dashboard.groupScore')}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    data.latestBlock.passFail36 ? 'text-green-600' : 'text-red-600'
                  } ${locale === 'ar' ? 'text-right' : 'text-left'}`}
                >
                  {formatPercent(data.latestBlock.yourPercent36)}%
                </p>
              </div>
              <div className={`w-full rounded-xl bg-gradient-to-br p-4 shadow-md border-l-4 hover:shadow-lg transition-all ${
                data.latestBlock.passFail36 
                  ? 'from-green-50 to-white border-green-500' 
                  : 'from-red-50 to-white border-red-500'
              }`} style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
                <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
                  data.latestBlock.passFail36 ? 'text-green-700' : 'text-red-700'
                } ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('dashboard.pass')}/{t('dashboard.fail')}
                </p>
                <div className={`flex items-center gap-2 w-full ${locale === 'ar' ? 'justify-end' : 'justify-start'}`}>
                  {locale === 'ar' ? (
                    <>
                      <p
                        className={`text-lg font-bold ${
                          data.latestBlock.passFail36 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {data.latestBlock.passFail36
                          ? t('dashboard.geslaagd')
                          : t('dashboard.gezakt')}
                      </p>
                      {data.latestBlock.passFail36 ? (
                        <div className="rounded-full bg-green-500 p-1.5 shadow-sm">
                          <CheckCircle2 className="h-5 w-5 text-white shrink-0" />
                        </div>
                      ) : (
                        <div className="rounded-full bg-red-500 p-1.5 shadow-sm">
                          <XCircle className="h-5 w-5 text-white shrink-0" />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {data.latestBlock.passFail36 ? (
                        <div className="rounded-full bg-green-500 p-1.5 shadow-sm">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                      ) : (
                        <div className="rounded-full bg-red-500 p-1.5 shadow-sm">
                          <XCircle className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <p
                        className={`text-lg font-bold ${
                          data.latestBlock.passFail36 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {data.latestBlock.passFail36
                          ? t('dashboard.geslaagd')
                          : t('dashboard.gezakt')}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="w-full rounded-xl bg-gradient-to-br from-blue-50 to-white p-4 shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-all" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
                <p className={`mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('dashboard.requiredToPass')}
                </p>
                <p className={`text-xl font-bold text-blue-600 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>63.89%</p>
                <p className={`text-xs font-medium text-blue-600 mt-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('dashboard.requiredCorrect')} 23/36
                </p>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="mb-4 grid gap-3 md:grid-cols-3" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
              <div className="rounded-lg border-l-4 border-green-500 bg-gradient-to-br from-green-50 to-white p-4 shadow-md hover:shadow-lg transition-shadow" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
                <p className={`mb-1.5 text-xs font-semibold uppercase tracking-wide text-green-700 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('dashboard.correct')}
                </p>
                <p className={`text-2xl font-bold text-green-600 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  {data.latestBlock.correct36}/36
                </p>
              </div>
              <div className="rounded-lg border-l-4 border-red-500 bg-gradient-to-br from-red-50 to-white p-4 shadow-md hover:shadow-lg transition-shadow" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
                <p className={`mb-1.5 text-xs font-semibold uppercase tracking-wide text-red-700 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('dashboard.wrong')}
                </p>
                <p className={`text-2xl font-bold text-red-600 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  {36 - data.latestBlock.correct36}
                </p>
              </div>
              <div className="rounded-lg border-l-4 border-blue-500 bg-gradient-to-br from-blue-50 to-white p-4 shadow-md hover:shadow-lg transition-shadow" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
                <p className={`mb-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('dashboard.requiredToPass')}
                </p>
                <p className={`text-2xl font-bold text-blue-600 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  23/36
                </p>
              </div>
            </div>

            {/* Practice Names in Block */}
            <div className="mb-4 rounded-xl border-l-4 border-slate-500 bg-gradient-to-br from-slate-50 to-white p-5 shadow-md">
              <p className={`mb-3 text-xs font-semibold uppercase tracking-wide text-slate-700 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                {t('dashboard.practicesInBlock')}:
              </p>
              <div className="flex flex-wrap gap-2">
                {data.latestBlock.practiceNames.map((name, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-gradient-to-r from-slate-600 to-slate-700 px-4 py-1.5 text-sm font-semibold text-white shadow-md hover:from-slate-700 hover:to-slate-800 transition-all"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            {/* Attempts in this block */}
            <div className="rounded-xl border-l-4 border-slate-500 bg-gradient-to-br from-slate-50 to-white p-5 shadow-md">
              <p className={`mb-4 text-sm font-semibold text-slate-700 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                {t('dashboard.attemptsInBlock')}:
              </p>
              <div className="space-y-3">
                {data.latestBlock.attempts.map((attempt, idx) => (
                  <div
                    key={attempt.id}
                    className={`flex items-center ${locale === 'ar' ? 'flex-row-reverse' : ''} justify-between rounded-xl border-l-4 border-slate-300 bg-white px-4 py-3 shadow-sm hover:shadow-md transition-all hover:border-slate-400`}
                  >
                    <div className={`flex items-center gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-600 text-white font-bold shadow-md">
                        {idx + 1}
                      </div>
                      <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                        <p className="text-sm font-semibold text-gray-800">
                          {attempt.modelTitle}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(attempt.date)}
                        </p>
                        <p className="text-sm font-medium text-gray-700 mt-1">
                          {attempt.correctAnswers}/12 {t('dashboard.correct')}
                        </p>
                      </div>
                    </div>
                    <div className={locale === 'ar' ? 'text-left' : 'text-right'}>
                      <p
                        className={`text-lg font-bold ${
                          attempt.passFailAttempt ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {formatPercent(attempt.yourPercentAttempt)}%
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {attempt.passFailAttempt ? t('dashboard.geslaagd') : t('dashboard.gezakt')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
          )}

          {/* Previous Blocks - Compact View */}
          {data.blocks.length > 1 && (
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold text-gray-900 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                {t('dashboard.previousBlocks')}
              </h3>
              {data.blocks
                .slice(0, -1)
                .reverse()
                .map((block) => {
                  const isExpanded = expandedBlocks.has(block.blockIndex)
                  return (
                    <div
                      key={block.blockIndex}
                      className="overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:shadow-xl"
                      style={{
                        borderLeft: `4px solid ${block.passFail36 ? '#10b981' : '#ef4444'}`,
                      }}
                    >
                      {/* Clickable Header */}
                      <button
                        onClick={() => toggleBlock(block.blockIndex)}
                        className={`w-full px-6 py-5 ${
                          block.passFail36
                            ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50'
                            : 'bg-gradient-to-br from-rose-50 via-red-50 to-rose-50'
                        } cursor-pointer transition-all hover:opacity-95`}
                      >
                        <div className="flex items-center justify-between">
                          {locale === 'ar' ? (
                            <>
                              <div className="text-left">
                                <h4 className="text-lg font-bold text-gray-900 mb-1">
                                  Blok {block.blockIndex + 1}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {formatDate(block.blockDate)}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    {t('results.score')}
                                  </p>
                                  <p
                                    className={`text-3xl font-bold ${
                                      block.passFail36 ? 'text-emerald-600' : 'text-rose-600'
                                    }`}
                                  >
                                    {formatPercent(block.yourPercent36)}%
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-row-reverse">
                                  <p
                                    className={`text-base font-semibold ${
                                      block.passFail36 ? 'text-emerald-600' : 'text-rose-600'
                                    }`}
                                  >
                                    {block.passFail36
                                      ? t('dashboard.geslaagd')
                                      : t('dashboard.gezakt')}
                                  </p>
                                  {block.passFail36 ? (
                                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                                  ) : (
                                    <XCircle className="h-6 w-6 text-rose-600 shrink-0" />
                                  )}
                                </div>
                                <div className="mr-2">
                                  {isExpanded ? (
                                    <ChevronUp className="h-5 w-5 text-gray-600" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-600" />
                                  )}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-left">
                                <h4 className="text-lg font-bold text-gray-900 mb-1">
                                  Blok {block.blockIndex + 1}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {formatDate(block.blockDate)}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    {t('results.score')}
                                  </p>
                                  <p
                                    className={`text-3xl font-bold ${
                                      block.passFail36 ? 'text-emerald-600' : 'text-rose-600'
                                    }`}
                                  >
                                    {formatPercent(block.yourPercent36)}%
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {block.passFail36 ? (
                                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                  ) : (
                                    <XCircle className="h-6 w-6 text-rose-600" />
                                  )}
                                  <p
                                    className={`text-base font-semibold ${
                                      block.passFail36 ? 'text-emerald-600' : 'text-rose-600'
                                    }`}
                                  >
                                    {block.passFail36
                                      ? t('dashboard.geslaagd')
                                      : t('dashboard.gezakt')}
                                  </p>
                                </div>
                                <div className="ml-2">
                                  {isExpanded ? (
                                    <ChevronUp className="h-5 w-5 text-gray-600" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-600" />
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </button>

                      {/* Collapsible Content */}
                      {isExpanded && (
                        <div className="p-4 bg-gradient-to-b from-white to-gray-50/50 border-t border-gray-200/60" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
                          {/* Main Stats Row */}
                          <div className={`mb-4 grid gap-3 grid-cols-4 ${locale === 'ar' ? 'justify-items-end' : 'justify-items-start'}`} style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
                            <div className="w-full rounded-xl bg-gradient-to-br from-slate-50 to-white p-4 shadow-md border-l-4 border-slate-500 hover:shadow-lg transition-all" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
                              <p className={`mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {t('dashboard.blockDate')}
                              </p>
                              <p className={`text-lg font-bold text-slate-900 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{formatDate(block.blockDate)}</p>
                            </div>
                            <div className={`w-full rounded-xl bg-gradient-to-br p-4 shadow-md border-l-4 hover:shadow-lg transition-all ${
                              block.passFail36 
                                ? 'from-green-50 to-white border-green-500' 
                                : 'from-red-50 to-white border-red-500'
                            }`} style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
                              <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
                                block.passFail36 ? 'text-green-700' : 'text-red-700'
                              } ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {t('dashboard.groupScore')}
                              </p>
                              <p
                                className={`text-2xl font-bold ${
                                  block.passFail36 ? 'text-green-600' : 'text-red-600'
                                } ${locale === 'ar' ? 'text-right' : 'text-left'}`}
                              >
                                {formatPercent(block.yourPercent36)}%
                              </p>
                            </div>
                            <div className={`w-full rounded-xl bg-gradient-to-br p-4 shadow-md border-l-4 hover:shadow-lg transition-all ${
                              block.passFail36 
                                ? 'from-green-50 to-white border-green-500' 
                                : 'from-red-50 to-white border-red-500'
                            }`} style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
                              <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
                                block.passFail36 ? 'text-green-700' : 'text-red-700'
                              } ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {t('dashboard.pass')}/{t('dashboard.fail')}
                              </p>
                              <div className={`flex items-center gap-2 w-full ${locale === 'ar' ? 'justify-end' : 'justify-start'}`}>
                                {locale === 'ar' ? (
                                  <>
                                    <p
                                      className={`text-lg font-bold ${
                                        block.passFail36 ? 'text-green-600' : 'text-red-600'
                                      }`}
                                    >
                                      {block.passFail36
                                        ? t('dashboard.geslaagd')
                                        : t('dashboard.gezakt')}
                                    </p>
                                    {block.passFail36 ? (
                                      <div className="rounded-full bg-green-500 p-1.5 shadow-sm">
                                        <CheckCircle2 className="h-5 w-5 text-white shrink-0" />
                                      </div>
                                    ) : (
                                      <div className="rounded-full bg-red-500 p-1.5 shadow-sm">
                                        <XCircle className="h-5 w-5 text-white shrink-0" />
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {block.passFail36 ? (
                                      <div className="rounded-full bg-green-500 p-1.5 shadow-sm">
                                        <CheckCircle2 className="h-5 w-5 text-white" />
                                      </div>
                                    ) : (
                                      <div className="rounded-full bg-red-500 p-1.5 shadow-sm">
                                        <XCircle className="h-5 w-5 text-white" />
                                      </div>
                                    )}
                                    <p
                                      className={`text-lg font-bold ${
                                        block.passFail36 ? 'text-green-600' : 'text-red-600'
                                      }`}
                                    >
                                      {block.passFail36
                                        ? t('dashboard.geslaagd')
                                        : t('dashboard.gezakt')}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="w-full rounded-xl bg-gradient-to-br from-blue-50 to-white p-4 shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-all" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
                              <p className={`mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {t('dashboard.requiredToPass')}
                              </p>
                              <p className={`text-xl font-bold text-blue-600 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>63.89%</p>
                              <p className={`text-xs font-medium text-blue-600 mt-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {t('dashboard.requiredCorrect')} 23/36
                              </p>
                            </div>
                          </div>

                          {/* Detailed Stats */}
                          <div className={`mb-4 grid gap-3 grid-cols-3 ${locale === 'ar' ? 'justify-items-end' : 'justify-items-start'}`} style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
                            <div className="w-full rounded-lg border-l-4 border-green-500 bg-gradient-to-br from-green-50 to-white p-4 shadow-md hover:shadow-lg transition-shadow" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
                              <p className={`mb-1.5 text-xs font-semibold uppercase tracking-wide text-green-700 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {t('dashboard.correct')}
                              </p>
                              <p className={`text-2xl font-bold text-green-600 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {block.correct36}/36
                              </p>
                            </div>
                            <div className="w-full rounded-lg border-l-4 border-red-500 bg-gradient-to-br from-red-50 to-white p-4 shadow-md hover:shadow-lg transition-shadow" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
                              <p className={`mb-1.5 text-xs font-semibold uppercase tracking-wide text-red-700 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {t('dashboard.wrong')}
                              </p>
                              <p className={`text-2xl font-bold text-red-600 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {36 - block.correct36}
                              </p>
                            </div>
                            <div className="w-full rounded-lg border-l-4 border-blue-500 bg-gradient-to-br from-blue-50 to-white p-4 shadow-md hover:shadow-lg transition-shadow" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
                              <p className={`mb-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                {t('dashboard.requiredToPass')}
                              </p>
                              <p className={`text-2xl font-bold text-blue-600 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                23/36
                              </p>
                            </div>
                          </div>

                          {/* Practice Names in Block */}
                          <div className="mb-4 rounded-xl border-l-4 border-slate-500 bg-gradient-to-br from-slate-50 to-white p-5 shadow-md">
                            <p className={`mb-3 text-xs font-semibold uppercase tracking-wide text-slate-700 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                              {t('dashboard.practicesInBlock')}:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {block.practiceNames.map((name, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-full bg-gradient-to-r from-slate-600 to-slate-700 px-4 py-1.5 text-sm font-semibold text-white shadow-md hover:from-slate-700 hover:to-slate-800 transition-all"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Attempts in this block */}
                          <div className="rounded-xl border-l-4 border-slate-500 bg-gradient-to-br from-slate-50 to-white p-5 shadow-md">
                            <p className={`mb-4 text-sm font-semibold text-slate-700 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                              {t('dashboard.attemptsInBlock')}:
                            </p>
                            <div className="space-y-3">
                              {block.attempts.map((attempt, idx) => (
                                <div
                                  key={attempt.id}
                                  className={`flex items-center ${locale === 'ar' ? 'flex-row-reverse' : ''} justify-between rounded-xl border-l-4 border-slate-300 bg-white px-4 py-3 shadow-sm hover:shadow-md transition-all hover:border-slate-400`}
                                >
                                  <div className={`flex items-center gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-600 text-white font-bold shadow-md">
                                      {idx + 1}
                                    </div>
                                    <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {attempt.modelTitle}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {formatDate(attempt.date)}
                                      </p>
                                      <p className="text-sm font-medium text-gray-700 mt-1">
                                        {attempt.correctAnswers}/12 {t('dashboard.correct')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className={locale === 'ar' ? 'text-left' : 'text-right'}>
                                    <p
                                      className={`text-lg font-bold ${
                                        attempt.passFailAttempt ? 'text-emerald-600' : 'text-rose-600'
                                      }`}
                                    >
                                      {formatPercent(attempt.yourPercentAttempt)}%
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {attempt.passFailAttempt ? t('dashboard.geslaagd') : t('dashboard.gezakt')}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* Incomplete Block Section - Always visible */}
      <div className="mt-4 sm:mt-6 overflow-hidden rounded-xl border-l-4 border-orange-500 bg-white shadow-md" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
        <div className="bg-gradient-to-r from-orange-50 via-orange-100/80 to-orange-50 px-4 sm:px-6 py-3 sm:py-5 border-b border-orange-200">
          <div className={`flex flex-col sm:flex-row items-start sm:items-center ${locale === 'ar' ? 'sm:flex-row-reverse' : ''} gap-2 sm:gap-0 sm:justify-between`}>
            {locale === 'ar' ? (
              <>
                <h3 className="text-base sm:text-lg font-bold text-orange-900 text-right w-full sm:w-auto">
                  {t('dashboard.incompleteBlock')}
                </h3>
                <span className="rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-bold text-white shadow-md">
                  {(data.incompleteBlock?.length || 0)}/3 {t('dashboard.complete')}
                </span>
              </>
            ) : (
              <>
                <h3 className="text-base sm:text-lg font-bold text-orange-900 text-left w-full sm:w-auto">
                  {t('dashboard.incompleteBlock')}
                </h3>
                <span className="rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-bold text-white shadow-md">
                  {(data.incompleteBlock?.length || 0)}/3 {t('dashboard.complete')}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <p className={`mb-3 sm:mb-4 text-xs sm:text-sm font-medium sm:font-bold leading-relaxed text-slate-700 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
            {t('dashboard.incompleteBlockExplanation')}
          </p>
          
          <div className="mb-3 sm:mb-4 rounded-xl border-l-4 border-orange-500 bg-gradient-to-br from-orange-50 to-white p-3 sm:p-5 shadow-md">
            <p className={`mb-2 sm:mb-3 text-xs font-bold uppercase tracking-wider text-orange-700 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
              {t('dashboard.currentPractices')}:
            </p>
            <div className="flex flex-wrap gap-2">
              {data.incompleteBlock && data.incompleteBlock.length > 0 ? (
                <>
                  {data.incompleteBlock.map((attempt, idx) => (
                    <span
                      key={attempt.id}
                      className="rounded-full bg-gradient-to-r from-orange-600 to-orange-700 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-bold text-white shadow-md hover:from-orange-700 hover:to-orange-800 transition-all"
                    >
                      {attempt.modelTitle}
                    </span>
                  ))}
                  {Array.from({ length: 3 - data.incompleteBlock.length }).map((_, idx) => (
                    <span
                      key={`missing-${idx}`}
                      className="rounded-full border-2 border-dashed border-orange-400 bg-white px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-bold text-orange-600"
                    >
                      {t('dashboard.missing')}
                    </span>
                  ))}
                </>
              ) : (
                <>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <span
                      key={`missing-${idx}`}
                      className="rounded-full border-2 border-dashed border-orange-400 bg-white px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-bold text-orange-600"
                    >
                      {t('dashboard.missing')}
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>

          {data.incompleteBlock && data.incompleteBlock.length > 0 ? (
            <div className="rounded-xl border-l-4 border-slate-500 bg-gradient-to-br from-slate-50 to-white p-3 sm:p-5 shadow-md">
              <p className={`mb-3 sm:mb-4 text-xs sm:text-sm font-bold text-slate-700 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                {t('dashboard.attemptsInBlock')}:
              </p>
              <div className="space-y-2 sm:space-y-3">
                {data.incompleteBlock.map((attempt, idx) => (
                  <div
                    key={attempt.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center ${locale === 'ar' ? 'sm:flex-row-reverse' : ''} gap-2 sm:gap-0 sm:justify-between rounded-xl border-l-4 border-slate-300 bg-white px-3 sm:px-4 py-2 sm:py-3 shadow-sm hover:shadow-md transition-all hover:border-slate-400`}
                  >
                    <div className={`flex items-center gap-2 sm:gap-3 w-full sm:w-auto ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-600 text-white font-bold shadow-md flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className={`flex-1 min-w-0 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                        <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                          {attempt.modelTitle}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(attempt.date)}
                        </p>
                        <p className="text-xs sm:text-sm font-semibold text-gray-700 mt-1">
                          {attempt.correctAnswers}/12 {t('dashboard.correct')}
                        </p>
                      </div>
                    </div>
                    <div className={`flex-shrink-0 ${locale === 'ar' ? 'text-left' : 'text-right'}`}>
                      <p
                        className={`text-base sm:text-lg font-bold ${
                          attempt.passFailAttempt ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatPercent(attempt.yourPercentAttempt)}%
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {attempt.passFailAttempt ? t('dashboard.geslaagd') : t('dashboard.gezakt')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-l-4 border-slate-500 bg-gradient-to-br from-slate-50 to-white p-3 sm:p-5 shadow-md">
              <p className={`text-xs sm:text-sm font-medium text-gray-600 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                {t('dashboard.noAttemptsInBlock')}
              </p>
            </div>
          )}

          <div className="mt-3 sm:mt-4 rounded-xl border-l-4 border-orange-500 bg-gradient-to-br from-orange-50 to-white p-3 sm:p-5 shadow-md">
            <p className={`text-xs sm:text-sm font-bold text-orange-900 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
              {t('dashboard.remainingToComplete')}: {3 - (data.incompleteBlock?.length || 0)} {t('dashboard.morePractices')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

