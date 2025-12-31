'use client'

import { Suspense } from 'react'
import Layout from '@/components/Layout'
import ModelsContent from '@/components/ModelsContent'
import { useSearchParams } from 'next/navigation'

// Make this a client component to avoid blocking server-side auth check
// Auth will be handled client-side in Layout component
export const dynamic = 'force-dynamic'

function ModelsPageContent() {
  const searchParams = useSearchParams()
  const kind = searchParams.get('kind')
  return <ModelsContent initialKind={kind || undefined} />
}

export default function ModelsPage() {
  return (
    <Layout>
      <Suspense fallback={<div>Loading...</div>}>
        <ModelsPageContent />
      </Suspense>
    </Layout>
  )
}

