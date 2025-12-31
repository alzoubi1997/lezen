import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import RunnerContent from '@/components/RunnerContent'

interface RunnerPageProps {
  params: {
    attemptId: string
  }
}

export default async function RunnerPage({ params }: RunnerPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <Layout>
      <RunnerContent attemptId={params.attemptId} />
    </Layout>
  )
}

