import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

interface WinnerPick {
  user_id: string
  user_name: string
  number: number
}

interface RoundResult {
  winningNumber: number
  winners: Array<WinnerPick & { distance: number }>
  remaining: WinnerPick[]
}

/**
 * Vòng quét 1 số:
 * - Tính khoảng cách nhỏ nhất từ mỗi user đến winningNumber (mỗi user có nhiều số)
 * - Lấy những user có khoảng cách nhỏ nhất (hoà lấy tất cả)
 * - Loại các user đó khỏi danh sách picks còn lại
 */
function scanRound(picks: WinnerPick[], winningNumber: number): RoundResult {
  // Tìm số gần nhất của mỗi user với winningNumber
  const bestByUser = new Map<string, WinnerPick & { distance: number }>()
  picks.forEach((p) => {
    const distance = Math.abs(p.number - winningNumber)
    const existing = bestByUser.get(p.user_id)
    if (!existing || distance < existing.distance) {
      bestByUser.set(p.user_id, { ...p, distance })
    }
  })

  const users = Array.from(bestByUser.values())
  if (users.length === 0) {
    return { winningNumber, winners: [], remaining: picks }
  }

  const minDistance = Math.min(...users.map((u) => u.distance))
  const winners = users.filter((u) => u.distance === minDistance).sort((a, b) => a.number - b.number)
  const winnerIds = new Set(winners.map((w) => w.user_id))
  const remaining = picks.filter((p) => !winnerIds.has(p.user_id))

  return { winningNumber, winners, remaining }
}

/** Tháng hiện tại theo UTC, dạng 'YYYY-MM' */
function currentMonth(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

// POST – Các hành động admin: close / open / winning / reset
export async function POST(request: Request) {
  try {
    // Xác thực + phân quyền
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role
    const isSuperAdmin = role === 'super_admin'
    const isAdmin = role === 'admin' || isSuperAdmin
    if (!isAdmin) {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
    }

    const { action, winningNumber, winningNumber2, winnerSlots } = await request.json()
    const month = currentMonth()

    // Validate số suất trúng (dùng chung cho set-slots và winning)
    let slots = 2
    if (winnerSlots !== undefined) {
      slots = Number(winnerSlots)
      if (!Number.isInteger(slots) || slots < 1 || slots > 99) {
        return NextResponse.json(
          { error: 'Số người trúng giải phải là số nguyên từ 1 đến 99' },
          { status: 400 },
        )
      }
    }

    switch (action) {
      // Lưu cấu hình số suất trúng giải
      case 'set-slots': {
        const { error } = await supabaseAdmin
          .from('lucky_state')
          .upsert({ month, winner_slots: slots })
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ success: true, winnerSlots: slots })
      }
      // Đóng đăng ký
      case 'close': {
        const { error } = await supabaseAdmin
          .from('lucky_state')
          .upsert({ month, is_closed: true, closed_at: new Date().toISOString() })
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ success: true })
      }

      // Mở lại đăng ký (xóa kết quả nếu có)
      case 'open': {
        const { error } = await supabaseAdmin
          .from('lucky_state')
          .upsert({ month, is_closed: false, winning_number: null, winning_number_2: null })
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ success: true })
      }

      // Nhập 2 số may mắn + tìm người trúng từng lượt
      case 'winning': {
        const num1 = Number(winningNumber)
        const num2 = Number(winningNumber2)
        if (!Number.isInteger(num1) || num1 < 1 || num1 > 99) {
          return NextResponse.json(
            { error: 'Số may mắn 1 phải là số nguyên từ 1 đến 99' },
            { status: 400 },
          )
        }
        if (!Number.isInteger(num2) || num2 < 1 || num2 > 99) {
          return NextResponse.json(
            { error: 'Số may mắn 2 phải là số nguyên từ 1 đến 99' },
            { status: 400 },
          )
        }

        const { data: picks, error: picksError } = await supabaseAdmin
          .from('lucky_picks')
          .select('user_id, user_name, number')
          .eq('month', month)
        if (picksError) return NextResponse.json({ error: picksError.message }, { status: 400 })
        if (!picks || picks.length < 2) {
          return NextResponse.json(
            { error: 'Cần ít nhất 2 thành viên đã chọn số để tìm người trúng giải' },
            { status: 400 },
          )
        }

        // Vòng 1: quét số 1
        const round1 = scanRound(picks, num1)
        // Vòng 2: quét số 2 với người còn lại (loại người đã trúng vòng 1)
        const round2 = scanRound(round1.remaining, num2)

        const { error } = await supabaseAdmin
          .from('lucky_state')
          .upsert({
            month,
            is_closed: true,
            winning_number: num1,
            winning_number_2: num2,
            winner_slots: slots,
            closed_at: new Date().toISOString(),
          })
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })

        return NextResponse.json({
          success: true,
          round1,
          round2,
          winnerSlots: slots,
        })
      }

      // Xóa toàn bộ dữ liệu tháng (chỉ super_admin)
      case 'reset': {
        if (!isSuperAdmin) {
          return NextResponse.json(
            { error: 'Chỉ Super Admin mới được xóa dữ liệu' },
            { status: 403 },
          )
        }
        const [delPicks, delState] = await Promise.all([
          supabaseAdmin.from('lucky_picks').delete().eq('month', month),
          supabaseAdmin.from('lucky_state').delete().eq('month', month),
        ])
        if (delPicks.error) return NextResponse.json({ error: delPicks.error.message }, { status: 400 })
        if (delState.error) return NextResponse.json({ error: delState.error.message }, { status: 400 })
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 })
    }
  } catch (err) {
    console.error('POST lucky/admin error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
