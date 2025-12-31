'use client'

import Layout from '@/components/Layout'
import DashboardContent from '@/components/DashboardContent'

// Make this a client component to avoid blocking server-side auth check
// Auth will be handled client-side in Layout component
export default function DashboardPage() {
  return (
    <Layout>
      <DashboardContent />
    </Layout>
  )
}

