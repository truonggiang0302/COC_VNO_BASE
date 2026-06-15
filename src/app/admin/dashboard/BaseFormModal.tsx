'use client'

import { useState, useRef, type ChangeEvent } from 'react'
import toast from 'react-hot-toast'
import { X, Upload, Loader2, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import type { Base, BaseType } from '@/types'
import { BASE_TYPES, TOWNHALL_LEVELS } from '@/types'
import { cn } from '@/lib/cn'

interface Props {
  base: Base | null
  onClose: () => void
  onSaved: (base: Base, isNew: boolean) => void
}

export default function BaseFormModal({ base, onClose, onSaved }: Props) {
  const isNew = !base
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: base?.name ?? '',
    townhall: base?.townhall ?? 14,
    base_type: (base?.base_type ?? 'War') as BaseType,
    base_link: base?.base_link ?? '',
    description: base?.description ?? '',
    image_url: base?.image_url ?? '',
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(base?.image_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh quá lớn (tối đa 5 MB)')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return form.image_url

    setUploading(true)
    const ext = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from('base-images')
      .upload(fileName, imageFile, { upsert: false })

    setUploading(false)

    if (error) throw new Error('Upload ảnh thất bại: ' + error.message)

    const { data } = supabase.storage.from('base-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) { toast.error('Nhập tên base'); return }
    if (!form.base_link.trim()) { toast.error('Nhập link base'); return }
    if (isNew && !imageFile && !form.image_url) {
      toast.error('Chọn ảnh preview cho base'); return
    }

    setSaving(true)
    try {
      const imageUrl = await uploadImage()

      // Lấy user hiện tại để gán created_by
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const payload = {
        ...form,
        image_url: imageUrl,
        created_by: isNew ? (currentUser?.id ?? null) : undefined,
      }

      if (isNew) {
        const { data, error } = await supabase.from('bases').insert(payload).select().single()
        if (error) throw error
        toast.success('Thêm base thành công!')
        onSaved(data as Base, true)
      } else {
        const { data, error } = await supabase
          .from('bases')
          .update(payload)
          .eq('id', base!.id)
          .select()
          .single()
        if (error) throw error
        toast.success('Cập nhật base thành công!')
        onSaved(data as Base, false)
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? (err as { message: string }).message
            : 'Có lỗi xảy ra'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="stone-card w-full max-w-lg overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-750 px-6 py-4">
          <h2 className="font-semibold text-gold-400">
            {isNew ? 'Thêm Base Mới' : `Sửa: ${base.name}`}
          </h2>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto p-6 max-h-[75vh]">
          {/* Image upload */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-stone-400">
              Ảnh Preview *
            </label>
            <div
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-700 bg-stone-900/50 py-6 transition-colors hover:border-gold-700',
                imagePreview && 'border-solid border-gold-800',
              )}
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-40 w-full rounded-lg object-contain"
                />
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-stone-600" />
                  <p className="text-xs text-stone-500">Click để chọn ảnh (tối đa 5 MB)</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {imagePreview && (
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(''); setForm(f => ({ ...f, image_url: '' })) }}
                className="mt-1 text-xs text-stone-500 hover:text-red-400"
              >
                Xóa ảnh
              </button>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-stone-400">
              Tên Base *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="VD: TH16 Anti 3 Star War Base v2"
              className="coc-input w-full rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* TH + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-stone-400">
                Town Hall *
              </label>
              <select
                value={form.townhall}
                onChange={e => setForm(f => ({ ...f, townhall: parseInt(e.target.value) }))}
                className="coc-input w-full rounded-md px-3 py-2 text-sm"
              >
                {TOWNHALL_LEVELS.map(th => (
                  <option key={th} value={th}>TH {th}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-stone-400">
                Loại Base *
              </label>
              <select
                value={form.base_type}
                onChange={e => setForm(f => ({ ...f, base_type: e.target.value as BaseType }))}
                className="coc-input w-full rounded-md px-3 py-2 text-sm"
              >
                {BASE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Link */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-stone-400">
              Base Link *
            </label>
            <input
              type="url"
              required
              value={form.base_link}
              onChange={e => setForm(f => ({ ...f, base_link: e.target.value }))}
              placeholder="https://link.clashofclans.com/..."
              className="coc-input w-full rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-stone-400">
              Mô tả (tùy chọn)
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả chiến thuật, điểm mạnh của base..."
              className="coc-input w-full rounded-md px-3 py-2 text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-stone-750 px-4 py-2 text-sm text-stone-400 hover:border-stone-600 hover:text-stone-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="btn-gold flex items-center gap-2 rounded-md px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {(saving || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
              {uploading ? 'Đang upload ảnh...' : saving ? 'Đang lưu...' : isNew ? 'Thêm Base' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
