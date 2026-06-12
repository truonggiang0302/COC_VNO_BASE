'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ExternalLink, Shield } from 'lucide-react'
import { type Base, BASE_TYPE_COLORS } from '@/types'
import { cn } from '@/lib/cn'

interface BaseCardProps {
  base: Base
}

export default function BaseCard({ base }: BaseCardProps) {
  const [imgError, setImgError] = useState(false)

  const handleOpenLink = () => {
    window.open(base.base_link, '_blank', 'noopener,noreferrer')
  }

  return (
    <article className="stone-card group flex flex-col overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-0.5">
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
        {!imgError ? (
          <Image
            src={base.image_url}
            alt={`Base layout ${base.name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Shield className="h-12 w-12 text-stone-700" />
          </div>
        )}

        {/* TH Badge overlay */}
        <div className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-gold-700 bg-stone-950/80 text-xs font-bold text-gold-400 backdrop-blur-sm">
          {base.townhall}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Name + Badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex-1 text-sm font-semibold leading-tight text-stone-100 line-clamp-2">
            {base.name}
          </h3>
          <span
            className={cn(
              'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              BASE_TYPE_COLORS[base.base_type],
            )}
          >
            {base.base_type}
          </span>
        </div>

        {/* Town Hall label */}
        <p className="text-xs text-stone-500">
          Town Hall{' '}
          <span className="font-semibold text-gold-500">TH {base.townhall}</span>
        </p>

        {/* Description */}
        {base.description && (
          <p className="text-xs text-stone-500 line-clamp-2">{base.description}</p>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-1">
          <button
            onClick={handleOpenLink}
            className="btn-gold flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Mở Link
          </button>
        </div>
      </div>
    </article>
  )
}
