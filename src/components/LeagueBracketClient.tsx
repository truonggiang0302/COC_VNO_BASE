'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Users, Trophy, GripVertical, RefreshCw, Loader2 } from 'lucide-react'

export type Participant = {
  tag: string
  name: string
  rank: string
  trophies: number
}

export type RegisteredClan = {
  id: string
  user_id: string
  clan_tag: string
  clan_name: string
  participants: Participant[]
  created_at: string
  updated_at: string
}

// Thứ tự ưu tiên hiển thị các rank (số nhỏ = ưu tiên cao)
const RANK_ORDER: Record<string, number> = {
  'Legend III': 1,
  'Legend II': 2,
  'Legend I': 3,
  'Master': 4,
  'Grandmaster': 5,
  'Champion': 6,
  'Crystal': 7,
  'Gold': 8,
  'Silver': 9,
  'Bronze': 10,
  'Unranked': 99,
}

const RANK_COLORS: Record<string, string> = {
  'Legend III': 'border-gold-700 bg-gold-950/40',
  'Legend II': 'border-slate-600 bg-slate-800/40',
  'Legend I': 'border-amber-700 bg-amber-950/30',
  Master: 'border-blue-700 bg-blue-950/30',
  Grandmaster: 'border-purple-700 bg-purple-950/30',
  Unranked: 'border-stone-700 bg-stone-800/40',
}

function rankSortKey(rank: string) {
  const base = RANK_ORDER[rank] ?? 50
  return `${String(base).padStart(3, '0')}_${rank}`
}

function rankColor(rank: string) {
  return RANK_COLORS[rank] ?? 'border-stone-700 bg-stone-800/40'
}

