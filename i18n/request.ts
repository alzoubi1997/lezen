import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export default getRequestConfig(async () => {
  try {
    const cookieStore = await cookies()
    let locale = (cookieStore.get('locale')?.value || 'nl') as 'nl' | 'ar'
    
    // Validate locale
    if (locale !== 'nl' && locale !== 'ar') {
      locale = 'nl'
    }

    const messages = (await import(`../messages/${locale}.json`)).default

    return {
      locale,
      messages,
    }
  } catch (error) {
    console.error('Error in i18n request config:', error)
    // Fallback to Dutch
    const messages = (await import(`../messages/nl.json`)).default
    return {
      locale: 'nl',
      messages,
    }
  }
})

