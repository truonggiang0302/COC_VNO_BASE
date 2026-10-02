'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Dices, Lock, RotateCcw, Save, Search, Unlock, Trash2, Trophy, X } from 'lucide-react'

interface Pick {
  user_id: string
  user_name: string
  number: number
  created_at?: string
}

interface Winner extends Pick {
  distance: number
}

interface LuckyData {
  month: string
  isClosed: boolean
  winningNumber: number | null
  picks: Pick[]
}

const MAX_PICKS = 5

export default function LuckyNumberClient() {
  const [data, setData] = useState<LuckyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number[]>([]) // số đang chọn trên lưới (chưa lưu)
  const [savedNumbers, setSavedNumbers] = useState<number[]>([]) // số đã lưu của tôi
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [myUserName, setMyUserName] = useState('')
  const [userRole, setUserRole] = useState<'viewer' | 'admin' | 'super_admin'>('viewer')
  const [saving, setSaving] = useState(false)
  const [winningInput, setWinningInput] = useState('')
  const [winners, setWinners] = useState<Winner[] | null>(null)
  const [lastWinningNumber, setLastWinningNumber] = useState<number | null>(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)

  const isAdmin = userRole === 'admin' || userRole === 'super_admin'
  const isSuperAdmin = userRole === 'super_admin'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const luckyRes = await fetch('/api/lucky')
      const lucky = await luckyRes.json()
      setData(lucky)

      // Lấy user hiện tại từ supabase client-side
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setMyUserId(user.id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, role')
          .eq('id', user.id)
          .single()
        if (profile) {
          setMyUserName(profile.name || user.email || '')
          setUserRole(profile.role)
        }
        const mine = (lucky.picks as Pick[])
          .filter((p) => p.user_id === user.id)
          .map((p) => p.number)
        setSavedNumbers(mine)
        setSelected(mine)
      }
      if (lucky.winningNumber) setLastWinningNumber(lucky.winningNumber)
    } catch {
      toast.error('Không tải được dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const takenMap = useMemo(() => {
    const map = new Map<number, string>()
    data?.picks.forEach((p) => {
      if (p.user_id !== myUserId) map.set(p.number, p.user_name)
    })
    return map
  }, [data, myUserId])

  const closed = data?.isClosed ?? false

  const toggleNumber = (n: number) => {
    if (closed) return
    if (takenMap.has(n)) return
    setSelected((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : prev.length >= MAX_PICKS ? prev : [...prev, n],
    )
  }

  const handleSave = async () => {
    if (closed) {
      toast.error('Đã đóng đăng ký')
      return
    }
    if (selected.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 số')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/lucky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers: selected }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Lưu thất bại')
        await load() // refresh lại trạng thái mới nhất
        return
      }
      toast.success(`Bạn đã lựa chọn các số: ${json.numbers.join(', ')}`)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const adminAction = async (action: string, extra?: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/lucky/admin', {
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
    }
  }

  const handleFindWinners = async () => {
    const num = Number(winningInput)
    if (!Number.isInteger(num) || num < 1 || num > 99) {
      toast.error('Nhập số may mắn từ 1 đến 99')
      return
    }
    const json = await adminAction('winning', { winningNumber: num })
    if (json) {
      setWinners(json.winners)
      setLastWinningNumber(json.winningNumber)
      setShowWinnerModal(true)
      setWinningInput('')
      await load()
    }
  }

  const handleToggleClosed = async () => {
    const action = closed ? 'open' : 'close'
    const json = await adminAction(action)
    if (json) {
      toast.success(closed ? 'Đã mở lại đăng ký' : 'Đã đóng đăng ký')
      if (closed) {
        setLastWinningNumber(null)
        setWinners(null)
      }
      await load()
    }
  }

  const handleReset = async () => {
    if (!confirm('Xóa TOÀN BỘ dữ liệu chọn số của tháng này? Thao tác không thể hoàn tác!')) return
    const json = await adminAction('reset')
    if (json) {
      toast.success('Đã xóa dữ liệu, bắt đầu lại từ đầu')
      await load()
    }
  }

  // Gom picks theo thành viên
  const byUser = useMemo(() => {
    const map = new Map<string, { name: string; numbers: number[] }>()
    data?.picks.forEach((p) => {
      const entry = map.get(p.user_id)
      if (entry) entry.numbers.push(p.number)
      else map.set(p.user_id, { name: p.user_name, numbers: [p.number] })
    })
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [data])

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="gold-shimmer flex items-center justify-center gap-2 text-3xl font-bold">
          <Dices className="h-8 w-8 text-gold-400" />
          Đăng ký số may mắn CWL
        </h1>
        <p className="mt-2 text-sm text-stone-400">
          Chọn tối đa <span className="text-gold-400">5 số</span> (1–99). Hai thành viên có số sát
          nhất với con số may mắn sẽ trúng giải!
          {data && (
            <span className="ml-2 text-stone-500">
              (Tháng <span className="font-mono">{data.month}</span>)
            </span>
          )}
        </p>
        {closed && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-800 bg-red-950/50 px-4 py-1.5 text-sm text-red-400">
            <Lock className="h-4 w-4" />
            {lastWinningNumber
              ? `Đã kết thúc — số may mắn: ${lastWinningNumber}`
              : 'Đã đóng đăng ký'}
          </div>
        )}
      </div>

      {loading ? (
        <div className="mx-auto grid max-w-xl grid-cols-10 gap-2">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-md bg-stone-800" />
          ))}
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Lưới chọn số */}
          <section className="lg:col-span-3">
            <div className="rounded-xl border border-stone-750 bg-stone-900/60 p-5 shadow-lg shadow-black/30">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gold-400">
                <Dices className="h-5 w-5" />
                Bảng chọn số
                <span className="ml-auto text-xs font-normal text-stone-500">
                  Đã chọn {selected.length}/{MAX_PICKS}
                </span>
              </h2>
              <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                {Array.from({ length: 99 }, (_, i) => i + 1).map((n) => {
                  const takenBy = takenMap.get(n)
                  const isMine = savedNumbers.includes(n)
                  const isSelected = selected.includes(n)
                  const disabled = closed || !!takenBy
                  return (
                    <button
                      key={n}
                      disabled={disabled}
                      onClick={() => toggleNumber(n)}
                      title={takenBy ? `Đã chọn bởi ${takenBy}` : undefined}
                      className={
                        'relative flex aspect-square items-center justify-center rounded-md text-sm font-semibold transition-all ' +
                        (isSelected
                          ? 'bg-gold-600 text-stone-950 shadow-md shadow-gold-600/30 hover:bg-gold-500'
                          : isMine
                            ? 'border border-gold-800 bg-gold-950 text-gold-400 hover:bg-gold-900'
                            : takenBy || closed
                              ? 'cursor-not-allowed border border-stone-800 bg-stone-850 text-stone-600'
                              : 'border border-stone-700 bg-stone-800 text-stone-300 hover:border-gold-700 hover:bg-stone-750 hover:text-gold-400')
                      }
                    >
                      {n}
                      {takenBy && (
                        <span className="pointer-events-none absolute inset-x-0 bottom-0.5 truncate px-0.5 text-[7px] font-normal leading-none text-stone-500">
                          {takenBy}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2 text-xs text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-gold-600" /> đang chọn
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm border border-gold-800 bg-gold-950" /> của tôi
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm border border-stone-800 bg-stone-850" /> của người khác
                  </span>
                </div>
                <div className="flex gap-2">
                  {!closed && (
                    <button
                      onClick={() => setSelected(savedNumbers)}
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-md border border-stone-700 px-3 py-2 text-sm text-stone-400 transition-colors hover:border-gold-700 hover:text-gold-400"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Đặt lại
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving || closed || selected.length === 0}
                    className="flex items-center gap-1.5 rounded-md bg-gold-600 px-4 py-2 text-sm font-semibold text-stone-950 transition-colors hover:bg-gold-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Đang lưu...' : 'Xác nhận'}
                  </button>
                </div>
              </div>
            </div>

            {/* Bảng tổng hợp */}
            <div className="mt-6 overflow-hidden rounded-xl border border-stone-750 bg-stone-900/60 shadow-lg shadow-black/30">
              <h2 className="flex items-center gap-2 border-b border-stone-750 px-5 py-3 text-lg font-semibold text-gold-400">
                <Trophy className="h-5 w-5" />
                Bảng tổng hợp ({byUser.length} thành viên)
              </h2>
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-stone-900 text-left text-xs uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="px-5 py-2.5">Thành viên</th>
                      <th className="px-5 py-2.5">Số đã chọn</th>
                      <th className="px-5 py-2.5 text-right">Số lượng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {byUser.map((u) => (
                      <tr key={u.name} className={u.name === myUserName ? 'bg-gold-950/20' : ''}>
                        <td className="px-5 py-2.5 font-medium text-stone-300">{u.name}</td>
                        <td className="px-5 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {u.numbers
                              .sort((a, b) => a - b)
                              .map((n) => (
                                <span
                                  key={n}
                                  className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-xs text-gold-400"
                                >
                                  {n}
                                </span>
                              ))}
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-right text-stone-500">{u.numbers.length}/5</td>
                      </tr>
                    ))}
                    {byUser.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-5 py-8 text-center text-stone-500">
                          Chưa có ai chọn số
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Panel admin */}
          <section className="lg:col-span-2">
            {isAdmin ? (
              <div className="rounded-xl border border-stone-750 bg-stone-900/60 p-5 shadow-lg shadow-black/30">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gold-400">
                  <Search className="h-5 w-5" />
                  Quản trị Event
                </h2>

                {/* Nhập số may mắn */}
                <label className="mb-1.5 block text-sm text-stone-400">
                  Con số may mắn (từ kết quả ngoài)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={winningInput}
                    onChange={(e) => setWinningInput(e.target.value)}
                    placeholder="VD: 50"
                    className="w-28 rounded-md border border-stone-700 bg-stone-850 px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-gold-700 focus:outline-none"
                  />
                  <button
                    onClick={handleFindWinners}
                    className="flex items-center gap-1.5 rounded-md bg-gold-600 px-4 py-2 text-sm font-semibold text-stone-950 transition-colors hover:bg-gold-500"
                  >
                    <Search className="h-4 w-4" />
                    Tìm thành viên may mắn
                  </button>
                </div>

                {/* Kết quả hiện tại (nếu có) */}
                {lastWinningNumber && (
                  <div className="mt-4 rounded-lg border border-gold-800 bg-gold-950/30 p-4">
                    <div className="flex items-center gap-2 text-sm text-gold-400">
                      <Trophy className="h-4 w-4" />
                      Kết quả: số may mắn{' '}
                      <span className="font-mono font-bold">{lastWinningNumber}</span>
                    </div>
                  </div>
                )}

                {/* Đóng/mở đăng ký */}
                <div className="mt-6 border-t border-stone-750 pt-4">
                  <button
                    onClick={handleToggleClosed}
                    className={
                      'flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ' +
                      (closed
                        ? 'bg-green-900/60 text-green-300 hover:bg-green-900'
                        : 'bg-red-900/60 text-red-300 hover:bg-red-900')
                    }
                  >
                    {closed ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    {closed ? 'Mở lại đăng ký' : 'Đóng đăng ký'}
                  </button>
                  <p className="mt-2 text-xs text-stone-500">
                    Sau khi đóng, thành viên chỉ xem được, không chọn/sửa số được nữa.
                  </p>
                </div>

                {/* Reset (super_admin) */}
                {isSuperAdmin && (
                  <div className="mt-4 border-t border-stone-750 pt-4">
                    <button
                      onClick={handleReset}
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-red-900 bg-red-950/40 px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-900/50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa dữ liệu tháng này
                    </button>
                    <p className="mt-2 text-xs text-stone-500">
                      Xóa toàn bộ lượt chọn + trạng thái của tháng {data?.month}. Bắt đầu lại từ đầu.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-stone-750 bg-stone-900/60 p-5 text-center text-sm text-stone-500 shadow-lg shadow-black/30">
                <Trophy className="mx-auto mb-2 h-8 w-8 text-gold-800" />
                Kết quả sẽ được công bố sau khi Admin tổng kết giải CWL. Chúc bạn may mắn!
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modal người trúng giải */}
      {showWinnerModal && winners && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowWinnerModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-xl border border-gold-800 bg-stone-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowWinnerModal(false)}
              className="absolute right-3 top-3 text-stone-500 hover:text-stone-300"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-4 text-center">
              <Trophy className="mx-auto mb-2 h-12 w-12 text-gold-400" />
              <h3 className="gold-shimmer text-2xl font-bold">Chúc mừng người trúng giải!</h3>
              <p className="mt-1 text-sm text-stone-400">
                Số may mắn:{' '}
                <span className="font-mono text-lg font-bold text-gold-400">
                  {lastWinningNumber}
                </span>
              </p>
            </div>
            <div className="space-y-2">
              {winners.map((w, i) => (
                <div
                  key={`${w.user_id}-${w.number}`}
                  className="flex items-center justify-between rounded-lg border border-gold-800 bg-gold-950/30 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-600 text-sm font-bold text-stone-950">
                      {i + 1}
                    </span>
                    <span className="font-medium text-stone-200">{w.user_name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-gold-400">{w.number}</div>
                    <div className="text-xs text-stone-500">cách {w.distance} số</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
