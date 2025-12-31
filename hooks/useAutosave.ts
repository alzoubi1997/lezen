import { useEffect, useRef } from 'react'

interface AutosaveOptions {
  onSave: () => Promise<void>
  interval?: number
  onAnswerChange?: () => void
}

export function useAutosave({ onSave, interval = 10000, onAnswerChange }: AutosaveOptions) {
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSaveRef = useRef<number>(Date.now())

  const triggerSave = async () => {
    try {
      await onSave()
      lastSaveRef.current = Date.now()
    } catch (error) {
      console.error('Autosave failed:', error)
    }
  }

  useEffect(() => {
    // Periodic autosave
    const intervalId = setInterval(() => {
      const timeSinceLastSave = Date.now() - lastSaveRef.current
      if (timeSinceLastSave >= interval) {
        triggerSave()
      }
    }, interval)

    return () => {
      clearInterval(intervalId)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [onSave, interval])

  const saveOnChange = () => {
    // Debounced save on answer change
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      triggerSave()
      onAnswerChange?.()
    }, 1000)
  }

  return { saveOnChange, triggerSave }
}

