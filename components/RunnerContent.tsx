'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Timer from './Timer'
import TextDisplay from './TextDisplay'
import QuestionCard from './QuestionCard'
import { useAutosave } from '@/hooks/useAutosave'
import { useTimer as useTimerHook } from '@/hooks/useTimer'
import { TextWithQuestions, QuestionWithAttempt } from '@/lib/types'
import { calculateWordCount, formatTime } from '@/lib/utils'
import { AlertCircle, ChevronLeft, ChevronRight, List, Upload, Clock } from 'lucide-react'

interface RunnerContentProps {
  attemptId: string
}

export default function RunnerContent({ attemptId }: RunnerContentProps) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [texts, setTexts] = useState<TextWithQuestions[]>([])
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [attempt, setAttempt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [show90sWarning, setShow90sWarning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showOverview, setShowOverview] = useState(false)

  const fetchAttemptData = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch(`/api/attempt/${attemptId}/data`)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to load: ${res.status}`)
      }
      
      const data = await res.json()
      
      if (!data.attempt) {
        throw new Error('Attempt not found')
      }
      
      if (!data.texts || data.texts.length === 0) {
        throw new Error('No texts found for this model. The database may need to be seeded.')
      }
      
      setAttempt(data.attempt)
      setTexts(data.texts)
    } catch (err) {
      console.error('Failed to fetch attempt data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load attempt data')
    } finally {
      setLoading(false)
    }
  }, [attemptId])

  useEffect(() => {
    fetchAttemptData()
  }, [fetchAttemptData])

  useEffect(() => {
    setQuestionStartTime(Date.now())
    setShow90sWarning(false)
  }, [currentTextIndex, currentQuestionIndex])

  const currentText = texts[currentTextIndex]
  const currentQuestion = currentText?.questions[currentQuestionIndex]
  // Use model's totalTimeSec if available, otherwise fallback to defaults
  const totalTimeSec = attempt?.model?.totalTimeSec ?? (attempt?.mode === 'EXAM' ? 6000 : 1800)

  const handleFinishAttempt = async () => {
    if (!confirm(t('runner.confirmFinish'))) return

    const totalTimeSpent = totalTimeSec - timerRemaining
    try {
      const res = await fetch('/api/attempt/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          totalTimeSec: totalTimeSpent,
        }),
      })
      router.push(`/attempt/${attemptId}/results`)
    } catch (err) {
      console.error('Failed to finish attempt:', err)
    }
  }

  // Initialize timer - pause until attempt data loads to prevent immediate expiry
  const { remaining: timerRemaining, setRemaining: setTimerRemaining } =
    useTimerHook({
      initialSeconds: attempt ? totalTimeSec : 999999, // Use large number to prevent immediate expiry
      onExpire: handleFinishAttempt,
      paused: !attempt || loading, // Pause timer until attempt data is loaded
    })

  // Update timer when attempt data loads with correct totalTimeSec
  useEffect(() => {
    if (attempt && !loading) {
      if (attempt.model?.totalTimeSec) {
        // Set timer to correct value from model
        setTimerRemaining(attempt.model.totalTimeSec)
      } else {
        // Fallback if model data not available
        const fallbackTime = attempt.mode === 'EXAM' ? 6000 : 1800
        setTimerRemaining(fallbackTime)
      }
    }
  }, [attempt?.model?.totalTimeSec, attempt?.mode, attempt, loading, setTimerRemaining])

  const saveAnswer = async (
    questionId: string,
    chosenIndex: number | null,
    flagged: boolean,
    confidence: number | null,
    timeSpentSec: number
  ) => {
    setSaving(true)
    try {
      await fetch('/api/attempt/save-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          questionId,
          chosenIndex,
          flagged,
          confidence,
          timeSpentSec,
        }),
      })
    } catch (err) {
      console.error('Failed to save answer:', err)
    } finally {
      setSaving(false)
    }
  }

  const { saveOnChange } = useAutosave({
    onSave: async () => {
      if (currentQuestion) {
        const questionAttempt = currentQuestion.questionAttempt
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
        await saveAnswer(
          currentQuestion.id,
          questionAttempt?.chosenIndex ?? null,
          questionAttempt?.flagged ?? false,
          questionAttempt?.confidence ?? null,
          timeSpent
        )
      }
    },
    interval: 10000,
  })

  useEffect(() => {
    if (currentQuestion) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
      if (timeSpent >= 90 && !show90sWarning) {
        setShow90sWarning(true)
      }
    }
  }, [currentQuestion, questionStartTime, show90sWarning])

  const handleAnswer = (index: number | null) => {
    if (!currentQuestion) return
    // Prevent answer changes if attempt is finished
    if (attempt?.finishedAt) return

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
    const questionAttempt = currentQuestion.questionAttempt

    const updatedTexts = [...texts]
    const text = updatedTexts[currentTextIndex]
    const question = text.questions[currentQuestionIndex]
    if (!question.questionAttempt) {
      question.questionAttempt = {
        chosenIndex: null,
        isCorrect: false,
        timeSpentSec: 0,
        flagged: false,
        confidence: null,
        wrongReasonTag: null,
      }
    }
    question.questionAttempt.chosenIndex = index
    setTexts(updatedTexts)

    saveAnswer(
      currentQuestion.id,
      index,
      questionAttempt?.flagged ?? false,
      questionAttempt?.confidence ?? null,
      timeSpent
    )
    saveOnChange()
  }

  const handleFlag = (flagged: boolean) => {
    if (!currentQuestion) return
    // Prevent flag changes if attempt is finished
    if (attempt?.finishedAt) return

    const updatedTexts = [...texts]
    const text = updatedTexts[currentTextIndex]
    const question = text.questions[currentQuestionIndex]
    if (!question.questionAttempt) {
      question.questionAttempt = {
        chosenIndex: null,
        isCorrect: false,
        timeSpentSec: 0,
        flagged: false,
        confidence: null,
        wrongReasonTag: null,
      }
    }
    question.questionAttempt.flagged = flagged
    setTexts(updatedTexts)

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
    saveAnswer(
      currentQuestion.id,
      question.questionAttempt.chosenIndex,
      flagged,
      question.questionAttempt.confidence,
      timeSpent
    )
    saveOnChange()
  }

  const handleConfidence = (value: number) => {
    if (!currentQuestion) return
    // Prevent confidence changes if attempt is finished
    if (attempt?.finishedAt) return

    const updatedTexts = [...texts]
    const text = updatedTexts[currentTextIndex]
    const question = text.questions[currentQuestionIndex]
    if (!question.questionAttempt) {
      question.questionAttempt = {
        chosenIndex: null,
        isCorrect: false,
        timeSpentSec: 0,
        flagged: false,
        confidence: null,
        wrongReasonTag: null,
      }
    }
    question.questionAttempt.confidence = value
    setTexts(updatedTexts)

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
    saveAnswer(
      currentQuestion.id,
      question.questionAttempt.chosenIndex,
      question.questionAttempt.flagged,
      value,
      timeSpent
    )
    saveOnChange()
  }

  const handleNext = () => {
    if (currentQuestionIndex < currentText.questions.length - 1) {
      // Move to next question in same text
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else if (currentTextIndex < texts.length - 1) {
      // Move to first question of next text
      setCurrentTextIndex(currentTextIndex + 1)
      setCurrentQuestionIndex(0)
    } else {
      // Last question - finish
      handleFinishAttempt()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // Move to previous question in same text
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else if (currentTextIndex > 0) {
      // Move to last question of previous text
      setCurrentTextIndex(currentTextIndex - 1)
      const prevText = texts[currentTextIndex - 1]
      setCurrentQuestionIndex(prevText.questions.length - 1)
    }
  }

  const handleMarkAndNext = () => {
    if (currentQuestion) {
      handleFlag(true)
      setTimeout(() => {
        handleNext()
      }, 100)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
          <h2 className="mb-2 text-lg font-bold text-red-900">
            {locale === 'ar' ? 'خطأ في تحميل البيانات' : 'Fout bij laden'}
          </h2>
          <p className="mb-4 text-sm text-red-700">{error}</p>
          <button
            onClick={() => {
              setLoading(true)
              fetchAttemptData()
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            {locale === 'ar' ? 'إعادة المحاولة' : 'Opnieuw proberen'}
          </button>
        </div>
      </div>
    )
  }

  if (texts.length === 0 || !currentText || !currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-600" />
          <h2 className="mb-2 text-lg font-bold text-yellow-900">
            {locale === 'ar' ? 'لا توجد نصوص' : 'Geen teksten gevonden'}
          </h2>
          <p className="mb-4 text-sm text-yellow-700">
            {locale === 'ar'
              ? 'لا توجد نصوص لهذا النموذج. قد تحتاج قاعدة البيانات إلى التهيئة.'
              : 'Er zijn geen teksten gevonden voor dit model. De database moet mogelijk worden gevuld met gegevens.'}
          </p>
          <button
            onClick={() => router.push('/models')}
            className="rounded-lg bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
          >
            {locale === 'ar' ? 'العودة إلى النماذج' : 'Terug naar modellen'}
          </button>
        </div>
      </div>
    )
  }

  // Calculate total question number across all texts
  let totalQuestionNumber = 0
  for (let i = 0; i < currentTextIndex; i++) {
    totalQuestionNumber += texts[i].questions.length
  }
  totalQuestionNumber += currentQuestionIndex + 1

  const totalQuestions = texts.reduce((sum, text) => sum + text.questions.length, 0)
  const isLastQuestion = currentTextIndex === texts.length - 1 && 
    currentQuestionIndex === currentText.questions.length - 1

  // Calculate question states for navigation
  const getQuestionState = (textIdx: number, questionIdx: number) => {
    const text = texts[textIdx]
    const question = text?.questions[questionIdx]
    const attempt = question?.questionAttempt
    if (attempt?.flagged) return 'flagged'
    if (attempt?.chosenIndex !== null && attempt?.chosenIndex !== undefined) return 'answered'
    return 'unanswered'
  }

  // Navigate to specific question
  const navigateToQuestion = (targetQuestionNumber: number) => {
    let count = 0
    for (let i = 0; i < texts.length; i++) {
      for (let j = 0; j < texts[i].questions.length; j++) {
        count++
        if (count === targetQuestionNumber) {
          setCurrentTextIndex(i)
          setCurrentQuestionIndex(j)
          return
        }
      }
    }
  }

  // Overview component
  if (showOverview) {
    return (
      <div className="min-h-screen bg-white pb-9">
        {/* Dark purple header */}
        <div className="bg-[#3A1070] text-white px-6 h-8 flex items-center relative">
          <div className="mx-auto max-w-6xl flex items-center justify-between w-full">
            <h1 className="text-sm font-semibold">
              {attempt?.model?.titleNl || 'Examen'}
            </h1>
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <span className="text-xs font-medium">
                {t('runner.question')} {totalQuestionNumber} {t('runner.of')} {totalQuestions}
              </span>
            </div>
            <div className="w-24"></div>
          </div>
        </div>

        {/* Overview content */}
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Overzicht</h2>
          <p className="text-gray-600 mb-1">Controleer of alle vragen beantwoord zijn.</p>
          <p className="text-gray-600 mb-6">Klik op het vraagnummer om meteen naar de vraag te gaan.</p>

          {/* Question grid and legend container */}
          <div className="flex items-start gap-8">
            {/* Question grid - 5 columns, 6 rows */}
            <div className="grid grid-cols-5 gap-1.5 max-w-sm">
              {Array.from({ length: totalQuestions }, (_, i) => {
                const questionNum = i + 1
                let textIdx = 0
                let questionIdx = 0
                let count = 0
                for (let ti = 0; ti < texts.length; ti++) {
                  for (let qi = 0; qi < texts[ti].questions.length; qi++) {
                    count++
                    if (count === questionNum) {
                      textIdx = ti
                      questionIdx = qi
                      break
                    }
                  }
                  if (count === questionNum) break
                }
                const state = getQuestionState(textIdx, questionIdx)
                const isFlagged = state === 'flagged'
                const isAnswered = state === 'answered'

                return (
                  <button
                    key={questionNum}
                    onClick={() => {
                      navigateToQuestion(questionNum)
                      setShowOverview(false)
                    }}
                    className={`
                      aspect-square rounded-lg border-2 font-semibold text-xs transition-all relative flex items-center justify-center
                      ${isAnswered || isFlagged
                        ? 'bg-purple-200 border-purple-400 text-gray-900'
                        : 'bg-white border-purple-300 text-gray-900'
                      }
                      hover:shadow-md hover:scale-105
                    `}
                  >
                    {questionNum}
                    {isFlagged && (
                      <div
                        className="absolute -top-1 -right-0 w-2 h-5 z-20"
                        style={{ 
                          background: 'linear-gradient(to bottom, #FFD700 0%, #FFA500 100%)',
                          clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
                          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
                          pointerEvents: 'none'
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend - positioned on the right */}
            <div className="flex-shrink-0 pt-2">
              <h3 className="font-semibold text-gray-900 mb-4">Legenda</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border-2 border-purple-300 bg-white"></div>
                  <span className="text-sm text-gray-700">Onbeantwoord</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border-2 border-purple-400 bg-purple-200"></div>
                  <span className="text-sm text-gray-700">Beantwoord</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-5"
                    style={{ 
                      background: 'linear-gradient(to bottom, #FFD700 0%, #FFA500 100%)',
                      clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                    }}
                  />
                  <span className="text-sm text-gray-700">Gemarkeerd</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dark purple footer with navigation - single line */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#3A1070] text-white shadow-lg overflow-hidden">
          <div className="flex items-center justify-between gap-0 w-full h-8">
            <button
              onClick={handlePrevious}
              disabled={currentTextIndex === 0 && currentQuestionIndex === 0}
              className="flex items-center gap-1 px-3 bg-[#3A1070] hover:bg-white/20 rounded-l-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap border-r border-white/10 h-full"
              style={{ color: '#ffffff' }}
            >
              <ChevronLeft className="w-4 h-4" style={{ color: '#ffffff', stroke: '#ffffff' }} />
              <span style={{ color: '#ffffff' }}>VORIGE</span>
            </button>
            
            {/* Question navigation grid with pagination */}
            <div className="flex items-center justify-center gap-0 flex-wrap flex-1">
              {(() => {
                // Pagination logic: show current question ± 7 questions, with ellipsis
                const current = totalQuestionNumber
                const maxVisible = 15
                const range = 7
                
                let start = Math.max(1, current - range)
                let end = Math.min(totalQuestions, current + range)
                
                // Adjust if we're near the start or end
                if (end - start < maxVisible) {
                  if (start === 1) {
                    end = Math.min(totalQuestions, start + maxVisible - 1)
                  } else if (end === totalQuestions) {
                    start = Math.max(1, end - maxVisible + 1)
                  }
                }
                
                const buttons = []
                
                // Show ellipsis at start if needed
                if (start > 1) {
                  buttons.push(
                    <span key="ellipsis-start" className="text-white/80 px-2 text-sm">...</span>
                  )
                }
                
                // Show question buttons
                for (let i = start; i <= end; i++) {
                  let textIdx = 0
                  let questionIdx = 0
                  let count = 0
                  for (let ti = 0; ti < texts.length; ti++) {
                    for (let qi = 0; qi < texts[ti].questions.length; qi++) {
                      count++
                      if (count === i) {
                        textIdx = ti
                        questionIdx = qi
                        break
                      }
                    }
                    if (count === i) break
                  }
                  const state = getQuestionState(textIdx, questionIdx)
                  const isCurrent = i === totalQuestionNumber
                  const isFlagged = state === 'flagged'
                  
                  const isFirstInGroup = i === start
                  const isLastInGroup = i === end
                  buttons.push(
                    <button
                      key={i}
                      onClick={() => {
                        navigateToQuestion(i)
                        setShowOverview(false)
                      }}
                      className={`
                        w-7 h-7 border text-xs font-semibold transition-all relative flex items-center justify-center
                        ${isFirstInGroup ? 'rounded-l' : 'border-l-0'}
                        ${isLastInGroup ? 'rounded-r' : ''}
                        ${isCurrent 
                          ? 'bg-white border-white text-[#4A148C] z-10 shadow-sm' 
                          : state === 'answered'
                          ? 'bg-purple-200/50 border-purple-300/50 text-white hover:bg-purple-200'
                          : 'bg-transparent border-white/40 text-white hover:bg-white/10'
                        }
                      `}
                      title={isFlagged ? 'Gemarkeerd' : state === 'answered' ? 'Beantwoord' : 'Onbeantwoord'}
                    >
                      {i}
                      {isFlagged && (
                        <div
                          className="absolute -top-1 -right-0 w-2 h-6 z-20"
                          style={{ 
                            background: 'linear-gradient(to bottom, #FFD700 0%, #FFA500 100%)',
                            clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
                            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
                            pointerEvents: 'none'
                          }}
                        />
                      )}
                    </button>
                  )
                }
                
                // Show ellipsis at end if needed
                if (end < totalQuestions) {
                  buttons.push(
                    <span key="ellipsis-end" className="text-white/80 px-2 text-sm">...</span>
                  )
                }
                
                return buttons
              })()}
            </div>

            <div className="flex items-center gap-0 h-full">
              <button
                onClick={() => setShowOverview(true)}
                className="flex items-center gap-1 px-3 bg-white text-[#3A1070] hover:bg-white/90 text-xs font-medium transition whitespace-nowrap border-l border-white/10 border-r border-white/10 h-full"
              >
                <List className="w-4 h-4" />
                OVERZICHT
              </button>
              <button
                onClick={handleFinishAttempt}
                disabled={!!attempt?.finishedAt}
                className="flex items-center gap-1 px-3 bg-[#3A1070] hover:bg-white/20 rounded-r-lg text-xs font-medium transition whitespace-nowrap border-l border-white/10 h-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                INLEVEREN
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-9">
      {/* Dark purple header */}
      <div className="bg-[#3A1070] text-white px-6 h-8 flex items-center relative">
        <div className="mx-auto max-w-6xl flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold">
              {attempt?.model?.titleNl || 'Examen'}
            </h1>
            {attempt?.model?.kind === 'EXAM' && attempt?.model?.number === 1 && (
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-200 to-yellow-200 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-400 shadow-sm">
                {locale === 'ar' ? 'خفيف' : 'Licht'}
              </span>
            )}
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <span className="text-xs font-medium">
              {t('runner.question')} {totalQuestionNumber} {t('runner.of')} {totalQuestions}
            </span>
          </div>
          <div className="w-24"></div>
        </div>
      </div>

      {/* Main content: White background */}
      <div className="mx-auto max-w-5xl px-8 py-8">
        {/* Text Display */}
        {currentText && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{currentText.title}</h2>
              <div className="flex flex-col items-end gap-1">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                  {currentText.content ? calculateWordCount(currentText.content) : 0} {locale === 'ar' ? 'كلمة' : 'woorden'}
                </span>
                {timerRemaining !== undefined && timerRemaining >= 0 && (
                  <div
                    className={`flex items-center gap-2 rounded-lg px-3 py-1 text-sm ${
                      timerRemaining < 300
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    <span className="font-mono font-bold">
                      {formatTime(timerRemaining)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <div className="whitespace-pre-wrap text-base font-bold leading-relaxed text-gray-800">
                {currentText.content}
              </div>
            </div>
          </div>
        )}

        {/* Text context note */}
        <p className="text-sm font-bold italic text-gray-600 mb-4">
          Deze vraag hoort bij de tekst &apos;{currentText.title}&apos;. Beantwoord de vraag.
        </p>

        {/* Question Display */}
        <div className="bg-white rounded-lg border p-6">
          <QuestionCard
            question={currentQuestion}
            onAnswer={handleAnswer}
            onFlag={handleFlag}
            onConfidence={handleConfidence}
            questionNumber={totalQuestionNumber}
            disabled={!!attempt?.finishedAt}
          />
        </div>
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-9 left-4 rounded bg-gray-800 px-3 py-2 text-sm text-white">
          {t('runner.saving')}
        </div>
      )}

      {/* Dark purple footer with navigation - single line */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#3A1070] text-white shadow-lg overflow-hidden">
        <div className="flex items-center justify-between gap-0 w-full h-8">
          <button
            onClick={handlePrevious}
            disabled={currentTextIndex === 0 && currentQuestionIndex === 0}
            className="flex items-center gap-1 px-3 bg-[#3A1070] hover:bg-white/20 rounded-l-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap border-r border-white/10 h-full"
            style={{ color: '#ffffff' }}
          >
            <ChevronLeft className="w-4 h-4" style={{ color: '#ffffff', stroke: '#ffffff' }} />
            <span style={{ color: '#ffffff' }}>VORIGE</span>
          </button>
          
          {/* Question navigation grid with pagination */}
          <div className="flex items-center justify-center gap-0 flex-wrap flex-1">
            {(() => {
              // Pagination logic: show current question ± 7 questions, with ellipsis
              const current = totalQuestionNumber
              const maxVisible = 15
              const range = 7
              
              let start = Math.max(1, current - range)
              let end = Math.min(totalQuestions, current + range)
              
              // Adjust if we're near the start or end
              if (end - start < maxVisible) {
                if (start === 1) {
                  end = Math.min(totalQuestions, start + maxVisible - 1)
                } else if (end === totalQuestions) {
                  start = Math.max(1, end - maxVisible + 1)
                }
              }
              
              const buttons = []
              
              // Show ellipsis at start if needed
              if (start > 1) {
                buttons.push(
                  <span key="ellipsis-start" className="text-white/80 px-2 text-sm">...</span>
                )
              }
              
              // Show question buttons
              for (let i = start; i <= end; i++) {
                let textIdx = 0
                let questionIdx = 0
                let count = 0
                for (let ti = 0; ti < texts.length; ti++) {
                  for (let qi = 0; qi < texts[ti].questions.length; qi++) {
                    count++
                    if (count === i) {
                      textIdx = ti
                      questionIdx = qi
                      break
                    }
                  }
                  if (count === i) break
                }
                const state = getQuestionState(textIdx, questionIdx)
                const isCurrent = i === totalQuestionNumber
                const isFlagged = state === 'flagged'
                
                const isFirstInGroup = i === start
                const isLastInGroup = i === end
                buttons.push(
                  <button
                    key={i}
                    onClick={() => navigateToQuestion(i)}
                    className={`
                      w-7 h-7 border text-xs font-semibold transition-all relative flex items-center justify-center
                      ${isFirstInGroup ? 'rounded-l' : 'border-l-0'}
                      ${isLastInGroup ? 'rounded-r' : ''}
                      ${isCurrent 
                        ? 'bg-white border-white text-[#4A148C] z-10 shadow-sm' 
                        : state === 'answered'
                        ? 'bg-purple-200/50 border-purple-300/50 text-white hover:bg-purple-200'
                        : 'bg-transparent border-white/40 text-white hover:bg-white/10'
                      }
                    `}
                    title={isFlagged ? 'Gemarkeerd' : state === 'answered' ? 'Beantwoord' : 'Onbeantwoord'}
                  >
                    {i}
                    {isFlagged && (
                      <div
                        className="absolute -top-1 -right-0 w-2 h-6 z-20"
                        style={{ 
                          background: 'linear-gradient(to bottom, #FFD700 0%, #FFA500 100%)',
                          clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
                          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
                          pointerEvents: 'none'
                        }}
                      />
                    )}
                  </button>
                )
              }
              
              // Show ellipsis at end if needed
              if (end < totalQuestions) {
                buttons.push(
                  <span key="ellipsis-end" className="text-white/80 px-2 text-sm">...</span>
                )
              }
              
              return buttons
            })()}
          </div>

           <div className="flex items-center gap-0 h-full">
             <button
               onClick={() => setShowOverview(true)}
               className="flex items-center gap-1 px-3 bg-[#3A1070] hover:bg-white/20 text-xs font-medium transition whitespace-nowrap border-l border-white/10 border-r border-white/10 h-full"
             >
               <List className="w-4 h-4" />
               OVERZICHT
             </button>
             <button
               onClick={isLastQuestion ? () => setShowOverview(true) : handleNext}
               className="flex items-center gap-1 px-3 bg-[#3A1070] hover:bg-white/20 rounded-r-lg text-xs font-medium transition whitespace-nowrap border-l border-white/10 h-full"
             >
               VOLGENDE
               <ChevronRight className="w-4 h-4" />
             </button>
           </div>
         </div>
       </div>
    </div>
  )
}
