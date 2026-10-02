import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

/** Tháng hiện tại theo UTC, dạng 'YYYY-MM' */
function currentMonth(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

// GET – Trạng thái + toàn bộ picks của tháng hiện tại
export async function GET() {
  try {
    const month = currentMonth()

    const [picksRes, stateRes] = await Promise.all([
      supabaseAdmin
        .from('lucky_picks')
        .select('user_id, user_name, number, created_at')
        .eq('month', month)
        .order('number', { ascending: true }),
      supabaseAdmin
        .from('lucky_state')
        .select('*')
        .eq('month', month)
        .maybeSingle(),
    ])

    if (picksRes.error) {
      return NextResponse.json({ error: picksRes.error.message }, { status: 400 })
    }
    if (stateRes.error) {
      return NextResponse.json({ error: stateRes.error.message }, { status: 400 })
    }

    return NextResponse.json({
      month,
      isClosed: stateRes.data?.is_closed ?? false,
      winningNumber: stateRes.data?.winning_number ?? null,
      picks: picksRes.data ?? [],
    })
  } catch (err) {
    console.error('GET lucky error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

// POST – Lưu danh sách số của user hiện tại (thay thế toàn bộ picks cũ của user trong tháng)
export async function POST(request: Request) {
  try {
    // Xác thực user qua cookie
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const { numbers } = await request.json()

    if (!Array.isArray(numbers) || numbers.length === 0) {
      return NextResponse.json({ error: 'Vui lòng chọn ít nhất 1 số' }, { status: 400 })
    }
    if (numbers.length > 5) {
      return NextResponse.json({ error: 'Chỉ được chọn tối đa 5 số' }, { status: 400 })
    }
    const valid = numbers.every(
      (n) => Number.isInteger(n) && n >= 1 && n <= 99,
    )
    if (!valid) {
      return NextResponse.json({ error: 'Số phải là số nguyên từ 1 đến 99' }, { status: 400 })
    }
    if (new Set(numbers).size !== numbers.length) {
      return NextResponse.json({ error: 'Bạn không thể chọn trùng số' }, { status: 400 })
    }

    const month = currentMonth()

    // Kiểm tra trạng thái đóng đăng ký
    const { data: state } = await supabaseAdmin
      .from('lucky_state')
      .select('is_closed')
      .eq('month', month)
      .maybeSingle()
    if (state?.is_closed) {
      return NextResponse.json(
        { error: 'Đã đóng đăng ký, không thể chọn/sửa số' },
        { status: 403 },
      )
    }

    // Lấy tên hiển thị
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()
    const userName = profile?.name || user.email || 'Thành viên'

    // Check trùng với người khác trước khi insert
    const { data: taken } = await supabaseAdmin
      .from('lucky_picks')
      .select('number, user_name')
      .eq('month', month)
      .in('number', numbers)
      .neq('user_id', user.id)
    if (taken && taken.length > 0) {
      return NextResponse.json(
        {
          error: `Số ${taken.map((t) => t.number).join(', ')} đã có người chọn. Vui lòng chọn số khác.`,
        },
        { status: 409 },
      )
    }

    // Thay thế toàn bộ picks cũ của user trong tháng
    const { error: delError } = await supabaseAdmin
      .from('lucky_picks')
      .delete()
      .eq('user_id', user.id)
      .eq('month', month)
    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 400 })
    }

    const { error: insError } = await supabaseAdmin.from('lucky_picks').insert(
      numbers.map((n: number) => ({
        user_id: user.id,
        user_name: userName,
        number: n,
        month,
      })),
    )
    if (insError) {
      // Trả picks cũ không thể khôi phục — hiếm khi xảy ra do đã check trước
      return NextResponse.json(
        { error: `Lưu thất bại: ${insError.message}. Vui lòng thử lại.` },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: true, numbers: numbers.sort((a: number, b: number) => a - b) })
  } catch (err) {
    console.error('POST lucky error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
