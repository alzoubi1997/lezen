import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import ErrorsContent from '@/components/ErrorsContent'

export default async function ErrorsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <Layout>
      <ErrorsContent />
    </Layout>
  )
}

