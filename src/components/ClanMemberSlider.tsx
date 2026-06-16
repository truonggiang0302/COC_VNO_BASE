'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { ClanMember, ClanRole } from '@/types'

const ROLE_COLORS: Record<ClanRole, string> = {
  leader: 'from-yellow-500 to-amber-600',
  co_leader: 'from-red-500 to-orange-500',
  elder: 'from-blue-500 to-indigo-500',
  member: 'from-stone-500 to-stone-600',
}

const ROLE_RING: Record<ClanRole, string> = {
  leader: 'ring-4 ring-yellow-500/60',
  co_leader: 'ring-4 ring-red-500/50',
  elder: 'ring-4 ring-blue-500/40',
  member: 'ring-2 ring-stone-500/30',
}

export default function ClanMemberSlider() {
  const [members, setMembers] = useState<ClanMember[]>([])
  const [loading, setLoading] = useState(true)
  const [centerIndex, setCenterIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/admin/clan-members')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMembers(data)
          setCenterIndex(Math.floor(data.length / 2))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const prev = () => {
    setCenterIndex(i => (i > 0 ? i - 1 : members.length - 1))
  }

  const next = () => {
    setCenterIndex(i => (i < members.length - 1 ? i + 1 : 0))
  }

  if (loading || members.length === 0) return null

  const getVisibleIndices = () => {
    const len = members.length
    const indices: { idx: number; offset: number }[] = []
    for (let offset = -2; offset <= 2; offset++) {
      let idx = centerIndex + offset
      if (idx < 0) idx += len
      if (idx >= len) idx -= len
      indices.push({ idx, offset })
    }
    return indices
  }

  const visible = getVisibleIndices()

  return (
    <div className="relative py-8 overflow-hidden">
      {/* Section title */}
      <div className="mb-6 text-center">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-500">
          Thành Viên Clan
        </h2>
      </div>

      {/* Slider */}
      <div className="relative mx-auto max-w-4xl px-12" ref={containerRef}>
        {/* Gradient edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#141210] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#141210] to-transparent" />

        {/* Arrows */}
        <button
          onClick={prev}
          className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-stone-750 bg-stone-900/80 p-2 text-stone-400 transition-all hover:border-gold-700 hover:text-gold-400"
          aria-label="Trước"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-stone-750 bg-stone-900/80 p-2 text-stone-400 transition-all hover:border-gold-700 hover:text-gold-400"
          aria-label="Sau"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Cards container */}
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          {visible.map(({ idx, offset }) => {
            const member = members[idx]
            const absOff = Math.abs(offset)
            const isCenter = offset === 0

            const size = isCenter ? 'w-28 h-28 sm:w-36 sm:h-36' : absOff === 1 ? 'w-20 h-20 sm:w-28 sm:h-28' : 'w-16 h-16 sm:w-20 sm:h-20'

            const translateY = absOff === 0 ? 0 : absOff === 1 ? 16 : 32

            const scale = isCenter ? 'scale-100' : absOff === 1 ? 'scale-[0.85]' : 'scale-[0.7]'

            const opacity = isCenter ? 'opacity-100' : absOff === 1 ? 'opacity-70' : 'opacity-40'

            return (
              <div
                key={`${member.id}-${offset}`}
                className="flex flex-col items-center transition-all duration-500 ease-out"
                style={{
                  transform: `translateY(${translateY}px) ${scale}`,
                  opacity: isCenter ? 1 : absOff === 1 ? 0.7 : 0.4,
                }}
              >
                {/* Avatar */}
                <div className={cn(
                  'relative rounded-full overflow-hidden transition-all duration-500',
                  size,
                  isCenter ? ROLE_RING[member.role] : '',
                )}>
                  <Image
                    src={member.image_url}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 64px, 144px"
                  />
                </div>

                {/* Name */}
                <span className={cn(
                  'mt-2 font-semibold transition-all duration-300',
                  isCenter ? 'text-sm sm:text-base text-stone-100' : 'text-xs text-stone-400',
                )}>
                  {member.name}
                </span>

                {/* Role badge */}
                <span className={cn(
                  'mt-1 rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg transition-all duration-300',
                  ROLE_COLORS[member.role],
                  isCenter ? 'text-xs px-3 py-1' : '',
                )}>
                  {ROLE_LABELS[member.role]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dots */}
      <div className="mt-6 flex justify-center gap-1.5">
        {members.map((_, i) => (
          <button
            key={i}
            onClick={() => setCenterIndex(i)}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === centerIndex
                ? 'w-6 bg-gold-500'
                : 'w-1.5 bg-stone-700 hover:bg-stone-500',
            )}
          />
        ))}
      </div>
    </div>
  )
}

const ROLE_LABELS: Record<ClanRole, string> = {
  leader: 'Thủ Lĩnh',
  co_leader: 'Đồng Thủ Lĩnh',
  elder: 'Huynh Trưởng',
  member: 'Thành Viên',
}