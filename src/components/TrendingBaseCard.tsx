'use client'

import Image from 'next/image'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Copy, ExternalLink, Shield, Flame } from 'lucide-react'
import type { TrendingBase } from '@/lib/clashfox'
import Lightbox from './Lightbox'

interface TrendingBaseCardProps {
  base: TrendingBase
}

export default function TrendingBaseCard({ base }: TrendingBaseCardProps) {
  const [imgError, setImgError] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(base.copyLink)
      toast.success('Đã copy link base! Dán vào Clash of Clans để dùng.')
    } catch {
      toast.error('Copy thất bại, hãy thử lại')
    }
  }

  return (
    <article className="stone-card group flex flex-col overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-0.5">
      {/* Image - click để xem ảnh phóng to */}
      <div
        className="relative aspect-[16/9] w-full cursor-zoom-in overflow-hidden bg-stone-900"
        onClick={() => !imgError && setShowLightbox(true)}
      >
        {!imgError ? (
          <Image
            src={base.imageUrl}
            alt={base.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Shield className="h-12 w-12 text-stone-700" />
          </div>
        )}

        {/* TH Badge */}
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full border border-gold-700 bg-stone-950/80 px-2 py-1 text-xs font-bold text-gold-400 backdrop-blur-sm">
          <Flame className="h-3 w-3" />TH {base.townhall}
        </div>

        {/* Base type badge */}
        <div className="absolute bottom-2 left-2 rounded-md bg-stone-950/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-300 backdrop-blur-sm">
          {base.baseType}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-sm font-semibold leading-tight text-stone-100 line-clamp-2">
          {base.title}
        </h3>

        <p className="text-xs text-stone-500">
          by <span className="font-medium text-stone-400">{base.author}</span>
        </p>

        {base.classification && (
          <p className="text-[11px] text-stone-600">{base.classification}</p>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-2">
          <button
            onClick={() => window.open(base.copyLink, '_blank', 'noopener,noreferrer')}
            className="btn-gold flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Mở
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center rounded-md border border-stone-750 px-3 py-2 text-xs text-stone-400 transition-colors hover:border-gold-700 hover:text-gold-400"
            title="Copy link base"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <a
            href={`https://clashfox.com${base.detailPath}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-md border border-stone-750 px-3 py-2 text-xs text-stone-400 transition-colors hover:border-gold-700 hover:text-gold-400"
            title="Xem nguồn trên ClashFox"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Attribution */}
        <p className="text-[10px] text-stone-700">
          Nguồn:{' '}
          <a
            href="https://clashfox.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-stone-500"
          >
            ClashFox
          </a>
        </p>
      </div>

      {/* Lightbox - xem ảnh phóng to */}
      {showLightbox && (
        <Lightbox
          src={base.imageUrl}
          alt={base.title}
          caption={`${base.title} – ${base.baseType}`}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </article>
  )
}
