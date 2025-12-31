'use client'

import { useTranslations } from 'next-intl'
import { QuestionWithAttempt } from '@/lib/types'
import ConfidenceSlider from './ConfidenceSlider'
import { Flag } from 'lucide-react'

interface QuestionCardProps {
  question: QuestionWithAttempt
  onAnswer: (index: number | null) => void
  onFlag: (flagged: boolean) => void
  onConfidence: (value: number) => void
  showAnswer?: boolean
  questionNumber?: number // Global question number across all texts
  disabled?: boolean // Disable interactions if attempt is finished
}

export default function QuestionCard({
  question,
  onAnswer,
  onFlag,
  onConfidence,
  showAnswer = false,
  questionNumber,
  disabled = false,
}: QuestionCardProps) {
  const t = useTranslations()
  const options = JSON.parse(question.optionsJson) as string[]
  const attempt = question.questionAttempt
  const selectedIndex = attempt?.chosenIndex ?? null

  // Always use Dutch questions, regardless of UI language
  const prompt = question.promptNl

  return (
    <div className="space-y-5">
      {/* Question header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('runner.question')} {questionNumber !== undefined ? questionNumber : question.orderIndex + 1}
          </h2>
          <button
            onClick={() => onFlag(!attempt?.flagged)}
            disabled={disabled || showAnswer}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
              disabled || showAnswer
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : attempt?.flagged
                ? 'bg-amber-100 text-amber-700 border-amber-400'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
            aria-label={t('runner.flag')}
          >
            <Flag className="h-4 w-4" fill={attempt?.flagged ? 'currentColor' : 'none'} />
            <span>{attempt?.flagged ? 'Gemarkeerd' : 'Markeren'}</span>
          </button>
        </div>
        <p className="text-lg font-bold text-gray-800 leading-relaxed">{prompt}</p>
      </div>

      {/* Options with radio buttons */}
      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedIndex === index
          const isCorrect = showAnswer && index === question.correctIndex
          const isWrong = showAnswer && isSelected && !isCorrect

          return (
            <label
              key={index}
              className={`
                flex items-start gap-3 p-4 rounded-lg border-2 transition-all
                ${isWrong
                  ? 'border-red-500 bg-red-50'
                  : isCorrect
                  ? 'border-green-500 bg-green-50'
                  : isSelected
                  ? 'border-[#4A148C] bg-purple-50'
                  : 'border-gray-300 hover:border-[#4A148C] hover:bg-gray-50'
                }
                ${showAnswer || disabled ? 'cursor-default' : 'cursor-pointer'}
              `}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                checked={isSelected}
                onChange={() => !showAnswer && !disabled && onAnswer(index)}
                disabled={showAnswer || disabled}
                className="mt-1 h-5 w-5 text-[#4A148C] focus:ring-[#4A148C] cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-gray-800 font-bold leading-relaxed">
                  {String.fromCharCode(65 + index)}) {option}
                </span>
              </div>
            </label>
          )
        })}
      </div>


      {/* Confidence slider - hidden in exam mode */}
      {!showAnswer && !disabled && (
        <div className="pt-2">
          <ConfidenceSlider
            value={attempt?.confidence ?? null}
            onChange={onConfidence}
            required
          />
        </div>
      )}
    </div>
  )
}

