'use client'

import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function LanguageToggle() {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations()

  const toggleLanguage = async () => {
    const newLocale = locale === 'nl' ? 'ar' : 'nl'
    
    // Set cookie synchronously - this must happen before reload
    // The cookie will be read by the server on the next request
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
    
    // Update user locale preference via API (non-blocking)
    // Don't await to avoid blocking the language switch
    fetch('/api/user/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: newLocale }),
    }).catch((err) => {
      console.error('Failed to update locale preference:', err)
    })
    
    // Reload the current page with the new locale
    // window.location.reload() preserves the current route, query params, and hash
    // The server will read the new cookie and render the page in the new language
    window.location.reload()
  }

  return (
    <button
      onClick={toggleLanguage}
      className="group relative rounded-xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/50 px-2.5 py-1.5 text-xs md:text-sm font-bold shadow-md transition-all hover:border-primary-300 hover:shadow-lg hover:scale-105 flex items-center"
      aria-label={t('settings.language')}
    >
      <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
        {locale === 'nl' ? 'AR' : 'NL'}
      </span>
      <span className="ml-2 text-xs">→</span>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-600/0 to-purple-600/0 group-hover:from-primary-600/5 group-hover:to-purple-600/5 transition-all -z-10"></div>
    </button>
  )
}

