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
    redirect('/auth/login')
  }

  // Lấy role từ profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'viewer'

  // Nếu là viewer → không có quyền vào dashboard
  if (role === 'viewer') {
    redirect('/')
  }

  const { data: bases, error } = await supabase
    .from('bases')
    .select('*, profiles:created_by ( name )')
    .order('created_at', { ascending: false })

  return (
    <DashboardClient
      initialBases={bases ?? []}
      error={error?.message}
      userEmail={user.email ?? ''}
      userRole={role}
    />
  )
}