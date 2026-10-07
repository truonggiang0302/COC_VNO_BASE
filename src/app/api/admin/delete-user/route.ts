import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// POST – Xóa tài khoản user (auth.users + profile, cascade lucky_picks / tournament_entries)
export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 })
    }

    // Xác thực người gọi API
    const supabase = await createServerSupabase()
    const {
      data: { user: caller },
    } = await supabase.auth.getUser()
    if (!caller) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()
    const callerRole = callerProfile?.role
    if (callerRole !== 'admin' && callerRole !== 'super_admin') {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
    }

    if (caller.id === userId) {
      return NextResponse.json({ error: 'Không thể xóa chính mình' }, { status: 400 })
    }

    // Xác định role của user bị xóa
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (targetProfile?.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Không thể xóa tài khoản Super Admin' },
        { status: 403 },
      )
    }
    if (targetProfile?.role === 'admin' && callerRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Chỉ Super Admin mới được xóa tài khoản Admin' },
        { status: 403 },
      )
    }

    // Xóa profile trước (tránh ràng buộc FK nếu có), sau đó xóa auth user
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete user error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
