import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import ResultsContent from '@/components/ResultsContent'

interface ResultsPageProps {
  params: {
    attemptId: string
  }
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <Layout>
      <ResultsContent attemptId={params.attemptId} />
    </Layout>
  )
}

