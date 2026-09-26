'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ZoomIn } from 'lucide-react'

interface LightboxProps {
  src: string
  alt?: string
  caption?: string
  onClose: () => void
}

export default function Lightbox({ src, alt, caption, onClose }: LightboxProps) {
  // Đóng bằng phím Escape + khóa scroll nền
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  // Render qua Portal ra <body> để không bị ảnh hưởng bởi transform của card cha
  // (card có class hover:-translate-y-0.5 làm position:fixed sai tọa độ)
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Nút đóng */}
      <button
        onClick={onClose}
        className="absolute right-3 top-3 z-10 rounded-full border border-stone-700 bg-stone-900/80 p-2.5 text-stone-300 transition-colors hover:border-gold-600 hover:text-gold-400"
        aria-label="Đóng"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Ảnh phóng to - dùng img thường để max-h/max-w hoạt động chính xác */}
      <img
        src={src}
        alt={alt || 'Preview'}
        className="max-h-[80vh] max-w-[92vw] object-contain"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* Caption */}
      {caption && (
        <p
          className="mt-4 max-w-xl px-4 text-center text-sm text-stone-400"
          onClick={(e) => e.stopPropagation()}
        >
          {caption}
        </p>
      )}

      {/* Hint cho mobile */}
      <p className="mt-2 flex items-center gap-1 text-xs text-stone-600">
        <ZoomIn className="h-3 w-3" />
        Chạm ra ngoài để đóng
      </p>
    </div>,
    document.body,
  )
}
