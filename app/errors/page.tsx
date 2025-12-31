'use client'

import Layout from '@/components/Layout'
import ErrorsContent from '@/components/ErrorsContent'

// Make this a client component to avoid blocking server-side auth check
// Auth will be handled client-side in Layout component
export default function ErrorsPage() {
  return (
    <Layout>
      <ErrorsContent />
    </Layout>
  )
}

