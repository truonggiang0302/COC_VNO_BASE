'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/utils/supabase/client'
import type { Profile, UserRole } from '@/types'
import { cn } from '@/lib/cn'
import { Shield, Loader2, UserPlus, UserCog } from 'lucide-react'

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  viewer: 'Người xem',
}

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-red-950 text-red-400 border border-red-800',
  admin: 'bg-gold-950 text-gold-400 border border-gold-800',
  viewer: 'bg-stone-800 text-stone-400 border border-stone-700',
}

export default function UserManage() {
  const supabase = createClient()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('viewer')
  const [creating, setCreating] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Không thể tải danh sách user')
    } else {
      setUsers(data as Profile[])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newEmail.trim() || !newPassword.trim()) {
      toast.error('Vui lòng nhập email và mật khẩu')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setCreating(true)

    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error('Tạo user thất bại: ' + data.error)
      setCreating(false)
      return
    }

    toast.success(`Đã tạo user "${newEmail.trim()}" thành công!`)
    setNewEmail('')
    setNewPassword('')
    setNewRole('viewer')
    setShowCreateForm(false)
    setCreating(false)
    loadUsers()
  }

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      toast.error('Đổi quyền thất bại')
    } else {
      toast.success('Đã đổi quyền thành công!')
      loadUsers()
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-gold-400" />
          <h2 className="text-sm font-semibold text-stone-300">Quản lý người dùng</h2>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-gold flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Tạo tài khoản
        </button>
      </div>

      {/* Create user form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateUser}
          className="mb-6 rounded-xl border border-stone-750 bg-stone-900/50 p-4"
        >
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
            Tạo tài khoản mới
          </h3>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-stone-500">Email</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="email@example.com"
                className="coc-input w-full rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-stone-500">Mật khẩu</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••"
                className="coc-input w-full rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-stone-500">Vai trò</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value as UserRole)}
                className="coc-input w-full rounded-md px-3 py-2 text-sm"
              >
                <option value="viewer">Người xem</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="rounded-md border border-stone-750 px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={creating}
              className="btn-gold flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
            >
              {creating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <UserPlus className="h-3 w-3" />
              )}
              {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      )}

      {/* Users table */}
      <div className="stone-card overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-750 bg-stone-950/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Vai trò</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 hidden sm:table-cell">Ngày tạo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-stone-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-stone-500">
                    Chưa có người dùng nào
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr
                    key={user.id}
                    className={cn(
                      'border-b border-stone-750/50 transition-colors hover:bg-stone-900/30',
                      idx % 2 === 0 ? '' : 'bg-stone-950/20',
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-stone-200">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', ROLE_COLORS[user.role])}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-stone-600 sm:table-cell">
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.role !== 'super_admin' && (
                        <select
                          value={user.role}
                          onChange={e => handleChangeRole(user.id, e.target.value as UserRole)}
                          className="coc-input rounded-md px-2 py-1 text-xs"
                        >
                          <option value="viewer">Người xem</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                      {user.role === 'super_admin' && (
                        <span className="text-xs text-stone-600">Không thể thay đổi</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}