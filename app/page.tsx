'use client'

import Layout from '@/components/Layout'
import HomeContent from '@/components/HomeContent'

// Make this a client component to avoid blocking server-side auth check
// Auth will be handled client-side in Layout component
export default function HomePage() {
  return (
    <Layout>
      <HomeContent />
    </Layout>
  )
}