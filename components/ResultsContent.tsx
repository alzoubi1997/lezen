'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { AttemptReview, QuestionWithAttempt } from '@/lib/types'
import TextDisplay from './TextDisplay'
import QuestionCard from './QuestionCard'
import { Download, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface ResultsContentProps {
  attemptId: string
}

export default function ResultsContent({ attemptId }: ResultsContentProps) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [review, setReview] = useState<AttemptReview | null>(null)
  const [showWrongOnly, setShowWrongOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [includeText, setIncludeText] = useState(true)
  const [explanationMode, setExplanationMode] = useState<'nl' | 'both'>('nl')
  const textRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [highlightedQuestionId, setHighlightedQuestionId] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<'full' | 'wrong' | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const fetchReview = useCallback(async () => {
    try {
      const res = await fetch(`/api/attempt/${attemptId}/review`)
      const data = await res.json()
      setReview(data)
    } catch (err) {
      console.error('Failed to fetch review:', err)
    } finally {
      setLoading(false)
    }
  }, [attemptId])

  useEffect(() => {
    fetchReview()
    // Load explanation mode from localStorage
    const saved = localStorage.getItem('explanationMode')
    if (saved === 'both' || saved === 'nl') {
      setExplanationMode(saved)
    }
  }, [fetchReview])

  const handleTagWrongReason = async (
    questionAttemptId: string,
    wrongReasonTag: string
  ) => {
    try {
      await fetch('/api/attempt/tag-wrong-reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionAttemptId,
          wrongReasonTag,
        }),
      })
      fetchReview()
    } catch (err) {
      console.error('Failed to tag wrong reason:', err)
    }
  }

  const downloadFull = async () => {
    setDownloadError(null)
    setDownloading('full')
    
    try {
      const params = new URLSearchParams({
        attemptId,
        includeText: includeText.toString(),
      })
      const pdfUrl = `/api/pdf/full?${params}`

      // Use fetch + blob for better reliability on mobile and desktop
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
      a.download = pdfRes.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'full-exam.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Failed to download PDF:', err)
      setDownloadError(locale === 'ar' ? 'حدث خطأ أثناء التحميل' : 'Er is een fout opgetreden bij het downloaden')
      setTimeout(() => setDownloadError(null), 5000)
    } finally {
      setDownloading(null)
    }
  }

  const downloadWrong = async () => {
    setDownloadError(null)
    setDownloading('wrong')
    
    try {
      // Always include both explanations in PDF when both languages are available
      const params = new URLSearchParams({
        attemptId,
        explanationMode: 'both', // Always use 'both' to include both Dutch and Arabic explanations
      })
      const pdfUrl = `/api/pdf/wrong?${params}`

      // Use fetch + blob for better reliability on mobile and desktop
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
      a.download = pdfRes.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'wrong-questions.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Failed to download PDF:', err)
      setDownloadError(locale === 'ar' ? 'حدث خطأ أثناء التحميل' : 'Er is een fout opgetreden bij het downloaden')
      setTimeout(() => setDownloadError(null), 5000)
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  if (!review) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Resultaten niet gevonden</p>
      </div>
    )
  }

  const modelTitle = locale === 'ar' ? review.model.titleAr : review.model.titleNl
  const allQuestions: QuestionWithAttempt[] = []
  review.texts.forEach((text) => {
    text.questions.forEach((q) => {
      allQuestions.push(q)
    })
  })

  const wrongQuestions = allQuestions.filter(
    (q) => q.questionAttempt && !q.questionAttempt.isCorrect
  )

  const questionsToShow = showWrongOnly ? wrongQuestions : allQuestions

  // Determine pass requirements based on attempt type
  const isExam = review.model.kind === 'EXAM' || review.totalQuestions === 36
  const requiredPassPercent = isExam ? 63.89 : 66.67
  const requiredCorrect = isExam ? 23 : 8

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-3">
          {t('results.title')}
        </h2>
        <div className="flex items-center justify-center gap-2">
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary-600 to-purple-600"></div>
          <div className="h-2 w-2 rounded-full bg-primary-500"></div>
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-purple-600 to-primary-600"></div>
        </div>
      </div>

      {/* Score Summary - NT2 Format - Compact & Attractive */}
      <div className="mb-6 overflow-hidden rounded-xl border bg-white shadow-lg">
        {/* Header */}
        <div className="bg-primary-600 px-5 py-3">
          <h3 className={`text-lg font-bold text-white ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{modelTitle}</h3>
        </div>

        <div className="p-4 bg-gradient-to-b from-white to-gray-50/50">
          {/* Main Score Row - Compact */}
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            {/* Score */}
            <div className={`rounded-xl bg-gradient-to-br p-4 shadow-md border-l-4 flex flex-col hover:shadow-lg transition-all ${
              review.scorePercent >= requiredPassPercent 
                ? 'from-green-50 to-white border-green-500' 
                : 'from-red-50 to-white border-red-500'
            } ${locale === 'ar' ? 'items-end text-right' : 'items-start text-left'}`}>
              <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
                review.scorePercent >= requiredPassPercent ? 'text-green-700' : 'text-red-700'
              }`}>
                {t('results.score')}
              </p>
              <div className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                <p
                  className={`text-2xl font-bold ${
                    review.scorePercent >= requiredPassPercent ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {review.scorePercent.toFixed(1)}%
                </p>
                {review.scorePercent < requiredPassPercent && (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>

            {/* Status */}
            <div className={`rounded-xl bg-gradient-to-br p-4 shadow-md border-l-4 flex flex-col hover:shadow-lg transition-all ${
              review.scorePercent >= requiredPassPercent 
                ? 'from-green-50 to-white border-green-500' 
                : 'from-red-50 to-white border-red-500'
            } ${locale === 'ar' ? 'items-end text-right' : 'items-start text-left'}`}>
              <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
                review.scorePercent >= requiredPassPercent ? 'text-green-700' : 'text-red-700'
              }`}>
                {t('dashboard.pass')}/{t('dashboard.fail')}
              </p>
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${locale === 'ar' ? 'flex-row-reverse' : ''} ${
                  review.scorePercent >= requiredPassPercent
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              >
                {review.scorePercent >= requiredPassPercent ? (
                  <CheckCircle2 className="h-4 w-4 text-white" />
                ) : (
                  <XCircle className="h-4 w-4 text-white" />
                )}
                <p className="text-base font-bold text-white">
                  {review.scorePercent >= requiredPassPercent ? t('dashboard.geslaagd') : t('dashboard.gezakt')}
                </p>
              </div>
            </div>

            {/* Required */}
            <div className={`rounded-xl bg-gradient-to-br from-blue-50 to-white p-4 shadow-md border-l-4 border-blue-500 flex flex-col hover:shadow-lg transition-all ${locale === 'ar' ? 'items-end text-right' : 'items-start text-left'}`}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                {t('dashboard.requiredToPass')}
              </p>
              <div>
                <p className="text-xl font-bold text-blue-600 mb-0.5">{requiredPassPercent.toFixed(2)}%</p>
                <p className="text-xs font-medium text-blue-600">
                  {t('dashboard.requiredCorrect')} {requiredCorrect}/{review.totalQuestions}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid - Compact */}
          <div className="grid gap-3 md:grid-cols-3">
            {/* Correct */}
            <div className="rounded-lg border-l-4 border-green-500 bg-gradient-to-br from-green-50 to-white p-4 shadow-md hover:shadow-lg transition-shadow">
              <div className={`mb-1.5 flex items-center gap-2 w-full ${locale === 'ar' ? 'justify-end' : 'justify-start'}`}>
                {locale === 'ar' ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-700 text-right">
                      {t('dashboard.correct')}
                    </p>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-700 text-left">
                      {t('dashboard.correct')}
                    </p>
                  </>
                )}
              </div>
              <p className={`mb-1.5 text-2xl font-bold text-green-600 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                {review.correctCount}/{review.totalQuestions}
              </p>
              <div className={`rounded-md border border-green-300/60 bg-white px-2 py-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                <p className="text-xs font-medium text-green-600">
                  {t('dashboard.requiredCorrect')}
                </p>
                <p className="text-base font-bold text-green-700">{requiredCorrect}/{review.totalQuestions}</p>
              </div>
            </div>

            {/* Wrong */}
            <div className="rounded-lg border-l-4 border-red-500 bg-gradient-to-br from-red-50 to-white p-4 shadow-md hover:shadow-lg transition-shadow">
              <div className={`mb-1.5 flex items-center gap-2 w-full ${locale === 'ar' ? 'justify-end' : 'justify-start'}`}>
                {locale === 'ar' ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-700 text-right">
                      {t('dashboard.wrong')}
                    </p>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-700 text-left">
                      {t('dashboard.wrong')}
                    </p>
                  </>
                )}
              </div>
              <p className={`text-2xl font-bold text-red-600 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                {review.totalQuestions - review.correctCount}
              </p>
            </div>

            {/* Time */}
            <div className="rounded-lg border-l-4 border-blue-500 bg-gradient-to-br from-blue-50 to-white p-4 shadow-md hover:shadow-lg transition-shadow">
              <div className={`mb-1.5 flex items-center gap-2 w-full ${locale === 'ar' ? 'justify-end' : 'justify-start'}`}>
                {locale === 'ar' ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 text-right">
                      {t('results.timeSpent')}
                    </p>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 text-left">
                      {t('results.timeSpent')}
                    </p>
                  </>
                )}
              </div>
              <p className={`text-2xl font-bold text-blue-600 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                {Math.floor(review.totalTimeSec / 60)}m
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Downloads - Enhanced Design */}
      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-md">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-3">
          <h3 className={`text-lg font-bold text-white ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('common.download')}</h3>
        </div>
        <div className="p-5">
          {downloadError && (
            <div className={`mb-4 rounded-lg border-2 border-red-300 bg-gradient-to-br from-red-50 to-red-100 px-4 py-3 shadow-sm ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <p className="text-sm font-bold text-red-700">{downloadError}</p>
              </div>
            </div>
          )}
          
          {/* Checkbox Option */}
          <div className={`mb-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm ${locale === 'ar' ? 'justify-end' : 'justify-start'}`}>
            <label className={`flex cursor-pointer items-center gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={includeText}
                  onChange={(e) => setIncludeText(e.target.checked)}
                  disabled={downloading !== null}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 bg-white checked:border-primary-600 checked:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <CheckCircle2 className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 peer-checked:opacity-100" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {t('results.includeText')}
              </span>
            </label>
          </div>

          {/* Download Buttons */}
          <div className={`flex flex-col gap-3 sm:flex-row ${locale === 'ar' ? 'sm:justify-end' : 'sm:justify-start'}`}>
            <button
              onClick={downloadFull}
              disabled={downloading !== null}
              className="group flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3 font-semibold text-white shadow-md transition-all hover:from-primary-700 hover:to-primary-800 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {downloading === 'full' ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <Download className="h-5 w-5 transition-transform group-hover:scale-110" />
              )}
              {downloading === 'full' ? (locale === 'ar' ? 'جاري التحميل...' : 'Downloaden...') : t('results.downloadFull')}
            </button>
            <button
              onClick={downloadWrong}
              disabled={downloading !== null}
              className="group flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 font-semibold text-white shadow-md transition-all hover:from-red-700 hover:to-red-800 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {downloading === 'wrong' ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <Download className="h-5 w-5 transition-transform group-hover:scale-110" />
              )}
              {downloading === 'wrong' ? (locale === 'ar' ? 'جاري التحميل...' : 'Downloaden...') : t('results.downloadWrong')}
            </button>
          </div>
        </div>
      </div>

      {/* Review Toggle */}
      <div className={`mb-4 flex gap-2 ${locale === 'ar' ? 'justify-end' : 'justify-start'}`}>
        <button
          onClick={() => setShowWrongOnly(false)}
          className={`rounded px-4 py-2 ${
            !showWrongOnly
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {t('results.showAll')}
        </button>
        <button
          onClick={() => setShowWrongOnly(true)}
          className={`rounded px-4 py-2 ${
            showWrongOnly
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {t('results.showWrong')} ({wrongQuestions.length})
        </button>
      </div>

      {/* Questions Review */}
      <div className="space-y-6">
        {(() => {
          // Calculate starting question number for each text
          let questionsBefore = 0
          return review.texts.map((text, textIndex) => {
            // Calculate the starting question number for this text BEFORE filtering
            const textStartNumber = questionsBefore + 1

            const textQuestions = text.questions.filter((q) =>
              showWrongOnly
                ? q.questionAttempt && !q.questionAttempt.isCorrect
                : true
            )

            // Update counter for next text (count all questions in this text, even if filtered)
            questionsBefore += text.questions.length

            if (textQuestions.length === 0) {
              return null
            }

            return (
              <div key={text.id} className="space-y-4">
                <div 
                  ref={(el) => {
                    if (el) {
                      textRefs.current.set(text.id, el)
                    } else {
                      textRefs.current.delete(text.id)
                    }
                  }}
                  className="rounded-lg border bg-white p-4"
                >
                  <h3 className="mb-2 text-lg font-semibold">{text.title}</h3>
                  <TextDisplay
                    content={text.content}
                    questions={textQuestions}
                    highlightEvidence={true}
                    highlightedQuestionId={highlightedQuestionId}
                  />
                </div>

                <div className="space-y-4">
                  {textQuestions.map((question) => {
                    const attempt = question.questionAttempt
                    if (!attempt) return null

                    // Calculate global question number: start of text + orderIndex within text
                    const globalQuestionNum = textStartNumber + question.orderIndex

                    const isWrong = !attempt.isCorrect
                    const options = JSON.parse(question.optionsJson) as string[]
                    // Always use Dutch questions, regardless of UI language
                    const prompt = question.promptNl

                    return (
                      <div
                        key={question.id}
                        className={`overflow-hidden rounded-xl border-2 bg-white shadow-md ${
                          isWrong ? 'border-red-200' : 'border-green-200'
                        }`}
                      >
                        {/* Question Header */}
                        <div
                          className={`flex items-center ${locale === 'ar' ? 'justify-end' : 'justify-start'} gap-3 px-5 py-3 ${
                            isWrong
                              ? 'bg-gradient-to-r from-red-50 to-red-100'
                              : 'bg-gradient-to-r from-green-50 to-green-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {locale === 'ar' ? (
                              <>
                                <span className="font-semibold text-gray-900">
                                  {t('runner.question')} {globalQuestionNum}
                                </span>
                                {isWrong ? (
                                  <XCircle className="h-6 w-6 text-red-600" />
                                ) : (
                                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                                )}
                              </>
                            ) : (
                              <>
                                {isWrong ? (
                                  <XCircle className="h-6 w-6 text-red-600" />
                                ) : (
                                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                                )}
                                <span className="font-semibold text-gray-900">
                                  {t('runner.question')} {globalQuestionNum}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                      <div className="p-5">
                        <p className="mb-5 text-lg font-bold leading-relaxed text-gray-900">
                          {prompt}
                        </p>

                        {/* Options */}
                        <div className="mb-5 space-y-3">
                          {options.map((option, index) => {
                            const isSelected = attempt.chosenIndex === index
                            const isCorrect = index === question.correctIndex

                            return (
                              <div
                                key={index}
                                className={`group relative overflow-hidden rounded-lg border-2 p-4 transition-all ${
                                  isWrong && isSelected
                                    ? 'border-red-400 bg-gradient-to-r from-red-50 to-red-100 shadow-sm'
                                    : isCorrect
                                    ? 'border-green-400 bg-gradient-to-r from-green-50 to-green-100 shadow-sm'
                                    : isSelected
                                    ? 'border-primary-400 bg-primary-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-start gap-4">
                                  <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold shadow-sm transition-transform ${
                                      isWrong && isSelected
                                        ? 'bg-red-500 text-white'
                                        : isCorrect
                                        ? 'bg-green-500 text-white'
                                        : isSelected
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-200 text-gray-700 group-hover:bg-gray-300'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + index)}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-gray-800 leading-relaxed">{option}</p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    {isSelected && (
                                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                        {t('results.yourAnswer')}
                                      </span>
                                    )}
                                    {isCorrect && (
                                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                        {t('results.correctAnswer')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Evidence Section - Show for all questions */}
                        {((question.evidenceStart !== null && question.evidenceEnd !== null) || question.evidenceQuote) && (
                          <div className="mb-5 rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm">
                            <div className={`mb-2 flex items-center gap-2 w-full ${locale === 'ar' ? 'justify-end' : 'justify-start'}`}>
                              {locale === 'ar' ? (
                                <>
                                  <p className="text-sm font-semibold text-blue-900 text-right">
                                    {t('results.evidence')}:
                                  </p>
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                                    <span className="text-xs font-bold">!</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                                    <span className="text-xs font-bold">!</span>
                                  </div>
                                  <p className="text-sm font-semibold text-blue-900 text-left">
                                    {t('results.evidence')}:
                                  </p>
                                </>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                // Highlight this question's evidence first
                                setHighlightedQuestionId(question.id)
                                
                                // Use requestAnimationFrame to ensure state update is processed
                                requestAnimationFrame(() => {
                                  // Find the specific evidence element using multiple methods
                                  const findAndScroll = () => {
                                    // Method 1: Try by ID
                                    let evidenceElement = document.querySelector(`#evidence-${question.id}`) as HTMLElement
                                    
                                    // Method 2: Try by data attribute
                                    if (!evidenceElement) {
                                      evidenceElement = document.querySelector(`[data-question-id="${question.id}"]`) as HTMLElement
                                    }
                                    
                                    // Method 3: Try within text container
                                    if (!evidenceElement) {
                                      const textContainer = textRefs.current.get(text.id)
                                      if (textContainer) {
                                        evidenceElement = textContainer.querySelector(`#evidence-${question.id}`) as HTMLElement
                                      }
                                    }
                                    
                                    if (evidenceElement) {
                                      // Scroll directly to the evidence element, centered on screen
                                      evidenceElement.scrollIntoView({ 
                                        behavior: 'smooth', 
                                        block: 'center',
                                        inline: 'nearest'
                                      })
                                      return true
                                    }
                                    return false
                                  }

                                  // Try immediately
                                  if (!findAndScroll()) {
                                    // If not found, try after short delays
                                    setTimeout(() => {
                                      if (!findAndScroll()) {
                                        setTimeout(findAndScroll, 150)
                                      }
                                    }, 100)
                                  }
                                })
                                
                                // Remove highlight after animation
                                setTimeout(() => {
                                  setHighlightedQuestionId(null)
                                }, 2000)
                              }}
                              className="w-full text-left"
                            >
                              <p className="rounded-md bg-white p-3 text-sm font-bold leading-relaxed text-gray-800 shadow-sm transition-all hover:bg-blue-50 hover:shadow-md cursor-pointer">
                                {question.evidenceStart !== null && question.evidenceEnd !== null
                                  ? text.content.slice(question.evidenceStart, question.evidenceEnd)
                                  : question.evidenceQuote || ''}
                              </p>
                            </button>
                          </div>
                        )}

                        {/* Explanation Section */}
                        <div className="mb-4 space-y-3">
                          <div className="flex items-center justify-between">
                            {locale === 'ar' ? (
                              <>
                                <button
                                  onClick={() => {
                                    const newMode = explanationMode === 'nl' ? 'both' : 'nl'
                                    setExplanationMode(newMode)
                                    localStorage.setItem('explanationMode', newMode)
                                  }}
                                  className={`relative rounded-lg border-2 px-4 py-2 text-xs font-bold shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 ${
                                    explanationMode === 'both'
                                      ? 'border-primary-500 bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:from-primary-700 hover:to-purple-700'
                                      : 'border-primary-300 bg-gradient-to-br from-white to-primary-50/30 text-primary-700 hover:border-primary-400 hover:from-primary-50 hover:to-primary-100'
                                  }`}
                                  title={explanationMode === 'nl' ? 'Show both languages' : 'Show Dutch only'}
                                >
                                  {explanationMode === 'nl' ? 'NL' : 'NL+AR'}
                                </button>
                                <div className="flex items-center gap-2 flex-row-reverse">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white">
                                    <span className="text-xs font-bold">i</span>
                                  </div>
                                  <p className="text-sm font-semibold text-gray-700">
                                    {t('results.explanation')}:
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white">
                                    <span className="text-xs font-bold">i</span>
                                  </div>
                                  <p className="text-sm font-semibold text-gray-700">
                                    {t('results.explanation')}:
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    const newMode = explanationMode === 'nl' ? 'both' : 'nl'
                                    setExplanationMode(newMode)
                                    localStorage.setItem('explanationMode', newMode)
                                  }}
                                  className={`relative rounded-lg border-2 px-4 py-2 text-xs font-bold shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 ${
                                    explanationMode === 'both'
                                      ? 'border-primary-500 bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:from-primary-700 hover:to-purple-700'
                                      : 'border-primary-300 bg-gradient-to-br from-white to-primary-50/30 text-primary-700 hover:border-primary-400 hover:from-primary-50 hover:to-primary-100'
                                  }`}
                                  title={explanationMode === 'nl' ? 'Show both languages' : 'Show Dutch only'}
                                >
                                  {explanationMode === 'nl' ? 'NL' : 'NL+AR'}
                                </button>
                              </>
                            )}
                          </div>
                          <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
                            {/* Always show Dutch explanation first */}
                            <p className="text-sm font-bold leading-relaxed text-gray-800">
                              {question.explanationNl}
                            </p>
                            {/* Show Arabic explanation below when button is clicked */}
                            {explanationMode === 'both' && question.explanationAr && (
                              <div className="mt-3 border-t border-blue-200 pt-3">
                                <p className="text-sm font-bold leading-relaxed text-gray-700">
                                  {question.explanationAr}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Trap Note Section */}
                        {isWrong && question.trapNoteNl && (
                          <div className="rounded-lg border border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 shadow-sm">
                            <div className={`mb-2 flex items-center gap-2 w-full ${locale === 'ar' ? 'justify-end' : 'justify-start'}`}>
                              {locale === 'ar' ? (
                                <>
                                  <p className="text-sm font-semibold text-amber-900 text-right">
                                    {t('results.trapNote')}:
                                  </p>
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white">
                                    <span className="text-xs font-bold">⚠</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white">
                                    <span className="text-xs font-bold">⚠</span>
                                  </div>
                                  <p className="text-sm font-semibold text-amber-900 text-left">
                                    {t('results.trapNote')}:
                                  </p>
                                </>
                              )}
                            </div>
                            <p className="rounded-md bg-white p-3 text-sm font-bold leading-relaxed text-gray-800 shadow-sm">
                              {/* Always show trap note in Dutch */}
                              {question.trapNoteNl}
                            </p>
                          </div>
                        )}

                        {/* Tag Wrong Reason Section */}
                        {isWrong && (
                          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
                            <p className={`mb-3 text-sm font-semibold text-gray-700 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                              {t('results.tagWrongReason')}:
                            </p>
                            <div className={`flex flex-wrap gap-2 ${locale === 'ar' ? 'justify-end' : 'justify-start'}`}>
                              {[
                                'SYNONYM_MISS',
                                'NEGATION_MISS',
                                'MAIN_IDEA',
                                'INFERENCE_JUMP',
                                'TIME_PRESSURE',
                                'CARELESS',
                              ].map((tag) => (
                                <button
                                  key={tag}
                                  onClick={() =>
                                    handleTagWrongReason(
                                      attempt.id || question.id || '',
                                      tag
                                    )
                                  }
                                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                    attempt.wrongReasonTag === tag
                                      ? 'bg-primary-600 text-white shadow-sm'
                                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                  }`}
                                >
                                  {t(`errors.wrongReason.${tag}`)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
          // Update counter after processing this text
          questionsBefore += text.questions.length
          return null
        })
        })()}
      </div>

      {questionsToShow.length === 0 && (
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="text-gray-500">
            {showWrongOnly
              ? t('errors.noErrors')
              : 'Geen vragen om te tonen'}
          </p>
        </div>
      )}
    </div>
  )
}

