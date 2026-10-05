'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ChevronDown, LogOut, Settings, Dices, Flame, Swords } from 'lucide-react'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        setLoading(false)
        return
      }

      let role: UserRole = 'viewer'
      let displayName = authUser.email ?? ''

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', authUser.id)
        .single()

      if (profile) {
        role = profile.role as UserRole
        if (profile.name) displayName = profile.name
      }

      setUser({
        email: displayName,
        role,
      })
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
          <div className="relative h-14 w-14 transition-transform group-hover:scale-105">
            <Image
              src="/logo_vno.png"
              alt="CoC VNO Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="gold-shimmer text-xl font-bold tracking-wide">
              VietNamOnline
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
            <div ref={menuRef} className="relative">
              {/* Nút user - mở dropdown */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md border border-stone-750 bg-stone-850 px-3 py-1.5 text-sm text-stone-300 transition-colors hover:border-gold-700 hover:text-gold-400"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-600 text-xs font-bold text-stone-950">
                  {(user.email[0] || '?').toUpperCase()}
                </span>
                <span className="hidden max-w-[120px] truncate sm:inline">{user.email}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-stone-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-stone-750 bg-stone-900 shadow-xl shadow-black/50">
                  <div className="border-b border-stone-750 px-4 py-2.5">
                    <p className="truncate text-sm font-medium text-stone-200">{user.email}</p>
                    <p className="text-xs text-stone-500">
                      {user.role === 'super_admin'
                        ? 'Super Admin'
                        : user.role === 'admin'
                          ? 'Admin'
                          : 'Thành viên'}
                    </p>
                  </div>

                  <Link
                    href="/trending"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-300 transition-colors hover:bg-stone-800 hover:text-gold-400"
                  >
                    <Flame className="h-4 w-4" />
                    Trending
                  </Link>

                  <Link
                    href="/lucky-number"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-300 transition-colors hover:bg-stone-800 hover:text-gold-400"
                  >
                    <Dices className="h-4 w-4" />
                    Đăng ký số
                  </Link>

                  <Link
                    href="/tournament"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-300 transition-colors hover:bg-stone-800 hover:text-gold-400"
                  >
                    <Swords className="h-4 w-4" />
                    Giải đấu
                  </Link>

                  {(user.role === 'admin' || user.role === 'super_admin') && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-300 transition-colors hover:bg-stone-800 hover:text-gold-400"
                    >
                      <Settings className="h-4 w-4" />
                      Quản trị
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      handleLogout()
                    }}
                    className="flex w-full items-center gap-2.5 border-t border-stone-750 px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-950/40"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : null /* Không login → không hiển thị gì (middleware sẽ redirect) */}
        </nav>
      </div>

      {/* Bottom gold line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-800/40 to-transparent" />
    </header>
  )
}