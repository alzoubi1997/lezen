'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function ExplanationToggle() {
  const t = useTranslations()
  const [mode, setMode] = useState<'nl' | 'both'>('nl')

  useEffect(() => {
    const saved = localStorage.getItem('explanationMode')
    if (saved === 'both' || saved === 'nl') {
      setMode(saved)
    }
  }, [])

  const toggle = () => {
    const newMode = mode === 'nl' ? 'both' : 'nl'
    setMode(newMode)
    localStorage.setItem('explanationMode', newMode)
  }

  return (
    <button
      onClick={toggle}
      className="rounded px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
      title={t('settings.explanationLanguage')}
    >
      {mode === 'nl' ? 'NL' : 'NL+AR'}
    </button>
  )
}

export function getExplanationMode(): 'nl' | 'both' {
  if (typeof window === 'undefined') return 'nl'
  return (localStorage.getItem('explanationMode') as 'nl' | 'both') || 'nl'
}

