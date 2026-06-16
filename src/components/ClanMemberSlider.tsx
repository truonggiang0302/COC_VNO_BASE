'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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

const ROLE_LABELS: Record<ClanRole, string> = {
  leader: 'Thủ Lĩnh',
  co_leader: 'Đồng Thủ Lĩnh',
  elder: 'Huynh Trưởng',
  member: 'Thành Viên',
}

export default function ClanMemberSlider() {
  const [members, setMembers] = useState<ClanMember[]>([])
  const [loading, setLoading] = useState(true)
  const [centerIdx, setCenterIdx] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startRef = useRef({ x: 0, t: 0 })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch('/api/admin/clan-members')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (Array.isArray(d) && d.length) { setMembers(d); setCenterIdx(Math.floor(d.length / 2)) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (members.length <= 1) return
    timerRef.current = setInterval(() => setCenterIdx(i => (i + 1) % members.length), 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [members.length])

  const go = useCallback((dir: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCenterIdx(i => (i + dir + members.length) % members.length)
  }, [members.length])

  const onStart = (x: number) => { setDragging(true); startRef.current = { x, t: Date.now() }; if (timerRef.current) clearInterval(timerRef.current) }
  const onMove = (x: number) => { if (dragging) setDragX(x - startRef.current.x) }
  const onEnd = () => {
    if (!dragging) return
    const dt = Date.now() - startRef.current.t
    if (Math.abs(dragX) > 50 && dt < 600) go(dragX > 0 ? -1 : 1)
    setDragX(0); setDragging(false)
  }

  if (loading || !members.length) return null

  const n = members.length
  const getVisible = () => Array.from({ length: 5 }, (_, i) => {
    const offset = i - 2
    return { idx: ((centerIdx + offset) % n + n) % n, offset }
  })

  const visible = getVisible()
  const dragPx = dragging ? (dragX / 200) * 20 : 0

  return (
    <div className="relative py-8 overflow-hidden">
      <div className="mb-6 text-center">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-500">Thành Viên Clan</h2>
      </div>

      <div
        className="relative mx-auto max-w-4xl px-12 select-none cursor-grab active:cursor-grabbing"
        onTouchStart={e => onStart(e.touches[0].clientX)}
        onTouchMove={e => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onTouchCancel={onEnd}
        onMouseDown={e => onStart(e.clientX)}
        onMouseMove={e => dragging && onMove(e.clientX)}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#141210] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#141210] to-transparent" />

        <button onClick={() => go(-1)} className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-stone-750 bg-stone-900/80 p-2 text-stone-400 hover:border-gold-700 hover:text-gold-400 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={() => go(1)} className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-stone-750 bg-stone-900/80 p-2 text-stone-400 hover:border-gold-700 hover:text-gold-400 transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-center gap-2 sm:gap-4" style={{ transition: dragging ? 'none' : 'transform 0.5s cubic-bezier(.4,0,.2,1)', transform: `translateX(${dragPx}px)` }}>
          {visible.map(({ idx, offset }) => {
            const m = members[idx]
            if (!m) return null
            const ab = Math.abs(offset)
            const isCenter = offset === 0
            const sz = isCenter ? 'w-28 h-28 sm:w-36 sm:h-36' : ab === 1 ? 'w-20 h-20 sm:w-28 sm:h-28' : 'w-16 h-16 sm:w-20 sm:h-20'
            const ty = isCenter ? 0 : ab === 1 ? 16 : 32
            const sc = isCenter ? 1 : ab === 1 ? 0.85 : 0.7
            const op = isCenter ? 1 : ab === 1 ? 0.7 : 0.4

            return (
              <div key={`${m.id}-${offset}`} className="flex flex-col items-center"
                style={{ transition: dragging ? 'none' : 'all 0.5s cubic-bezier(.4,0,.2,1)', transform: `translateY(${ty}px) scale(${sc})`, opacity: op }}>
                <div className={cn('relative rounded-full overflow-hidden transition-shadow', sz, isCenter ? ROLE_RING[m.role] : '')}>
                  <Image src={m.image_url} alt={m.name} fill className="object-cover" sizes="(max-width:640px)64px,144px" unoptimized />
                </div>
                <span className={cn('mt-2 font-semibold', isCenter ? 'text-sm sm:text-base text-stone-100' : 'text-xs text-stone-400')}>{m.name}</span>
                <span className={cn('mt-1 rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg', ROLE_COLORS[m.role], isCenter && 'text-xs px-3 py-1')}>
                  {ROLE_LABELS[m.role]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-1.5">
        {members.map((_, i) => (
          <button key={i} onClick={() => { setCenterIdx(i); if (timerRef.current) clearInterval(timerRef.current) }}
            className={cn('h-1.5 rounded-full transition-all duration-300', i === centerIdx ? 'w-6 bg-gold-500' : 'w-1.5 bg-stone-700 hover:bg-stone-500')} />
        ))}
      </div>
    </div>
  )
}
