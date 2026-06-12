'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      toast.success('Đăng nhập thành công!')
      router.push('/admin/dashboard')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-stone-400">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          className="coc-input rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-stone-400">
          Mật khẩu
        </label>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="coc-input w-full rounded-md px-3 py-2 pr-10 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-gold-400"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-gold mt-2 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>
  )
}
