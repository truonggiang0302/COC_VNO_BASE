import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import LoginForm from './LoginForm'

export const metadata = { title: 'Đăng nhập – CoC Base Hub' }

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Nếu đã login thì redirect về trang chủ
  if (user) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0d0b] px-4">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}