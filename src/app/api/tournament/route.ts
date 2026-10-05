import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// GET – Danh sách đăng ký + toàn bộ trận đấu + trạng thái giải
export async function GET() {
  try {
    // Xác thực
    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    // Đảm bảo có dòng trạng thái (khởi tạo lần đầu)
    const { error: stateInitError } = await supabaseAdmin
      .from('tournament_state')
      .upsert({ id: 1 })
    if (stateInitError) {
      return NextResponse.json({ error: stateInitError.message }, { status: 400 })
    }

    const [entriesRes, matchesRes, stateRes, profileRes] = await Promise.all([
      supabaseAdmin
        .from('tournament_entries')
        .select('*')
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('tournament_matches')
        .select('*')
        .order('round', { ascending: true })
        .order('slot', { ascending: true }),
      supabaseAdmin.from('tournament_state').select('*').eq('id', 1).single(),
      supabaseAdmin.from('profiles').select('role').eq('id', user.id).single(),
    ])

    if (entriesRes.error) {
      return NextResponse.json({ error: entriesRes.error.message }, { status: 400 })
    }
    if (matchesRes.error) {
      return NextResponse.json({ error: matchesRes.error.message }, { status: 400 })
    }
    if (stateRes.error) {
      return NextResponse.json({ error: stateRes.error.message }, { status: 400 })
    }

    const role = profileRes.data?.role
    return NextResponse.json({
      status: stateRes.data?.status ?? 'open',
      entries: entriesRes.data ?? [],
      matches: matchesRes.data ?? [],
      myUserId: user.id,
      isAdmin: role === 'admin' || role === 'super_admin',
      isSuperAdmin: role === 'super_admin',
    })
  } catch (err) {
    console.error('GET tournament error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

// POST – Đăng ký giải (user)
export async function POST() {
  try {
    // Xác thực
    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    // Đảm bảo có dòng trạng thái + kiểm tra đang mở đăng ký
    const { error: stateInitError } = await supabaseAdmin
      .from('tournament_state')
      .upsert({ id: 1 })
    if (stateInitError) {
      return NextResponse.json({ error: stateInitError.message }, { status: 400 })
    }

    const { data: state } = await supabaseAdmin
      .from('tournament_state')
      .select('status')
      .eq('id', 1)
      .single()
    if (state?.status !== 'open') {
      return NextResponse.json(
        { error: 'Giải đấu không còn mở đăng ký' },
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

    const { error } = await supabaseAdmin.from('tournament_entries').upsert(
      { user_id: user.id, user_name: userName },
      { onConflict: 'user_id' },
    )
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST tournament error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
