'use client'

import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'

interface StickyBottomBarProps {
  onPrevious?: () => void
  onNext?: () => void
  onFinish?: () => void
  canGoPrevious: boolean
  canGoNext: boolean
  showFinish?: boolean
}

export default function StickyBottomBar({
  onPrevious,
  onNext,
  onFinish,
  canGoPrevious,
  canGoNext,
  showFinish = false,
}: StickyBottomBarProps) {
  const t = useTranslations()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5" />
          {t('common.previous')}
        </button>

        {showFinish ? (
          <button
            onClick={onFinish}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700"
          >
            <CheckCircle className="h-5 w-5" />
            {t('common.finish')}
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.next')}
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}

