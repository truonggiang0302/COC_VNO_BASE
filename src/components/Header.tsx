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
  KeyRound,
  Loader2,
  Play,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import type { UserRole } from '@/types'

interface HeaderUser {
  email: string      // email thật (dùng để tra cứu DB)
  displayName: string // tên hiển thị
  role: UserRole
}

export default function Header() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<HeaderUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showChangePw, setShowChangePw] = useState(false)
  const [showLeaguePanel, setShowLeaguePanel] = useState(false)
  const [leagueTag, setLeagueTag] = useState('')
  const [savingTag, setSavingTag] = useState(false)
  const [savingReg, setSavingReg] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  // ---- Đổi mật khẩu của chính mình ----
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

  // ---- Đóng menu khi click ra ngoài ----
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ---- Nạp thông tin user đang đăng nhập ----
  useEffect(() => {
    async function loadUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

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

      setUser({ email: authUser.email ?? '', displayName, role })
      setLoading(false)
    }
    loadUser()
  }, [supabase])

  // ---- Giải đấu: nạp tag clan đã lưu ----
  useEffect(() => {
    async function loadLeagueTag() {
      if (!user?.email) return
      const { data } = await supabase
        .from('profiles')
        .select('tag')
        .eq('email', user.email)
        .single()
      if (data?.tag) setLeagueTag(data.tag)
    }
    loadLeagueTag()
  }, [user?.email, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    toast.success('Đã đăng xuất')
    router.push('/auth/login')
    router.refresh()
  }

  // ---- Lưu tag vào profiles ----
  const saveTag = async () => {
    if (!leagueTag.trim()) {
      toast.error('Vui lòng nhập tag clan')
      return
    }
    setSavingTag(true)
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', user?.email ?? '')
      .single()
    if (!data) {
      toast.error('Không tìm thấy tài khoản hiện tại')
      setSavingTag(false)
      return
    }
    const { error } = await supabase
      .from('profiles')
      .update({ tag: leagueTag.trim() })
      .eq('id', data.id)
    if (error) {
      toast.error('Lưu tag thất bại: ' + error.message)
    } else {
      toast.success('Đã lưu tag thành công!')
    }
    setSavingTag(false)
  }

  // ---- Đăng ký giải đấu: lấy member từ API COC và gom theo rank ----
  const handleRegisterLeague = async () => {
    if (!leagueTag.trim()) {
      toast.error('Vui lòng nhập tag clan trước khi đăng ký')
      return
    }
    setSavingReg(true)
    const res = await fetch('/api/admin/register-clan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: leagueTag.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Đăng ký giải đấu thất bại')
    } else {
      toast.success(
        `Đăng ký giải đấu thành công! Đã lấy ${data.participant_count ?? 0} thành viên.`,
      )
      setShowLeaguePanel(false)
      setMenuOpen(false)
      router.push('/league')
    }
    setSavingReg(false)
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
                  {(user.displayName[0] || '?').toUpperCase()}
                </span>
                <span className="hidden max-w-[120px] truncate sm:inline">{user.displayName}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-stone-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-stone-750 bg-stone-900 shadow-xl shadow-black/50">
                  <div className="border-b border-stone-750 px-4 py-2.5">
                    <p className="truncate text-sm font-medium text-stone-200">{user.displayName}</p>
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

                  {/* Menu Giải đấu - bật/tắt form đăng ký */}
                  <button
                    onClick={() => setShowLeaguePanel((v) => !v)}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-stone-300 transition-colors hover:bg-stone-800 hover:text-gold-400"
                  >
                    <Play className="h-4 w-4" />
                    Giải đấu
                  </button>

                  {showLeaguePanel && (
                    <div className="space-y-3 border-t border-stone-750 px-4 py-4">
                      <p className="text-xs text-stone-500">Đăng ký cho tài khoản hiện tại</p>

                      <div className="flex gap-2">
                        <input
                          value={leagueTag}
                          onChange={(e) => setLeagueTag(e.target.value)}
                          placeholder="Tag clan (VD: #9LR8C8P2C)"
                          className="coc-input w-full rounded-md px-3 py-2 text-sm"
                        />
                        <button
                          onClick={saveTag}
                          className="btn-gold flex items-center gap-2 rounded-md px-3 py-2 text-sm"
                          disabled={savingTag}
                        >
                          {savingTag && <Loader2 className="h-4 w-4 animate-spin" />}
                          Lưu tag
                        </button>
                      </div>

                      <button
                        onClick={handleRegisterLeague}
                        disabled={savingReg || !leagueTag.trim()}
                        className="btn-gold flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm disabled:opacity-50"
                      >
                        {savingReg ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        Đăng ký giải đấu
                      </button>

                      <Link
                        href="/league"
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-md border border-stone-750 px-4 py-2 text-sm text-stone-400 transition-colors hover:text-gold-400"
                      >
                        Xem bảng ghép đấu
                      </Link>
                    </div>
                  )}

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
          ) : null}
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
                className="rounded-md border border-stone-750 px-4 py-2 text-sm text-stone-400 transition-colors hover:text-stone-200"
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
