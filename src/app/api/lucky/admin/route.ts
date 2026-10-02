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

/**
 * Tìm người trúng giải:
 * - 2 người có khoảng cách nhỏ nhất với số may mắn
 * - Nếu hòa khoảng cách thì tất cả người hòa cùng trúng (có thể >2)
 */
function findWinners(picks: WinnerPick[], winningNumber: number) {
  const distances = [...new Set(picks.map((p) => Math.abs(p.number - winningNumber)))].sort(
    (a, b) => a - b,
  )
  const topDistances = distances.slice(0, 2) // 2 khoảng cách nhỏ nhất (trùng nhau chỉ tính 1)
  const winners = picks
    .filter((p) => topDistances.includes(Math.abs(p.number - winningNumber)))
    .sort((a, b) => Math.abs(a.number - winningNumber) - Math.abs(b.number - winningNumber))
  return { winners, topDistances }
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

    const { action, winningNumber } = await request.json()
    const month = currentMonth()

    switch (action) {
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
          .upsert({ month, is_closed: false, winning_number: null })
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ success: true })
      }

      // Nhập số may mắn + tìm người trúng
      case 'winning': {
        const num = Number(winningNumber)
        if (!Number.isInteger(num) || num < 1 || num > 99) {
          return NextResponse.json(
            { error: 'Số may mắn phải là số nguyên từ 1 đến 99' },
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

        const { winners, topDistances } = findWinners(picks, num)

        const { error } = await supabaseAdmin
          .from('lucky_state')
          .upsert({ month, is_closed: true, winning_number: num, closed_at: new Date().toISOString() })
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })

        return NextResponse.json({ success: true, winners, topDistances, winningNumber: num })
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
