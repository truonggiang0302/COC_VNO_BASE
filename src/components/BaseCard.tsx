'use client'

import Image from 'next/image'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { ExternalLink, Shield, Star, Download } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { type Base, BASE_TYPE_COLORS } from '@/types'
import { cn } from '@/lib/cn'

interface BaseCardProps {
  base: Base
}

export default function BaseCard({ base }: BaseCardProps) {
  const supabase = createClient()
  const [imgError, setImgError] = useState(false)
  const [downloads, setDownloads] = useState(base.downloads)
  const [rating, setRating] = useState(base.rating)
  const [ratingCount, setRatingCount] = useState(base.rating_count)
  const [hoverStar, setHoverStar] = useState(0)
  const [selectedStar, setSelectedStar] = useState(0)
  const [ratingLoading, setRatingLoading] = useState(false)

  const handleOpenLink = async () => {
    // Mở link trước
    window.open(base.base_link, '_blank', 'noopener,noreferrer')
    // Tăng downloads (fire-and-forget)
    setDownloads((prev) => prev + 1)
    await supabase.rpc('increment_downloads', { base_id: base.id })
  }

  const handleRate = async (star: number) => {
    if (ratingLoading) return
    setRatingLoading(true)
    setSelectedStar(star)
    setHoverStar(0)

    try {
      const { error } = await supabase.rpc('rate_base', {
        base_id: base.id,
        new_rating: star,
      })
      if (error) throw error

      // Cập nhật UI optimistic
      const newCount = ratingCount + 1
      const newRating = Math.round(((rating * ratingCount) + star) / newCount * 10) / 10
      setRating(newRating)
      setRatingCount(newCount)
      toast.success(`Bạn đã đánh giá ${star} ⭐`)
    } catch {
      toast.error('Đánh giá thất bại, hãy thử lại')
      setSelectedStar(0)
    } finally {
      setRatingLoading(false)
    }
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

        {/* Downloads badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-stone-950/80 px-2 py-1 text-xs text-stone-400 backdrop-blur-sm">
          <Download className="h-3 w-3" />
          {downloads}
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

        {/* Rating stars */}
        <div
          className="flex items-center gap-0.5"
          onMouseLeave={() => hoverStar > 0 && setHoverStar(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={ratingLoading}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverStar(star)}
              className={cn(
                'transition-colors',
                ratingLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
              )}
            >
              <Star
                className={cn(
                  'h-3.5 w-3.5 transition-colors',
                  (hoverStar || selectedStar)
                    ? star <= (hoverStar || selectedStar)
                      ? 'fill-gold-500 text-gold-500'
                      : 'text-stone-600'
                    : star <= Math.round(rating)
                      ? 'fill-gold-500 text-gold-500'
                      : 'text-stone-600',
                )}
              />
            </button>
          ))}
          <span className="ml-1.5 text-[11px] text-stone-500">
            {rating > 0 ? `${rating.toFixed(1)} (${ratingCount})` : 'Chưa có đánh giá'}
          </span>
        </div>

        {/* Author */}
        <p className="text-xs text-stone-600">
          <span className="text-stone-600">by </span>
          <span className="font-medium text-stone-400">
            {base.profiles?.name || 'Unknown'}
          </span>
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
