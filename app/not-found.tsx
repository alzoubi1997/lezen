'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const [locale, setLocale] = useState<'nl' | 'ar'>('nl')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const cookieLocale = document.cookie
        .split('; ')
        .find((row) => row.startsWith('locale='))
        ?.split('=')[1] as 'nl' | 'ar'
      if (cookieLocale === 'nl' || cookieLocale === 'ar') {
        setLocale(cookieLocale)
      }
    } catch (e) {
      // Fallback to default
    }
  }, [])

  const isArabic = locale === 'ar'
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="mb-4 text-4xl font-bold">404</h1>
      <p className="mb-8 text-gray-600">
        {isArabic ? 'الصفحة غير موجودة' : 'Pagina niet gevonden'}
      </p>
      <Link
        href="/"
        className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
      >
        {isArabic ? 'العودة إلى الصفحة الرئيسية' : 'Terug naar home'}
      </Link>
    </div>
  )
}

