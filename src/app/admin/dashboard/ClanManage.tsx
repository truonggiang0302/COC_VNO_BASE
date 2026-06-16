'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import type { ClanMember, ClanRole } from '@/types'
import { CLAN_ROLE_LABELS } from '@/types'
import { cn } from '@/lib/cn'
import { Loader2, UserPlus, Users, Trash2, Pencil, X, Check } from 'lucide-react'

const ROLE_OPTIONS: { value: ClanRole; label: string }[] = [
  { value: 'leader', label: 'Thủ Lĩnh' },
  { value: 'co_leader', label: 'Đồng Thủ Lĩnh' },
  { value: 'elder', label: 'Huynh Trưởng' },
  { value: 'member', label: 'Thành Viên' },
]

const ROLE_COLORS: Record<ClanRole, string> = {
  leader: 'bg-yellow-950 text-yellow-400 border border-yellow-800',
  co_leader: 'bg-red-950 text-red-400 border border-red-800',
  elder: 'bg-blue-950 text-blue-400 border border-blue-800',
  member: 'bg-stone-800 text-stone-400 border border-stone-700',
}

export default function ClanManage() {
  const supabase = createClient()
  const [members, setMembers] = useState<ClanMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<ClanRole>('member')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newOrder, setNewOrder] = useState(0)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<ClanRole>('member')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editOrder, setEditOrder] = useState(0)

  const loadMembers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clan_members')
      .select('*')
      .order('display_order', { ascending: true })
    if (error) {
      toast.error('Không thể tải danh sách thành viên')
    } else {
      setMembers(data as ClanMember[])
    }
    setLoading(false)
  }

  useEffect(() => { loadMembers() }, [])

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `clan_${Date.now()}.${ext}`
    const { data: uploadData, error } = await supabase.storage
      .from('base-images')
      .upload(fileName, file, { contentType: file.type })
    if (error) {
      toast.error('Upload thất bại')
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from('base-images').getPublicUrl(uploadData.path)
    if (isEdit) {
      setEditImageUrl(urlData.publicUrl)
    } else {
      setNewImageUrl(urlData.publicUrl)
    }
    setUploading(false)
    toast.success('Upload thành công!')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newImageUrl) {
      toast.error('Vui lòng nhập tên và upload ảnh')
      return
    }
    setSaving(true)
    const res = await fetch('/api/admin/clan-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), role: newRole, image_url: newImageUrl, display_order: newOrder }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error('Thêm thất bại: ' + data.error); setSaving(false); return }
    toast.success('Đã thêm thành viên!')
    setNewName(''); setNewRole('member'); setNewImageUrl(''); setNewOrder(0); setShowForm(false); setSaving(false)
    loadMembers()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa thành viên này?')) return
    const res = await fetch('/api/admin/clan-members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (!res.ok) toast.error('Xóa thất bại: ' + data.error)
    else { toast.success('Đã xóa thành viên!'); loadMembers() }
  }

  const startEdit = (m: ClanMember) => {
    setEditId(m.id); setEditName(m.name); setEditRole(m.role); setEditImageUrl(m.image_url); setEditOrder(m.display_order)
  }

  const handleSaveEdit = async () => {
    if (!editId || !editName.trim() || !editImageUrl) return
    const res = await fetch('/api/admin/clan-members', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editId, name: editName.trim(), role: editRole, image_url: editImageUrl, display_order: editOrder }),
    })
    const data = await res.json()
    if (!res.ok) toast.error('Cập nhật thất bại: ' + data.error)
    else { toast.success('Đã cập nhật!'); setEditId(null); loadMembers() }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gold-400" />
          <h2 className="text-sm font-semibold text-stone-300">Quản lý thành viên Clan</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-gold flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold">
          <UserPlus className="h-3.5 w-3.5" /> Thêm thành viên
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-stone-750 bg-stone-900/50 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Thêm thành viên mới</h3>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-stone-500">Tên</label>
              <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Tên hiển thị" className="coc-input w-full rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-stone-500">Chức vụ</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value as ClanRole)} className="coc-input w-full rounded-md px-3 py-2 text-sm">
                {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-stone-500">Thứ tự</label>
              <input type="number" value={newOrder} onChange={e => setNewOrder(Number(e.target.value))} className="coc-input w-full rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-stone-500">Ảnh</label>
              <input type="file" accept="image/*" onChange={(e) => handleUploadImage(e, false)} className="coc-input w-full rounded-md px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-gold-600 file:px-2 file:py-1 file:text-xs file:text-stone-900" />
              {uploading && <Loader2 className="mt-1 h-4 w-4 animate-spin text-gold-500" />}
              {newImageUrl && !uploading && <div className="mt-1 relative h-12 w-12"><Image src={newImageUrl} alt="" fill className="rounded object-cover" /></div>}
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-stone-750 px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors">Hủy</button>
            <button type="submit" disabled={saving} className="btn-gold flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-60">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
              {saving ? 'Đang thêm...' : 'Thêm thành viên'}
            </button>
          </div>
        </form>
      )}

      <div className="stone-card overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-750 bg-stone-950/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Ảnh</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Tên</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Chức vụ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Thứ tự</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center text-stone-500"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-stone-500">Chưa có thành viên nào</td></tr>
              ) : (
                members.map((m, idx) => (
                  <tr key={m.id} className={cn('border-b border-stone-750/50 transition-colors hover:bg-stone-900/30', idx % 2 === 0 ? '' : 'bg-stone-950/20')}>
                    <td className="px-4 py-3">
                      {editId === m.id ? (
                        <div className="flex flex-col gap-1">
                          <input type="file" accept="image/*" onChange={(e) => handleUploadImage(e, true)} className="coc-input rounded px-2 py-1 text-xs" />
                          {editImageUrl && <div className="relative h-10 w-10"><Image src={editImageUrl} alt="" fill className="rounded object-cover" /></div>}
                        </div>
                      ) : (
                        <div className="relative h-10 w-10"><Image src={m.image_url} alt={m.name} fill className="rounded-full object-cover" /></div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-200">
                      {editId === m.id ? <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="coc-input w-full rounded px-2 py-1 text-xs" autoFocus /> : m.name}
                    </td>
                    <td className="px-4 py-3">
                      {editId === m.id ? (
                        <select value={editRole} onChange={e => setEditRole(e.target.value as ClanRole)} className="coc-input rounded px-2 py-1 text-xs">
                          {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      ) : (
                        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', ROLE_COLORS[m.role])}>{CLAN_ROLE_LABELS[m.role]}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editId === m.id ? <input type="number" value={editOrder} onChange={e => setEditOrder(Number(e.target.value))} className="coc-input w-16 rounded px-2 py-1 text-xs" /> : <span className="text-xs text-stone-500">{m.display_order}</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editId === m.id ? (
                        <div className="flex justify-end gap-1">
                          <button onClick={handleSaveEdit} className="text-army-400 hover:text-army-300 transition-colors p-1"><Check className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setEditId(null)} className="text-stone-500 hover:text-stone-300 transition-colors p-1"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => startEdit(m)} className="text-stone-600 hover:text-gold-400 transition-colors p-1"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete(m.id)} className="text-stone-600 hover:text-red-400 transition-colors p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
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