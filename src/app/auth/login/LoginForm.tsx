'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Shield, Loader2, LogIn } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      toast.error('Vui lòng nhập email và mật khẩu')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (error) {
      toast.error(error.message === 'Invalid login credentials'
        ? 'Email hoặc mật khẩu không đúng'
        : error.message)
      return
    }

    toast.success('Đăng nhập thành công!')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="stone-card rounded-2xl p-8">
      {/* Logo */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold-700 bg-gradient-to-b from-gold-600 to-gold-800 shadow-lg shadow-gold-900/50">
          <Shield className="h-7 w-7 text-stone-950" />
        </div>
        <h1 className="gold-shimmer font-display text-2xl font-bold">CoC VNO</h1>
        <p className="mt-1 text-sm text-stone-500">Đăng nhập để tiếp tục</p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-stone-400">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="coc-input w-full rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-stone-400">
            Mật khẩu
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="coc-input w-full rounded-md px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-gold flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/auth/forgot-password"
          className="text-xs text-stone-500 hover:text-gold-400 transition-colors"
        >
          Quên mật khẩu?
        </Link>
      </div>
    </div>
  )
}