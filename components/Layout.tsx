'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import LanguageToggle from './LanguageToggle'
import AuthModal from './AuthModal'
import { LogOut } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

// Fallback translation function
const fallbackT = (key: string): string => {
  const fallbacks: Record<string, string> = {
    'common.appName': 'NT2 Lezen Training',
    'auth.logout': 'Logout',
  }
  return fallbacks[key] || key
}

// Helper to get locale from cookie on client
const getLocaleFromCookie = (): 'nl' | 'ar' => {
  if (typeof document === 'undefined') return 'nl'
  const cookies = document.cookie.split(';')
  const localeCookie = cookies.find(c => c.trim().startsWith('locale='))
  if (localeCookie) {
    const locale = localeCookie.split('=')[1]?.trim()
    if (locale === 'nl' || locale === 'ar') {
      return locale
    }
  }
  return 'nl'
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showAuth, setShowAuth] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Get translations and locale - hooks must be called unconditionally
  const t = useTranslations()
  const locale = useLocale() as 'nl' | 'ar'

  // Only check auth once on mount, and when pathname changes to non-auth pages
  useEffect(() => {
    // Skip auth check if already on auth page
    if (pathname === '/auth') {
      setShowAuth(false)
      return
    }

    // Check auth only if user is not already set (avoid unnecessary calls)
    if (!user) {
      checkAuth()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]) // Only re-check when pathname changes

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        // Add cache to avoid redundant checks
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setShowAuth(false)
      } else {
        if (pathname !== '/auth') {
          setShowAuth(true)
        }
      }
    } catch (err) {
      if (pathname !== '/auth') {
        setShowAuth(true)
      }
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setShowAuth(false)
      window.location.href = '/auth'
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear user state and redirect even if API call fails
      setUser(null)
      setShowAuth(false)
      window.location.href = '/auth'
    }
  }

  // Get app name - use translations which should match server via NextIntlClientProvider
  // suppressHydrationWarning prevents error if there's a temporary mismatch
  const appName = t('common.appName')

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-gray-200/60 bg-gradient-to-r from-white via-gray-50/30 to-white shadow-lg backdrop-blur-sm">
        <div className={`mx-auto flex max-w-7xl items-center px-2 md:px-6 py-2 justify-between gap-1.5 md:gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Link href="/" className={`group flex-[2] flex items-center overflow-visible ${locale === 'ar' ? 'justify-end' : 'justify-start'}`} suppressHydrationWarning>
            <h1 className={`text-xs md:text-base font-extrabold bg-gradient-to-r from-primary-600 via-purple-600 to-primary-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform leading-tight whitespace-nowrap ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
              {appName}
            </h1>
          </Link>
          <div className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-shrink-0' : 'flex-shrink-0'}`}>
            {locale === 'ar' ? (
              <>
                {user && (
                  <button
                    onClick={handleLogout}
                    className="rounded-xl p-1.5 hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 transition-all hover:shadow-md border border-transparent hover:border-red-200/60 flex items-center"
                    aria-label={t('auth.logout')}
                  >
                    <LogOut className="h-3.5 w-3.5 text-gray-600 hover:text-red-600 transition-colors" />
                  </button>
                )}
                <LanguageToggle />
              </>
            ) : (
              <>
                <LanguageToggle />
                {user && (
                  <button
                    onClick={handleLogout}
                    className="rounded-xl p-1.5 hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 transition-all hover:shadow-md border border-transparent hover:border-red-200/60 flex items-center"
                    aria-label={t('auth.logout')}
                  >
                    <LogOut className="h-3.5 w-3.5 text-gray-600 hover:text-red-600 transition-colors" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <AuthModal
        isOpen={showAuth}
        onClose={() => {
          setShowAuth(false)
          checkAuth()
        }}
      />
    </div>
  )
}
