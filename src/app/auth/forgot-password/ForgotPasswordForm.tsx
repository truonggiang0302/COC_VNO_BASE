'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function ForgotPasswordForm() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Vui lòng nhập email')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/login`,
    })

    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setSent(true)
    toast.success('Đã gửi email đặt lại mật khẩu!')
  }

  if (sent) {
    return (
      <div className="stone-card rounded-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center">
          <Image
            src="/logo_vno.png"
            alt="VNO Logo"
            width={200}
            height={108}
            className="w-full h-auto drop-shadow-2xl"
            priority
          />
        </div>
        <h1 className="mb-2 font-display text-xl font-bold text-stone-100">Đã gửi email!</h1>
        <p className="mb-6 text-sm text-stone-500">
          Vui lòng kiểm tra hộp thư <span className="font-semibold text-stone-300">{email}</span> và làm theo hướng dẫn để đặt lại mật khẩu.
        </p>
        <Link
          href="/auth/login"
          className="btn-gold inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>
      </div>
    )
  }

  return (
    <div className="stone-card rounded-2xl p-8">
      {/* Logo */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-2 flex h-36 w-36 items-center justify-center">
          <Image
            src="/logo_vno.png"
            alt="VNO Logo"
            width={280}
            height={151}
            className="w-full h-auto drop-shadow-2xl"
            priority
          />
        </div>
        <p className="text-sm text-stone-500">
          Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

        <button
          type="submit"
          disabled={loading}
          className="btn-gold flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          {loading ? 'Đang gửi...' : 'Gửi email đặt lại mật khẩu'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-gold-400 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  )
}