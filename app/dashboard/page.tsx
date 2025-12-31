'use client'

import { Suspense } from 'react'
import Layout from '@/components/Layout'
import DashboardContent from '@/components/DashboardContent'

// Make this a client component to avoid blocking server-side auth check
// Auth will be handled client-side in Layout component
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <Layout>
      <Suspense fallback={<div>Loading...</div>}>
        <DashboardContent />
      </Suspense>
    </Layout>
  )
}

