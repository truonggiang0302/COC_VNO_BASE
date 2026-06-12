'use client'

import { AlertTriangle } from 'lucide-react'

interface Props {
  baseName: string
  onCancel: () => void
  onConfirm: () => void
}

export default function DeleteConfirmModal({ baseName, onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="stone-card w-full max-w-sm overflow-hidden rounded-2xl p-6">
        <div className="mb-4 flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-900 bg-red-950">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-100">Xác nhận xóa</h3>
            <p className="mt-1 text-sm text-stone-400">
              Bạn có chắc muốn xóa base{' '}
              <span className="font-semibold text-gold-400">&ldquo;{baseName}&rdquo;</span>?
              Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md border border-stone-750 px-4 py-2 text-sm text-stone-400 hover:text-stone-200 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-red-900 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-800 transition-colors border border-red-800"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  )
}