export default function LeagueBracketClient() {
  const [clans, setClans] = useState<RegisteredClan[]>([])
  const [rowsByRank, setRowsByRank] = useState<Record<string, Participant[]>>({})
  const [loading, setLoading] = useState(true)
  const [reloading, setReloading] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)

  const load = async (isReload = false) => {
    if (isReload) setReloading(true)
    try {
      const res = await fetch('/api/admin/registered-clans')
      const data = await res.json()
      if (res.ok && data.clans?.length) {
        setClans(data.clans)
        setRowsByRank(groupByRank(data.clans))
      } else if (!data.clans?.length) {
        toast.error('Chưa có dữ liệu đăng ký')
      } else {
        toast.error(data.error || 'Không tải được dữ liệu')
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ')
    } finally {
      setLoading(false)
      setReloading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const flattened = (clansList: RegisteredClan[]): Participant[] =>
    clansList.flatMap((c) => (c.participants ?? []) as Participant[])

  const groupByRank = (clansList: RegisteredClan[]): Record<string, Participant[]> => {
    const groups: Record<string, Participant[]> = {}
    for (const p of flattened(clansList)) {
      const rank = p.rank || 'Unranked'
      ;(groups[rank] = groups[rank] ?? []).push(p)
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => b.trophies - a.trophies)
    }
    return groups
  }

  const flattenRows = (groups: Record<string, Participant[]>): Participant[] => {
    const out: Participant[] = []
    for (const rank of Object.keys(groups).sort((a, b) =>
      rankSortKey(a).localeCompare(rankSortKey(b)),
    )) {
      out.push(...groups[rank])
    }
    return out
  }

  const handleDragStart = (e: React.DragEvent, rank: string, participant: Participant) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ rank, tag: participant.tag, name: participant.name, trophies: participant.trophies }),
    )
    e.dataTransfer.effectAllowed = 'move'
    setDragging(rank)
  }

  const handleDrop = async (e: React.DragEvent, targetRank: string) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData('application/json')
    if (!raw) return

    let item: Participant
    try {
      item = JSON.parse(raw)
    } catch {
      return
    }

    const next: Record<string, Participant[]> = { ...rowsByRank }
    const oldRank = item.rank
    const oldList = next[oldRank]
    const idx = oldList?.findIndex((p) => p.tag === item.tag && p.name === item.name) ?? -1
    if (idx === -1) return
    const [moved] = oldList.splice(idx, 1)
    moved.rank = targetRank

    next[targetRank] = next[targetRank] ?? []
    next[targetRank].push(moved)
    next[targetRank].sort((a, b) => b.trophies - a.trophies)

    setRowsByRank(next)
    setDragging(null)

    const updated = flattenRows(next)
    // Cập nhật tất cả bản ghi đăng ký bằng danh sách mới
    let hasError = false
    for (const clan of clans) {
      const res = await fetch(`/api/admin/registered-clans/${clan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants: updated }),
      })
      if (!res.ok) hasError = true
    }

    if (hasError) {
      toast.error('Không thể lưu thay đổi')
    } else {
      toast.success('Đã đổi người thành công!')
    }
  }

  const ranks = Object.keys(rowsByRank).sort((a, b) =>
    rankSortKey(a).localeCompare(rankSortKey(b)),
  )
  const total = Object.values(rowsByRank).reduce((sum, list) => sum + list.length, 0)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gold-400">Bảng ghép đấu</h1>
          <p className="mt-1 text-sm text-stone-400">
            Mỗi rank một bảng · xếp theo số cup giảm dần · kéo thả để đổi người giữa các bảng
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-md border border-stone-750 bg-stone-850 px-3 py-1.5 text-xs text-stone-400">
            <Users className="h-3.5 w-3.5" />
            {total} thành viên · {ranks.length} rank
          </span>
          <button
            onClick={() => load(true)}
            disabled={reloading}
            className="btn-gold flex items-center gap-2 rounded-md px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {reloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Tải lại
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-stone-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Đang tải dữ liệu...
        </div>
      ) : ranks.length === 0 ? (
        <div className="stone-card rounded-xl p-12 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-stone-600" />
          <p className="text-stone-400">Chưa có dữ liệu giải đấu</p>
          <p className="mt-1 text-sm text-stone-600">
            Vào menu Giải đấu ở góc trên bên phải để đăng ký
          </p>
        </div>
      ) : (
        /* Sơ đồ cây: Rank (cha) -> Bảng thành viên (con) */
        <div className="space-y-4">
          {ranks.map((rank) => {
            const list = rowsByRank[rank]
            return (
              <div key={rank} className="relative pl-4">
                {/* Đường nối cây */}
                <span className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-gold-700/60 via-stone-700 to-transparent" />

                {/* Nhánh rank */}
                <div className="relative flex items-center gap-2 pb-2">
                  <span className="absolute -left-4 top-1/2 h-px w-4 bg-gold-700/60" />
                  <Trophy className="h-4 w-4 text-gold-500" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-300">
                    {rank}
                  </h2>
                  <span className="rounded-full border border-stone-700 bg-stone-850 px-2 py-0.5 text-xs text-stone-500">
                    {list.length}
                  </span>
                </div>

                {/* Bảng thành viên - vùng drop */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(e) => handleDrop(e, rank)}
                  className={`stone-card overflow-hidden rounded-xl border ${rankColor(rank)} transition-colors ${
                    dragging ? 'ring-1 ring-gold-700/40' : ''
                  }`}
                >
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-750 text-xs uppercase tracking-wider text-stone-500">
                        <th className="w-8 px-3 py-2" />
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Thành viên</th>
                        <th className="hidden px-3 py-2 text-left sm:table-cell">Tag</th>
                        <th className="px-3 py-2 text-right">Trophies</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((p, i) => (
                        <tr
                          key={`${p.tag}-${i}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, rank, p)}
                          onDragEnd={() => setDragging(null)}
                          className="cursor-grab border-b border-stone-800/60 transition-colors last:border-0 hover:bg-stone-800/40 active:cursor-grabbing"
                        >
                          <td className="px-3 py-2 text-stone-600">
                            <GripVertical className="h-4 w-4" />
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-stone-500">
                            {i === 0 ? (
                              <span className="text-gold-400">🥇 1</span>
                            ) : i === 1 ? (
                              <span className="text-stone-300">🥈 {i + 1}</span>
                            ) : i === 2 ? (
                              <span className="text-amber-600">🥉 {i + 1}</span>
                            ) : (
                              i + 1
                            )}
                          </td>
                          <td className="px-3 py-2 font-medium text-stone-200">{p.name}</td>
                          <td className="hidden px-3 py-2 font-mono text-xs text-stone-500 sm:table-cell">
                            {p.tag}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className="inline-flex items-center gap-1 font-semibold text-gold-400">
                              <Trophy className="h-3 w-3" />
                              {p.trophies}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
