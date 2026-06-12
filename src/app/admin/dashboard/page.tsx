import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import DashboardClient from './DashboardClient'

export const metadata = { title: 'Dashboard – CoC Base Hub' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: bases, error } = await supabase
    .from('bases')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <DashboardClient
      initialBases={bases ?? []}
      error={error?.message}
      userEmail={user.email ?? ''}
    />
  )
}
