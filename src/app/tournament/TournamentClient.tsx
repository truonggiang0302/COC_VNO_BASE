'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle, GitMerge, RotateCcw, Swords, Target, Trophy, UserPlus } from 'lucide-react'

interface Entry {
  id: number
  user_id: string
  user_name: string
  created_at: string
}

interface Match {
  id: number
  round: number
  slot: number
  player1_id: string | null
  player1_name: string
  player2_id: string | null
  player2_name: string
  winner_id: string | null
  is_third_place: boolean
}

interface TournamentData {
  status: 'open' | 'running' | 'finished'
  entries: Entry[]
  matches: Match[]
  myUserId: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

type Side = 'p1' | 'p2'

export default function TournamentClient() {
  const [data, setData] = useState<TournamentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [swapMode, setSwapMode] = useState(false)
  const [swapSelection, setSwapSelection] = useState<{ matchId: number; side: Side } | null>(null)
  const [busy, setBusy] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)

  const isAdmin = data?.isAdmin ?? false
  const isSuperAdmin = data?.isSuperAdmin ?? false
  const status = data?.status ?? 'open'
  const myUserId = data?.myUserId ?? ''

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/tournament')
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Không tải được dữ liệu')
        return
      }
      setData(json)
    } catch {
      toast.error('Lỗi server')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleRegister = async () => {
    if (status !== 'open') return
    if (data?.entries.some((e) => e.user_id === myUserId)) {
      toast.error('Bạn đã đăng ký giải rồi')
      return
    }
    setRegistering(true)
    try {
      const res = await fetch('/api/tournament', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Đăng ký thất bại')
        return
      }
      toast.success('Đăng ký giải thành công! Vui lòng đợi hệ thống ghép đối thủ', {
        duration: 5000,
      })
      setShowRegisterModal(true)
      await load()
    } finally {
      setRegistering(false)
    }
  }

  const adminAction = async (action: string, extra?: Record<string, unknown>) => {
    setBusy(true)
    try {
      const res = await fetch('/api/tournament/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Thao tác thất bại')
        return null
      }
      return json
    } catch {
      toast.error('Lỗi server')
      return null
    } finally {
      setBusy(false)
    }
  }

  const handleSeed = async () => {
    const n = data?.entries.length ?? 0
    if (n < 4) {
      toast.error('Cần ít nhất 4 thành viên đăng ký để ghép trận')
      return
    }
    if (
      !window.confirm(
        `Ghép ${n} thành viên thành các cặp đấu ngẫu nhiên? Sau khi ghép sẽ không thể đăng ký thêm.`,
      )
    ) {
      return
    }
    const json = await adminAction('seed')
    if (json) {
      toast.success('Đã ghép đối thủ thành công!')
      await load()
    }
  }

  const handleSetWinner = async (matchId: number, winnerId: string) => {
    const json = await adminAction('set-winner', { matchId, winnerId })
    if (json) {
      toast.success('Đã cập nhật kết quả')
      await load()
    }
  }

  // Chọn 2 vị trí để đổi chỗ
  const handleSwapClick = async (matchId: number, side: Side) => {
    if (!swapSelection) {
      setSwapSelection({ matchId, side })
      return
    }
    const a = swapSelection
    setSwapSelection(null)
    if (a.matchId === matchId && a.side === side) return // bấm trùng → bỏ chọn
    const json = await adminAction('swap', {
      match1Id: a.matchId,
      side1: a.side,
      match2Id: matchId,
      side2: side,
    })
    if (json) {
      toast.success('Đã đổi chỗ 2 người chơi')
      await load()
    }
  }

  const handleReset = async () => {
    if (!window.confirm('Xóa toàn bộ dữ liệu giải (đăng ký + trận đấu) và mở lại đăng ký?')) return
    const json = await adminAction('reset')
    if (json) {
      setSwapMode(false)
      setSwapSelection(null)
      toast.success('Đã reset giải đấu')
      await load()
    }
  }

  /* ===== Suy diễn dữ liệu sơ đồ ===== */
  const rounds = useMemo(() => {
    const main = (data?.matches ?? []).filter((m) => !m.is_third_place)
    const maxRound = Math.max(0, ...main.map((m) => m.round))
    return Array.from({ length: maxRound }, (_, i) => i + 1)
  }, [data])

  const maxRound = rounds.length

  const roundLabel = (round: number) => {
    if (round === maxRound) return 'Chung kết'
    if (round === maxRound - 1) return 'Bán kết'
    return `Vòng ${round}`
  }

  const matchesOfRound = (round: number) =>
    (data?.matches ?? [])
      .filter((m) => m.round === round && !m.is_third_place)
      .sort((a, b) => a.slot - b.slot)

  const thirdPlaceMatch = useMemo(
    () => (data?.matches ?? []).find((m) => m.is_third_place) ?? null,
    [data],
  )

  // Đối thủ tiếp theo của tôi: trận chưa có kết quả mà tôi đang thi đấu
  const myNextMatch = useMemo(
    () =>
      (data?.matches ?? []).find(
        (m) => !m.winner_id && (m.player1_id === myUserId || m.player2_id === myUserId),
      ) ?? null,
    [data, myUserId],
  )
  const myNextOpponent = myNextMatch
    ? myNextMatch.player1_id === myUserId
      ? myNextMatch.player2_name
      : myNextMatch.player1_name
    : null

  // Tổng kết khi giải kết thúc
  const standings = useMemo(() => {
    if (!data || status !== 'finished') return null
    const main = data.matches.filter((m) => !m.is_third_place)
    const finalMatch = [...main].sort((a, b) => b.round - a.round)[0]
    if (!finalMatch?.winner_id) return null
    const champion =
      finalMatch.winner_id === finalMatch.player1_id
        ? finalMatch.player1_name
        : finalMatch.player2_name
    const runnerUp =
      finalMatch.winner_id === finalMatch.player1_id
        ? finalMatch.player2_name
        : finalMatch.player1_name

    const bronze = data.matches.find((m) => m.is_third_place)
    const third = bronze?.winner_id
      ? bronze.winner_id === bronze.player1_id
        ? bronze.player1_name
        : bronze.player2_name
      : null

    // Thứ tự bị loại: trận có kết quả (không bye), vòng lớn trước
    const eliminated = data.matches
      .filter((m) => !m.is_third_place && m.winner_id && m.player2_id)
      .sort((a, b) => b.round - a.round || a.slot - b.slot)
      .map((m) => ({
        name: m.winner_id === m.player1_id ? m.player2_name : m.player1_name,
        round: m.round,
      }))

    return { champion, runnerUp, third, eliminated }
  }, [data, status])

  /* ===== Card 1 trận đấu ===== */
  const renderMatchCard = (match: Match, isThird = false) => {
    const pending = !match.winner_id && !!match.player2_id
    const players = [
      { side: 'p1' as Side, id: match.player1_id, name: match.player1_name, isWinner: match.winner_id === match.player1_id },
      { side: 'p2' as Side, id: match.player2_id, name: match.player2_name, isWinner: match.winner_id === match.player2_id },
    ]

    return (
      <div
        key={match.id}
        className={`rounded-lg border p-3 shadow-lg shadow-black/30 ${
          isThird
            ? 'border-amber-700/60 bg-amber-950/20'
            : match.winner_id
              ? 'border-stone-700 bg-stone-900/60'
              : 'border-gold-800 bg-stone-900/80'
        }`}
      >
        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-stone-500">
          <span>{isThird ? 'Tranh hạng Ba' : `Trận ${match.round}.${match.slot}`}</span>
        </div>
        <div className="space-y-1.5">
          {players
            .filter((p) => p.id)
            .map((p) => (
            <div key={p.side} className="flex items-center justify-between gap-2">
              <button
                disabled={!isAdmin || !pending || busy || !swapMode}
                onClick={() => swapMode && handleSwapClick(match.id, p.side)}
                className={`flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-0.5 text-left text-sm ${
                  p.isWinner
                    ? 'font-bold text-gold-400'
                    : p.id
                      ? 'text-stone-300'
                      : 'italic text-stone-600'
                } ${
                  swapMode && isAdmin && pending
                    ? 'cursor-pointer hover:bg-stone-800 hover:text-gold-300'
                    : 'cursor-default'
                } ${
                  swapSelection?.matchId === match.id && swapSelection?.side === p.side
                    ? 'ring-1 ring-gold-500'
                    : ''
                }`}
              >
                {p.isWinner && <span>🏆</span>}
                <span className="truncate">{p.name || '(Chưa xác định)'}</span>
              </button>
              {isAdmin && pending && !swapMode && p.id && (
                <button
                  disabled={busy}
                  onClick={() => handleSetWinner(match.id, p.id!)}
                  title={`Chọn ${p.name} thắng`}
                  className="rounded border border-gold-800 px-1.5 py-0.5 text-xs text-gold-400 transition-colors hover:bg-gold-900/40 disabled:opacity-50"
                >
                  Thắng
                </button>
              )}
            </div>
          ))}
          {!match.player2_id && !match.winner_id && (
            <div className="text-xs italic text-stone-600">Đang chờ người chơi</div>
          )}
        </div>
      </div>
    )
  }

  /* ===== Render chính ===== */
  const statusText =
    status === 'open' ? 'Đang mở đăng ký' : status === 'running' ? 'Đang thi đấu' : 'Đã kết thúc'

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Tiêu đề */}
      <div className="mb-6 flex flex-col items-center text-center">
        <Swords className="mb-2 h-10 w-10 text-gold-400" />
        <h1 className="gold-shimmer text-3xl font-bold">Giải Đấu Clan</h1>
        <p className="mt-1 text-sm text-stone-400">
          Thể thức loại trực tiếp — Trận tranh hạng Ba riêng
        </p>
        <span
          className={`mt-3 rounded-full border px-3 py-1 text-xs font-semibold ${
            status === 'open'
              ? 'border-green-700 bg-green-950/40 text-green-400'
              : status === 'running'
                ? 'border-gold-700 bg-gold-950/40 text-gold-400'
                : 'border-stone-700 bg-stone-900 text-stone-400'
          }`}
        >
          {statusText}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Thông báo đối thủ tiếp theo của tôi */}
          {myNextOpponent && status === 'running' && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-gold-700 bg-gold-950/30 px-4 py-3 text-center shadow-lg shadow-black/30">
              <Target className="h-5 w-5 text-gold-400" />
              <p className="text-sm text-stone-200">
                <span className="font-bold text-gold-400">Đối thủ tiếp theo của bạn là:</span>{' '}
                <span className="font-semibold">{myNextOpponent}</span>
              </p>
            </div>
          )}

          {/* Khu vực đăng ký / Admin */}
          <div className="rounded-xl border border-stone-750 bg-stone-900/60 p-5 shadow-lg shadow-black/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-stone-200">
                  Thành viên đăng ký ({data?.entries.length ?? 0})
                </h2>
                {status === 'open' && (
                  <p className="mt-0.5 text-xs text-stone-500">
                    Cần ít nhất 4 thành viên để ghép trận. Số lẻ sẽ có người được miễn vòng đầu
                    (bye).
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {status === 'open' && (
                  <button
                    onClick={handleRegister}
                    disabled={registering || data?.entries.some((e) => e.user_id === myUserId)}
                    className="flex items-center gap-2 rounded-md bg-gradient-to-b from-gold-500 to-gold-600 px-4 py-2 text-sm font-bold text-stone-950 shadow-md shadow-black/40 transition-all hover:from-gold-400 hover:to-gold-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <UserPlus className="h-4 w-4" />
                    {data?.entries.some((e) => e.user_id === myUserId)
                      ? 'Bạn đã đăng ký'
                      : 'Đăng ký giải'}
                  </button>
                )}
                {isAdmin && status === 'open' && (
                  <button
                    onClick={handleSeed}
                    disabled={busy || (data?.entries.length ?? 0) < 4}
                    title={(data?.entries.length ?? 0) < 4 ? 'Cần ít nhất 4 thành viên' : ''}
                    className="flex items-center gap-2 rounded-md bg-gradient-to-b from-red-500 to-red-700 px-4 py-2 text-sm font-bold text-white shadow-md shadow-black/40 transition-all hover:from-red-400 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <GitMerge className="h-4 w-4" />
                    Ghép đối thủ
                  </button>
                )}
                {isAdmin && status === 'running' && (
                  <button
                    onClick={() => {
                      setSwapMode(!swapMode)
                      setSwapSelection(null)
                    }}
                    className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                      swapMode
                        ? 'border-gold-500 bg-gold-900/50 text-gold-300'
                        : 'border-stone-700 bg-stone-850 text-stone-300 hover:border-gold-700 hover:text-gold-400'
                    }`}
                  >
                    <GitMerge className="h-4 w-4" />
                    {swapMode ? 'Tắt chế độ đổi người' : 'Đổi người giữa các cặp'}
                  </button>
                )}
                {isSuperAdmin && (
                  <button
                    onClick={handleReset}
                    disabled={busy}
                    className="flex items-center gap-2 rounded-md border border-red-800 px-4 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-950/40 disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset giải
                  </button>
                )}
              </div>
            </div>

            {/* Danh sách người đăng ký */}
            {data && data.entries.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {data.entries.map((e) => (
                  <span
                    key={e.id}
                    className="rounded-full border border-stone-700 bg-stone-850 px-3 py-1 text-xs text-stone-300"
                  >
                    {e.user_name}
                    {e.user_id === myUserId && (
                      <span className="ml-1 font-semibold text-gold-400">(bạn)</span>
                    )}
                  </span>
                ))}
              </div>
            )}

            {swapMode && (
              <p className="mt-3 text-xs text-gold-400">
                💡 Chế độ đổi người: bấm chọn 2 người chơi (ở 2 trận chưa có kết quả) để đổi chỗ
                cho nhau.
              </p>
            )}
          </div>

          {/* Sơ đồ cây */}
          {status !== 'open' && (data?.matches.length ?? 0) > 0 ? (
            <div>
              <h2 className="mb-4 text-center text-lg font-bold text-stone-200">Sơ đồ thi đấu</h2>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {rounds.map((round) => (
                  <div key={round} className="flex min-w-[220px] flex-1 flex-col">
                    <h3 className="mb-3 text-center text-sm font-bold uppercase tracking-wider text-gold-500">
                      {roundLabel(round)}
                    </h3>
                    <div className="flex flex-1 flex-col justify-around gap-3">
                      {matchesOfRound(round).map((m) => renderMatchCard(m))}
                      {/* Tranh hạng Ba hiển thị cùng cột chung kết */}
                      {round === maxRound &&
                        thirdPlaceMatch &&
                        renderMatchCard(thirdPlaceMatch, true)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-stone-750 bg-stone-900/60 p-5 text-center text-sm text-stone-500 shadow-lg shadow-black/30">
              <Trophy className="mx-auto mb-2 h-8 w-8 text-gold-800" />
              {status === 'open'
                ? 'Sơ đồ thi đấu sẽ xuất hiện sau khi Admin bấm "Ghép đối thủ".'
                : 'Chưa có trận đấu nào.'}
            </div>
          )}

          {/* Tổng kết kết quả */}
          {standings && (
            <div className="rounded-xl border border-gold-800 bg-gold-950/20 p-5 shadow-lg shadow-black/30">
              <div className="mb-4 text-center">
                <Trophy className="mx-auto mb-2 h-10 w-10 text-gold-400" />
                <h2 className="gold-shimmer text-xl font-bold">Kết quả giải đấu</h2>
              </div>
              <div className="mx-auto max-w-md space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-gold-700 bg-gold-950/40 px-4 py-3">
                  <span className="text-lg">🥇</span>
                  <span className="font-bold text-gold-300">{standings.champion}</span>
                  <span className="text-xs uppercase text-stone-500">Vô địch</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-stone-700 bg-stone-900/60 px-4 py-3">
                  <span className="text-lg">🥈</span>
                  <span className="font-semibold text-stone-200">{standings.runnerUp}</span>
                  <span className="text-xs uppercase text-stone-500">Á quân</span>
                </div>
                {standings.third && (
                  <div className="flex items-center justify-between rounded-lg border border-amber-800 bg-amber-950/20 px-4 py-3">
                    <span className="text-lg">🥉</span>
                    <span className="font-semibold text-amber-300">{standings.third}</span>
                    <span className="text-xs uppercase text-stone-500">Hạng ba</span>
                  </div>
                )}
              </div>

              {standings.eliminated.length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Thứ tự bị loại
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {standings.eliminated.map((e, i) => (
                      <span
                        key={`${e.name}-${i}`}
                        className="rounded-full border border-stone-750 bg-stone-900 px-3 py-1 text-xs text-stone-400"
                      >
                        {e.name}{' '}
                        <span className="text-stone-600">
                          (thua vòng {e.round === maxRound ? 'chung kết' : e.round})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Popup thông báo đăng ký thành công */}
          {showRegisterModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
              onClick={() => setShowRegisterModal(false)}
            >
              <div
                className="w-full max-w-sm rounded-xl border border-gold-700 bg-stone-900 p-6 text-center shadow-2xl shadow-black/50"
                onClick={(e) => e.stopPropagation()}
              >
                <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-400" />
                <h3 className="mb-2 text-lg font-bold text-gold-300">Đăng ký thành công!</h3>
                <p className="mb-5 text-sm text-stone-300">
                  Bạn đã ghi danh vào giải đấu. Vui lòng đợi hệ thống ghép đối thủ — khi có đối thủ,
                  thông báo sẽ hiển thị tại trang này.
                </p>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="w-full rounded-md border border-gold-700 bg-gold-950/40 px-4 py-2 text-sm font-semibold text-gold-300 transition-colors hover:bg-gold-900/40"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
