'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Key, Plus, Trash2, Power, PowerOff, Loader2, Copy } from 'lucide-react'
import { cn } from '@/lib/cn'

type ApiConfig = {
  id: string
  name: string
  base_url: string
  api_key: string
  enabled: boolean
  created_at: string
}

const EMPTY_FORM = { name: '', base_url: '', api_key: '', enabled: true }

export default function ApiConfigManage() {
  const [configs, setConfigs] = useState<ApiConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/api-configs')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi tải dữ liệu')
      setConfigs(data.configs ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.base_url.trim() || !form.api_key.trim()) {
      toast.error('Vui lòng nhập đủ tên, base URL và api key')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/api-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Thêm thất bại')
      toast.success('Đã thêm API config!')
      setForm(EMPTY_FORM)
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Thêm thất bại')
    } finally {
      setSaving(false)
    }
  }

  const toggleEnabled = async (config: ApiConfig) => {
    setBusyId(config.id)
    try {
      const res = await fetch(`/api/admin/api-configs/${config.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !config.enabled }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cập nhật thất bại')
      toast.success(config.enabled ? 'Đã tắt API' : 'Đã bật API')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (config: ApiConfig) => {
    if (!window.confirm(`Xóa API config "${config.name}"?`)) return
    setBusyId(config.id)
    try {
      const res = await fetch(`/api/admin/api-configs/${config.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Xóa thất bại')
      toast.success(`Đã xóa "${config.name}"`)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại')
    } finally {
      setBusyId(null)
    }
  }

  const copyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key)
      toast.success('Đã copy api key')
    } catch {
      toast.error('Không copy được')
    }
  }

  const maskKey = (key: string) =>
    key.length <= 8 ? '••••••••' : `${key.slice(0, 4)}${'•'.repeat(12)}${key.slice(-4)}`

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-100">Quản lý API</h2>
          <p className="mt-1 text-sm text-stone-400">
            Lưu endpoint + api key. Khi đăng ký giải đấu, hệ thống sẽ dùng config đang bật.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-gold flex items-center gap-2 rounded-md px-4 py-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          Thêm API
        </button>
      </div>

      {/* Form thêm mới */}
      {showForm && (
        <div className="stone-card mb-5 space-y-3 rounded-xl p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-400">Tên config</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Clash of Clans Official"
                className="coc-input w-full rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-400">Base URL</label>
              <input
                value={form.base_url}
                onChange={(e) => setForm({ ...form, base_url: e.target.value })}
                placeholder="https://api.clashofclans.com"
                className="coc-input w-full rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-400">API Key</label>
            <input
              value={form.api_key}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
              placeholder="Bearer token / api key"
              className="coc-input w-full rounded-md px-3 py-2 font-mono text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-300">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="h-4 w-4 accent-gold-600"
            />
            Bật ngay
          </label>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowForm(false)
                setForm(EMPTY_FORM)
              }}
              className="rounded-md border border-stone-750 px-4 py-2 text-sm text-stone-400 transition-colors hover:text-stone-200"
            >
              Hủy
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="btn-gold flex items-center gap-2 rounded-md px-4 py-2 text-sm disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Lưu
            </button>
          </div>
        </div>
      )}

      {/* Danh sách */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-stone-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Đang tải...
        </div>
      ) : configs.length === 0 ? (
        <div className="stone-card rounded-xl p-10 text-center">
          <Key className="mx-auto mb-3 h-9 w-9 text-stone-600" />
          <p className="text-stone-400">Chưa có API config nào</p>
          <p className="mt-1 text-sm text-stone-600">Bấm &quot;Thêm API&quot; để nhập endpoint + api key</p>
        </div>
      ) : (
        <div className="stone-card overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-750 text-xs uppercase tracking-wider text-stone-500">
                  <th className="px-4 py-3 text-left">Tên</th>
                  <th className="hidden px-4 py-3 text-left md:table-cell">Base URL</th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell">API Key</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-stone-800/60 transition-colors last:border-0 hover:bg-stone-800/40"
                  >
                    <td className="px-4 py-3 font-medium text-stone-200">{c.name}</td>
                    <td className="hidden max-w-[220px] truncate px-4 py-3 font-mono text-xs text-stone-500 md:table-cell">
                      {c.base_url}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <button
                        onClick={() => copyKey(c.api_key)}
                        title="Copy api key"
                        className="flex items-center gap-1.5 font-mono text-xs text-stone-500 transition-colors hover:text-gold-400"
                      >
                        {maskKey(c.api_key)}
                        <Copy className="h-3 w-3" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-block rounded-full border px-2 py-0.5 text-xs',
                          c.enabled
                            ? 'border-emerald-800 bg-emerald-950/40 text-emerald-400'
                            : 'border-stone-700 bg-stone-800 text-stone-500',
                        )}
                      >
                        {c.enabled ? 'Đang bật' : 'Đã tắt'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleEnabled(c)}
                          disabled={busyId === c.id}
                          title={c.enabled ? 'Tắt API' : 'Bật API'}
                          className={cn(
                            'rounded-md p-2 transition-colors disabled:opacity-50',
                            c.enabled
                              ? 'text-emerald-400 hover:bg-emerald-950/40'
                              : 'text-stone-500 hover:bg-stone-800 hover:text-stone-300',
                          )}
                        >
                          {busyId === c.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : c.enabled ? (
                            <Power className="h-4 w-4" />
                          ) : (
                            <PowerOff className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          disabled={busyId === c.id}
                          title="Xóa"
                          className="rounded-md p-2 text-stone-500 transition-colors hover:bg-red-950/40 hover:text-red-400 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
