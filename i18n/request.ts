import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export default getRequestConfig(async ({ requestLocale }) => {
  // During build/static generation, requestLocale might be available
  // Otherwise, try to get from cookies
  let locale: 'nl' | 'ar' = 'nl'
  
  // If requestLocale is provided (from headers), use it
  // requestLocale is a Promise, so we need to await it
  const resolvedLocale = requestLocale ? await requestLocale : null
  if (resolvedLocale && (resolvedLocale === 'nl' || resolvedLocale === 'ar')) {
    locale = resolvedLocale
  } else {
    try {
      // Only try to access cookies if we're in a request context (not during build)
      const cookieStore = await cookies()
      locale = (cookieStore.get('locale')?.value || 'nl') as 'nl' | 'ar'
      
      // Validate locale
      if (locale !== 'nl' && locale !== 'ar') {
        locale = 'nl'
      }
    } catch (e) {
      // During build/static generation, cookies() will throw - use default
      // This is expected and safe to ignore
      locale = 'nl'
    }
  }

  const messages = (await import(`../messages/${locale}.json`)).default

  return {
    locale,
    messages,
  }
})

