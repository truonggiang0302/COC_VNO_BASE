'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, LogOut, Shield, Pencil, Trash2, ExternalLink, Download, Star, UserCog, LayoutGrid, Home } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import type { Base, UserRole } from '@/types'
import { BASE_TYPE_COLORS } from '@/types'
import { cn } from '@/lib/cn'
import BaseFormModal from './BaseFormModal'
import DeleteConfirmModal from './DeleteConfirmModal'
import UserManage from './UserManage'

interface Props {
  initialBases: Base[]
  error?: string
  userEmail: string
  userRole: UserRole
}

type Tab = 'bases' | 'users'

export default function DashboardClient({ initialBases, error, userEmail, userRole }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isSuperAdmin = userRole === 'super_admin'

  const [activeTab, setActiveTab] = useState<Tab>('bases')
  const [bases, setBases] = useState<Base[]>(initialBases)
  const [showForm, setShowForm] = useState(false)
  const [editingBase, setEditingBase] = useState<Base | null>(null)
  const [deletingBase, setDeletingBase] = useState<Base | null>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const handleSaved = (saved: Base, isNew: boolean) => {
    if (isNew) {
      setBases((prev) => [saved, ...prev])
    } else {
      setBases((prev) => prev.map((b) => (b.id === saved.id ? saved : b)))
    }
    setShowForm(false)
    setEditingBase(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingBase) return
    const { error } = await supabase.from('bases').delete().eq('id', deletingBase.id)
    if (error) {
      toast.error('Xóa thất bại: ' + error.message)
    } else {
      setBases((prev) => prev.filter((b) => b.id !== deletingBase.id))
      toast.success(`Đã xóa "${deletingBase.name}"`)
    }
    setDeletingBase(null)
  }

  return (
    <div className="min-h-screen bg-[#0f0d0b]">
      {/* Top bar */}
      <header className="border-b border-stone-750 bg-[#1a1612] px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-700 bg-gradient-to-b from-gold-600 to-gold-800">
              <Shield className="h-4 w-4 text-stone-950" />
            </div>
            <div>
              <h1 className="gold-shimmer font-display text-lg font-bold">Admin Dashboard</h1>
              <p className="text-xs text-stone-500">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'bases' && (
              <button
                onClick={() => { setEditingBase(null); setShowForm(true) }}
                className="btn-gold flex items-center gap-1.5 rounded-md px-4 py-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                Thêm Base
              </button>
            )}
            <a
              href="/"
              className="flex items-center gap-1.5 rounded-md border border-stone-750 px-3 py-2 text-sm text-stone-400 hover:border-gold-700 hover:text-gold-400 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Trang chủ</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md border border-stone-750 px-3 py-2 text-sm text-stone-400 hover:border-red-800 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            Lỗi: {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg border border-stone-750 bg-stone-900/50 p-1">
          <button
            onClick={() => setActiveTab('bases')}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors',
              activeTab === 'bases'
                ? 'bg-gold-800/40 text-gold-400'
                : 'text-stone-500 hover:text-stone-300',
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Quản lý Base
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors',
                activeTab === 'users'
                  ? 'bg-gold-800/40 text-gold-400'
                  : 'text-stone-500 hover:text-stone-300',
              )}
            >
              <UserCog className="h-3.5 w-3.5" />
              Quản lý User
            </button>
          )}
        </div>

        {/* Tab content */}
        {activeTab === 'bases' && (
          <>
            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Tổng bases', value: bases.length },
                { label: 'Tổng lượt tải', value: bases.reduce((s, b) => s + b.downloads, 0) },
                { label: 'Đã có đánh giá', value: bases.filter(b => b.rating_count > 0).length },
                { label: 'TH cao nhất', value: bases.length ? `TH ${Math.max(...bases.map(b => b.townhall))}` : '-' },
              ].map(stat => (
                <div key={stat.label} className="stone-card rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gold-400">{stat.value}</div>
                  <div className="text-xs text-stone-500">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="stone-card overflow-hidden rounded-xl">
              <div className="border-b border-stone-750 px-4 py-3">
                <h2 className="text-sm font-semibold text-stone-300">
                  Danh sách tất cả Base ({bases.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-750 bg-stone-950/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Tên</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">TH</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Loại</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 hidden sm:table-cell">
                        <Download className="inline h-3 w-3" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 hidden sm:table-cell">
                        <Star className="inline h-3 w-3" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 hidden sm:table-cell">Link</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 hidden md:table-cell">Ngày tạo</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bases.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-stone-500">
                          Chưa có base nào. Bấm &ldquo;Thêm Base&rdquo; để bắt đầu.
                        </td>
                      </tr>
                    )}
                    {bases.map((base, idx) => (
                      <tr
                        key={base.id}
                        className={cn(
                          'border-b border-stone-750/50 transition-colors hover:bg-stone-900/30',
                          idx % 2 === 0 ? '' : 'bg-stone-950/20',
                        )}
                      >
                        <td className="px-4 py-3 font-medium text-stone-200 max-w-[200px] truncate">
                          {base.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-gold-800 bg-stone-950 px-2 py-0.5 text-xs font-semibold text-gold-400">
                            TH {base.townhall}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', BASE_TYPE_COLORS[base.base_type])}>
                            {base.base_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-stone-500 text-xs">
                          {base.downloads}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-stone-500 text-xs">
                          {base.rating_count > 0 ? `${base.rating.toFixed(1)} (${base.rating_count})` : '-'}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <a
                            href={base.base_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-stone-500 hover:text-gold-400 transition-colors text-xs"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Mở link
                          </a>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-stone-600">
                          {new Date(base.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setEditingBase(base); setShowForm(true) }}
                              className="rounded-md border border-stone-750 p-1.5 text-stone-400 hover:border-gold-700 hover:text-gold-400 transition-colors"
                              title="Sửa"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingBase(base)}
                              className="rounded-md border border-stone-750 p-1.5 text-stone-400 hover:border-red-700 hover:text-red-400 transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && isSuperAdmin && <UserManage />}
      </main>

      {/* Modals */}
      {showForm && (
        <BaseFormModal
          base={editingBase}
          onClose={() => { setShowForm(false); setEditingBase(null) }}
          onSaved={handleSaved}
        />
      )}
      {deletingBase && (
        <DeleteConfirmModal
          baseName={deletingBase.name}
          onCancel={() => setDeletingBase(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  )
}