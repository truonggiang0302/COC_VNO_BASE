'use client'

import { useEffect } from 'react'
import Image from 'next/image'
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

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm"
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

      {/* Ảnh phóng to */}
      <div
        className="relative mx-4 w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[4/3] max-h-[85vh] w-full">
          <Image
            src={src}
            alt={alt || 'Preview'}
            fill
            className="object-contain"
            sizes="100vw"
            unoptimized
            priority
          />
        </div>
      </div>

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
    </div>
  )
}
