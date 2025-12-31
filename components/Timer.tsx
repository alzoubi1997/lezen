'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { formatTime } from '@/lib/utils'
import { Clock } from 'lucide-react'

interface TimerProps {
  initialSeconds: number
  onExpire?: () => void
  onTick?: (remaining: number) => void
}

export default function Timer({
  initialSeconds,
  onExpire,
  onTick,
}: TimerProps) {
  const t = useTranslations()
  const [remaining, setRemaining] = useState(initialSeconds)
  const [isExpired, setIsExpired] = useState(false)

  // Sync with parent's initialSeconds when it changes
  useEffect(() => {
    if (initialSeconds > 0 && initialSeconds < 999999) {
      setRemaining(initialSeconds)
    }
  }, [initialSeconds])

  useEffect(() => {
    if (remaining <= 0) {
      setIsExpired(true)
      onExpire?.()
      return
    }

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const newVal = prev - 1
        onTick?.(newVal)
        return newVal
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [remaining, onExpire, onTick])

  const isLowTime = remaining < 300 // Less than 5 minutes

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
        isExpired
          ? 'bg-red-100 text-red-700'
          : isLowTime
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-gray-100 text-gray-700'
      }`}
    >
      <Clock className="h-4 w-4" />
      <span className="font-mono font-bold">
        {isExpired ? '00:00' : formatTime(remaining)}
      </span>
      <span className="text-xs">{t('runner.timeRemaining')}</span>
    </div>
  )
}

