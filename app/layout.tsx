import type { Metadata } from 'next'
import { Inter, Tajawal } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import Script from 'next/script'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const tajawal = Tajawal({
  weight: ['400', '500', '700'],
  subsets: ['arabic'],
  variable: '--font-tajawal',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NT2 Lezen Training',
  description: 'Bilingual Dutch NT2 Lezen exam training app',
  other: {
    'google-adsense-account': 'ca-pub-6914116727588875',
  },
}

export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<JSX.Element> {
  // Get locale from cookie directly - this is more reliable than next-intl
  let locale: 'nl' | 'ar' = 'nl'
  let messages: Record<string, any> = {}

  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    locale = (cookieStore.get('locale')?.value || 'nl') as 'nl' | 'ar'
    
    if (locale !== 'nl' && locale !== 'ar') {
      locale = 'nl'
    }
  } catch (e) {
    // During build, cookies() will throw - use default
    locale = 'nl'
  }

  // Load messages directly - don't depend on next-intl server functions
  try {
    const messagesModule = await import(`../messages/${locale}.json`)
    messages = messagesModule.default || messagesModule
    if (!messages || Object.keys(messages).length === 0) {
      throw new Error('Messages object is empty')
    }
  } catch (e) {
    console.error(`Error loading messages for locale ${locale}:`, e)
    // Fallback to Dutch if locale file doesn't exist
    try {
      const fallbackModule = await import(`../messages/nl.json`)
      messages = fallbackModule.default || fallbackModule
      locale = 'nl'
      if (!messages || Object.keys(messages).length === 0) {
        throw new Error('Fallback messages also empty')
      }
    } catch (e2) {
      console.error('Error loading fallback messages:', e2)
      // Use minimal fallback structure
      messages = {
        common: { appName: 'NT2 Lezen Training' },
        auth: {},
        home: {},
      }
      locale = 'nl'
    }
  }
  return (
    <html lang={locale} dir="ltr">
      <body
        className={`${
          locale === 'ar' ? tajawal.variable : inter.variable
        } font-sans`}
        style={{
          fontFamily:
            locale === 'ar'
              ? 'var(--font-tajawal), system-ui, sans-serif'
              : 'var(--font-inter), system-ui, sans-serif',
        }}
      >
        {/* AdSense Script - Using beforeInteractive to load in head for verification */}
        <Script
          id="adsense-script"
          strategy="beforeInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6914116727588875"
          crossOrigin="anonymous"
        />
        <NextIntlClientProvider messages={messages} locale={locale}>
          {/* @ts-ignore - React type compatibility issue */}
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
