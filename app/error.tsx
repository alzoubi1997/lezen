'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <html lang="nl">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h2 className="mb-4 text-2xl font-bold">Er is iets misgegaan</h2>
          <p className="mb-8 text-gray-600">{error.message}</p>
          <button
            onClick={reset}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Probeer opnieuw
          </button>
        </div>
      </body>
    </html>
  )
}

