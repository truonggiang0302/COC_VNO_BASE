'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  ChevronDown,
  LogOut,
  Settings,
  Dices,
  Swords,
  KeyRound,
  Loader2,
} from 'lucide-react'
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
  const [showChangePw, setShowChangePw] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Đổi mật khẩu của chính mình
  const handleChangePassword = async () => {
    if (newPw.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    if (newPw !== confirmPw) {
      toast.error('Mật khẩu nhập lại không khớp')
      return
    }
    setChangingPw(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) {
      toast.error('Đổi mật khẩu thất bại: ' + error.message)
    } else {
      toast.success('Đã đổi mật khẩu thành công!')
      setShowChangePw(false)
      setNewPw('')
      setConfirmPw('')
      setMenuOpen(false)
    }
    setChangingPw(false)
  }

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
                    href="/lucky-number"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-300 transition-colors hover:bg-stone-800 hover:text-gold-400"
                  >
                    <Dices className="h-4 w-4" />
                    Giải đấu CWL
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
                      setShowChangePw(true)
                      setNewPw('')
                      setConfirmPw('')
                    }}
                    className="flex w-full items-center gap-2.5 border-t border-stone-750 px-4 py-2.5 text-left text-sm text-stone-300 transition-colors hover:bg-stone-800 hover:text-gold-400"
                  >
                    <KeyRound className="h-4 w-4" />
                    Đổi mật khẩu
                  </button>

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

      {/* Modal đổi mật khẩu */}
      {showChangePw && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowChangePw(false)}
        >
          <div
            className="stone-card w-full max-w-sm rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-800 bg-gold-950">
                <KeyRound className="h-5 w-5 text-gold-400" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-100">Đổi mật khẩu</h3>
                <p className="mt-1 text-sm text-stone-400">
                  Nhập mật khẩu mới cho tài khoản của bạn
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                className="coc-input w-full rounded-md px-3 py-2 text-sm"
                autoFocus
              />
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="coc-input w-full rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowChangePw(false)}
                className="rounded-md border border-stone-750 px-4 py-2 text-sm text-stone-400 hover:text-stone-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPw || newPw.length < 6 || newPw !== confirmPw}
                className="btn-gold flex items-center gap-2 rounded-md px-4 py-2 text-sm disabled:opacity-50"
              >
                {changingPw && <Loader2 className="h-4 w-4 animate-spin" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom gold line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-800/40 to-transparent" />
    </header>
  )
}