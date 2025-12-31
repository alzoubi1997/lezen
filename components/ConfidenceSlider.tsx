'use client'

import { useTranslations } from 'next-intl'

interface ConfidenceSliderProps {
  value: number | null
  onChange: (value: number) => void
  required?: boolean
}

export default function ConfidenceSlider({
  value,
  onChange,
  required = false,
}: ConfidenceSliderProps) {
  const t = useTranslations()
  const currentValue = value ?? 50

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {t('runner.confidence')} {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-sm font-bold">{currentValue}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={currentValue}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
        style={{
          background: `linear-gradient(to right, #0ea5e9 0%, #0ea5e9 ${currentValue}%, #e5e7eb ${currentValue}%, #e5e7eb 100%)`,
        }}
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

