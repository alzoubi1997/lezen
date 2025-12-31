'use client'

import Layout from '@/components/Layout'
import ModelsContent from '@/components/ModelsContent'
import { useSearchParams } from 'next/navigation'

// Make this a client component to avoid blocking server-side auth check
// Auth will be handled client-side in Layout component
export default function ModelsPage() {
  const searchParams = useSearchParams()
  const kind = searchParams.get('kind')
  return (
    <Layout>
      <ModelsContent initialKind={kind || undefined} />
    </Layout>
  )
}

