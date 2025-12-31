import { useEffect, useState, useRef } from 'react'

interface UseTimerOptions {
  initialSeconds: number
  onExpire?: () => void
  onTick?: (remaining: number) => void
  paused?: boolean
}

export function useTimer({
  initialSeconds,
  onExpire,
  onTick,
  paused = false,
}: UseTimerOptions) {
  const [remaining, setRemaining] = useState(initialSeconds)
  const [isExpired, setIsExpired] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  // Update remaining when initialSeconds changes (for when data loads)
  useEffect(() => {
    if (initialSeconds > 0 && remaining === 999999) {
      setRemaining(initialSeconds)
    }
  }, [initialSeconds, remaining])

  useEffect(() => {
    if (paused || isExpired) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      return
    }

    if (remaining <= 0) {
      setIsExpired(true)
      onExpire?.()
      return
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const newVal = prev - 1
        onTick?.(newVal)
        if (newVal <= 0) {
          setIsExpired(true)
          onExpire?.()
        }
        return newVal
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [remaining, paused, isExpired, onExpire, onTick])

  return { remaining, isExpired, setRemaining }
}

