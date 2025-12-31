'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

// Fallback translations
const fallbackT = (key: string): string => {
  const fallbacks: Record<string, string> = {
    'auth.createProfile': 'Create Profile',
    'auth.login': 'Login',
    'auth.handle': 'Profile ID',
    'auth.pin': 'PIN (4 digits)',
    'auth.createNewProfile': 'Create New Profile',
    'auth.loginExisting': 'Login with Existing Profile',
    'auth.profileCreated': 'Profile Created!',
    'auth.saveHandle': 'Save your Profile ID:',
    'auth.handleWarning': 'You need this to login. Copy and save it.',
    'auth.invalidCredentials': 'Invalid Profile ID or PIN',
    'common.copy': 'Copy',
    'common.continue': 'Continue',
    'common.close': 'Close',
    'common.loading': 'Loading...',
  }
  return fallbacks[key] || key
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'create' | 'login'>('login')
  const [handle, setHandle] = useState('')
  const [pin, setPin] = useState('')
  const [prefix, setPrefix] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdHandle, setCreatedHandle] = useState('')

  // Get translations - hook must be called unconditionally
  const t = useTranslations()

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (typeof document !== 'undefined') {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix, pin }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Er is iets misgegaan')
        setLoading(false)
        return
      }

      setCreatedHandle(data.handle)
      setLoading(false)
    } catch (err) {
      console.error('Create profile fetch error:', err)
      setError('Er is iets misgegaan. Controleer de console voor details.')
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, pin }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t('auth.invalidCredentials'))
        setLoading(false)
        return
      }

      // Success - redirect to home page
      onClose()
      window.location.href = '/'
    } catch (err) {
      console.error('Login fetch error:', err)
      setError('Er is iets misgegaan. Controleer de console voor details.')
      setLoading(false)
    }
  }

  const copyHandle = () => {
    navigator.clipboard.writeText(createdHandle)
  }

  const modalContent = createdHandle ? (
    <div data-auth-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" style={{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:50,backgroundColor:'rgba(0,0,0,0.5)'}}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold">{t('auth.profileCreated')}</h2>
        <p className="mb-2 text-sm text-gray-600">{t('auth.saveHandle')}</p>
        <div className="mb-4 flex items-center gap-2 rounded border bg-gray-50 p-3">
          <code className="flex-1 font-mono text-lg font-bold">
            {createdHandle}
          </code>
          <button
            onClick={copyHandle}
            className="rounded bg-primary-600 px-3 py-1 text-sm text-white hover:bg-primary-700"
          >
            {t('common.copy')}
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-500">{t('auth.handleWarning')}</p>
        <button
          onClick={() => {
            setCreatedHandle('')
            setMode('login')
          }}
          className="w-full rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
        >
          {t('common.continue')}
        </button>
      </div>
    </div>
  ) : (
    <div data-auth-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" style={{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:50,backgroundColor:'rgba(0,0,0,0.5)'}}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" style={{backgroundColor:'white'}}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {mode === 'create'
              ? t('auth.createProfile')
              : t('auth.login')}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => {
              setMode('create')
              setError('')
            }}
            className={`flex-1 rounded px-4 py-2 ${
              mode === 'create'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {t('auth.createNewProfile')}
          </button>
          <button
            onClick={() => {
              setMode('login')
              setError('')
            }}
            className={`flex-1 rounded px-4 py-2 ${
              mode === 'login'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {t('auth.loginExisting')}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {mode === 'create' ? (
          <form onSubmit={handleCreate}>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">
                {t('auth.handle')} (optioneel)
              </label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                placeholder="IMAD"
                maxLength={10}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
              <p className="mt-1 text-xs text-gray-500">
                Laat leeg voor automatische generatie
              </p>
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">
                {t('auth.pin')}
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                maxLength={4}
                required
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={loading || pin.length !== 4}
              className="w-full rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('auth.createProfile')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">
                {t('auth.handle')}
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toUpperCase())}
                placeholder="IMAD-4829"
                required
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">
                {t('auth.pin')}
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                maxLength={4}
                required
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={loading || pin.length !== 4 || !handle}
              className="w-full rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('auth.login')}
            </button>
          </form>
        )}
      </div>
    </div>
  )

  return modalContent
}
