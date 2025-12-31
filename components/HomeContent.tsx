'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BookOpen, FileText, BarChart3, Share2, Check } from 'lucide-react'
import VisitStats from './VisitStats'

export default function HomeContent() {
  const t = useTranslations()
  const locale = useLocale() as 'nl' | 'ar'
  const router = useRouter()
  const [isTouched, setIsTouched] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)

  const handleShare = async () => {
    const shareData = {
      title: t('home.shareTitle'),
      text: t('home.shareText'),
      url: window.location.href,
    }

    try {
      // Check if Web Share API is supported
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      }
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== 'AbortError') {
        // If not user cancellation, try fallback
        try {
          await navigator.clipboard.writeText(window.location.href)
          setShareSuccess(true)
          setTimeout(() => setShareSuccess(false), 2000)
        } catch (clipboardError) {
          console.error('Failed to share or copy:', clipboardError)
        }
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-12 text-center">
        <div 
          className={`group inline-block relative touch-manipulation cursor-pointer ${isTouched ? 'touched' : ''}`}
          onTouchStart={() => setIsTouched(true)}
          onTouchEnd={() => setTimeout(() => setIsTouched(false), 300)}
          onMouseLeave={() => setIsTouched(false)}
        >
          <div className={`absolute -inset-4 bg-gradient-to-r from-primary-400/20 via-purple-400/20 to-primary-400/20 rounded-3xl blur-2xl transition-opacity duration-500 -z-10 ${isTouched ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
          <div className={`absolute -inset-2 bg-gradient-to-r from-primary-300/10 via-purple-300/10 to-primary-300/10 rounded-2xl blur-xl transition-opacity duration-500 -z-10 ${isTouched ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
          <h2 className={`text-5xl md:text-6xl font-extrabold mb-4 transition-transform duration-300 ${isTouched ? 'scale-105' : 'group-hover:scale-105'}`}>
            <span className={`bg-gradient-to-r bg-clip-text text-transparent transition-all duration-500 ${isTouched ? 'from-primary-500 via-purple-500 to-pink-500' : 'from-primary-600 via-purple-600 to-primary-600 group-hover:from-primary-500 group-hover:via-purple-500 group-hover:to-pink-500'}`}>
              {t('home.title')}
            </span>
            <span className={`ml-3 text-4xl md:text-5xl inline-block transition-all duration-300 ${isTouched ? 'rotate-12 scale-110' : 'group-hover:rotate-12 group-hover:scale-110'}`}>👋</span>
          </h2>
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className={`h-1 rounded-full bg-gradient-to-r from-transparent to-transparent transition-all duration-300 ${isTouched ? 'via-primary-500 w-16' : 'via-primary-600 w-12 group-hover:via-primary-500 group-hover:w-16'}`}></div>
            <span className={`text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent transition-all duration-300 inline-block ${isTouched ? 'from-primary-500 to-pink-500 scale-110' : 'from-primary-600 to-purple-600 group-hover:from-primary-500 group-hover:to-pink-500 group-hover:scale-110'}`}>
              B1 B2 niveau
            </span>
            <div className={`h-1 rounded-full bg-gradient-to-r from-transparent to-transparent transition-all duration-300 ${isTouched ? 'via-purple-500 w-16' : 'via-purple-600 w-12 group-hover:via-purple-500 group-hover:w-16'}`}></div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className={`h-1.5 rounded-full bg-gradient-to-r transition-all duration-300 ${isTouched ? 'from-primary-500 via-purple-500 to-pink-500 w-28' : 'from-primary-600 via-purple-600 to-primary-600 w-24 group-hover:from-primary-500 group-hover:via-purple-500 group-hover:to-pink-500 group-hover:w-28'}`}></div>
            <div className={`h-2 w-2 rounded-full transition-all duration-300 ${isTouched ? 'bg-pink-500 scale-150 shadow-lg shadow-pink-500/50' : 'bg-primary-600 group-hover:bg-pink-500 group-hover:scale-150 group-hover:shadow-lg group-hover:shadow-pink-500/50'}`}></div>
            <div className={`h-1.5 rounded-full bg-gradient-to-r transition-all duration-300 ${isTouched ? 'from-primary-500 via-purple-500 to-pink-500 w-28' : 'from-primary-600 via-purple-600 to-primary-600 w-24 group-hover:from-primary-500 group-hover:via-purple-500 group-hover:to-pink-500 group-hover:w-28'}`}></div>
          </div>
          <div className={`mt-8 max-w-2xl mx-auto ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
            <div className="relative rounded-xl border-2 border-primary-300/60 bg-gradient-to-br from-primary-100/50 via-white to-purple-100/40 px-6 py-5 shadow-lg backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400/10 via-transparent to-purple-400/10"></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500"></div>
              <div className="relative">
                {locale === 'ar' ? (
                  <p 
                    className="text-base md:text-lg text-gray-800 font-bold leading-relaxed text-right"
                    style={{ wordBreak: 'keep-all', hyphens: 'none' }}
                  >
                    جميع النصوص على هذه المنصة تم إنشاؤها بمساعدة الذكاء الاصطناعي وتم ضبطها بعناية على مستوى{' '}
                    <span style={{ whiteSpace: 'nowrap' }}>امتحان <span dir="ltr" style={{ display: 'inline' }}>NT2</span> الرسمي</span>.
                  </p>
                ) : (
                  <p className="text-base md:text-lg text-gray-800 font-bold leading-relaxed text-left">
                    {t('home.aiNotice')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10 grid gap-6 md:grid-cols-2" style={locale === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' }}>
        <button
          onMouseEnter={() => router.prefetch('/models?kind=PRACTICE')}
          onClick={() => {
            // Prefetch for instant navigation
            router.prefetch('/models?kind=PRACTICE')
            router.push('/models?kind=PRACTICE')
          }}
          className="group relative flex flex-col items-start rounded-2xl border-2 border-primary-400/60 bg-gradient-to-br from-white via-primary-50/60 to-purple-50/30 p-8 shadow-xl transition-all hover:border-primary-500 hover:shadow-2xl hover:scale-[1.02] overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-br from-primary-300/40 via-purple-300/30 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500 -z-0"></div>
          <div className="absolute -bottom-5 -left-5 w-32 h-32 bg-gradient-to-tr from-primary-200/30 to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 -z-0"></div>
          <div className="mb-5 rounded-2xl bg-gradient-to-br from-primary-200 via-primary-300 to-purple-200 p-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative z-10">
            <BookOpen className="h-10 w-10 text-primary-700 group-hover:text-primary-800 transition-colors" />
          </div>
          <h3 className="mb-3 text-2xl font-extrabold bg-gradient-to-r from-primary-700 via-purple-600 to-primary-700 bg-clip-text text-transparent relative z-10 group-hover:scale-105 transition-transform duration-300">{t('home.practice')}</h3>
          <p className="text-sm font-bold text-gray-800 leading-relaxed relative z-10 group-hover:text-gray-900 transition-colors">{t('home.practiceDescription')}</p>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-600/0 via-purple-600/0 to-primary-600/0 group-hover:from-primary-600/12 group-hover:via-purple-600/12 group-hover:to-primary-600/12 transition-all duration-300 -z-0"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
        </button>

        <button
          onMouseEnter={() => router.prefetch('/models?kind=EXAM')}
          onClick={() => {
            // Prefetch for instant navigation
            router.prefetch('/models?kind=EXAM')
            router.push('/models?kind=EXAM')
          }}
          className="group relative flex flex-col items-start rounded-2xl border-2 border-emerald-400/60 bg-gradient-to-br from-white via-emerald-50/60 to-green-50/30 p-8 shadow-xl transition-all hover:border-emerald-500 hover:shadow-2xl hover:scale-[1.02] overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-br from-emerald-300/40 via-green-300/30 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500 -z-0"></div>
          <div className="absolute -bottom-5 -left-5 w-32 h-32 bg-gradient-to-tr from-emerald-200/30 to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 -z-0"></div>
          <div className="mb-5 rounded-2xl bg-gradient-to-br from-emerald-200 via-green-300 to-emerald-300 p-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative z-10">
            <FileText className="h-10 w-10 text-emerald-700 group-hover:text-emerald-800 transition-colors" />
          </div>
          <h3 className="mb-3 text-2xl font-extrabold bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 bg-clip-text text-transparent relative z-10 group-hover:scale-105 transition-transform duration-300">{t('home.exam')}</h3>
          <p className="text-sm font-bold text-gray-800 leading-relaxed relative z-10 group-hover:text-gray-900 transition-colors">{t('home.examDescription')}</p>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-600/0 via-green-600/0 to-emerald-600/0 group-hover:from-emerald-600/12 group-hover:via-green-600/12 group-hover:to-emerald-600/12 transition-all duration-300 -z-0"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
        </button>
      </div>

      <div className="mb-8">
        <button
          onMouseEnter={() => router.prefetch('/dashboard')}
          onClick={() => {
            // Prefetch for instant navigation
            router.prefetch('/dashboard')
            router.push('/dashboard')
          }}
          className="group w-full flex items-center justify-center gap-4 rounded-2xl border-2 border-primary-200/60 bg-gradient-to-br from-white via-primary-50/30 to-white px-8 py-6 text-left shadow-lg transition-all hover:border-primary-400 hover:shadow-xl hover:scale-[1.01]"
        >
          <div className="rounded-2xl bg-gradient-to-br from-primary-100 to-purple-100 p-3 shadow-md group-hover:shadow-lg transition-shadow">
            <BarChart3 className="h-7 w-7 text-primary-600" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            {t('home.dashboard')}
          </span>
        </button>
      </div>

      <div className="mb-8">
        <button
          onClick={handleShare}
          className="group relative w-full flex items-center justify-center gap-4 rounded-2xl border-2 border-pink-200/60 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 px-8 py-6 shadow-lg transition-all hover:border-pink-400 hover:shadow-xl hover:scale-[1.01] overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-br from-pink-300/40 via-purple-300/30 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500 -z-0"></div>
          <div className="absolute -bottom-5 -left-5 w-32 h-32 bg-gradient-to-tr from-pink-200/30 to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 -z-0"></div>
          <div className={`rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 p-3 shadow-md group-hover:shadow-lg transition-all duration-300 ${shareSuccess ? 'scale-110 rotate-12' : 'group-hover:scale-110 group-hover:rotate-3'}`}>
            {shareSuccess ? (
              <Check className="h-7 w-7 text-green-600 transition-all duration-300" />
            ) : (
              <Share2 className="h-7 w-7 text-pink-600 group-hover:text-pink-700 transition-colors" />
            )}
          </div>
          <span className={`text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent transition-all duration-300 ${shareSuccess ? 'scale-105' : ''}`}>
            {shareSuccess ? t('home.shareSuccess') : t('home.share')}
          </span>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-600/0 via-purple-600/0 to-pink-600/0 group-hover:from-pink-600/12 group-hover:via-purple-600/12 group-hover:to-pink-600/12 transition-all duration-300 -z-0"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
        </button>
      </div>

      <VisitStats />
    </div>
  )
}

