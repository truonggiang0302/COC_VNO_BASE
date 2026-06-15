'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Shield, LogOut, User, Settings } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import type { UserRole } from '@/types'

interface HeaderUser {
  email: string
  role: UserRole
}

export default function Header() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<HeaderUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authUser.id)
          .single()

        setUser({
          email: authUser.email ?? '',
          role: (profile?.role as UserRole) ?? 'viewer',
        })
      }
      setLoading(false)
    }
    loadUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    toast.success('Đã đăng xuất')
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="relative border-b border-stone-750 bg-gradient-to-b from-[#1a1410] to-[#141210] shadow-lg shadow-black/40">
      {/* Top gold line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-gold-500 to-transparent" />

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-700 bg-gradient-to-b from-gold-600 to-gold-800 shadow-lg shadow-gold-900/50 transition-transform group-hover:scale-105">
            <Shield className="h-5 w-5 text-stone-950" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="gold-shimmer text-xl font-bold tracking-wide">
              CoC VNO
            </span>
            <span className="text-xs text-stone-400 tracking-widest uppercase">
              Clash of Clans
            </span>
          </div>
        </Link>

        {/* Right side */}
        <nav className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-stone-800" />
          ) : user ? (
            <>
              {/* Admin link - chỉ hiển thị với admin/super_admin */}
              {(user.role === 'admin' || user.role === 'super_admin') && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-1.5 rounded-md border border-stone-750 bg-stone-850 px-3 py-1.5 text-sm text-stone-400 transition-colors hover:border-gold-700 hover:text-gold-400"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Quản trị
                </Link>
              )}
              {/* User info + logout */}
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-1.5 sm:flex">
                  <User className="h-3.5 w-3.5 text-stone-500" />
                  <span className="max-w-[140px] truncate text-xs text-stone-500">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 rounded-md border border-stone-750 px-2.5 py-1.5 text-xs text-stone-500 transition-colors hover:border-red-800 hover:text-red-400"
                >
                  <LogOut className="h-3 w-3" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            </>
          ) : null /* Không login → không hiển thị gì (middleware sẽ redirect) */}
        </nav>
      </div>

      {/* Bottom gold line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-800/40 to-transparent" />
    </header>
  )
}