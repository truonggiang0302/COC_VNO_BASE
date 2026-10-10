import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

export async function POST(request: Request) {
  try {
    const { userId, role, name, password } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 })
    }

    // Xác thực người gọi API — chỉ admin / super_admin
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

    // Xác định role của user bị tác động (để giới hạn quyền)
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    if (targetProfile?.role === 'super_admin' && callerRole !== 'super_admin') {
      return NextResponse.json({ error: 'Không có quyền sửa tài khoản Super Admin' }, { status: 403 })
    }
    if (targetProfile?.role === 'admin' && callerRole !== 'super_admin' && role) {
      return NextResponse.json(
        { error: 'Chỉ Super Admin mới được đổi role của Admin' },
        { status: 403 },
      )
    }

    const updateData: Record<string, string> = {}

    if (role) {
      if (!['viewer', 'admin', 'super_admin'].includes(role)) {
        return NextResponse.json({ error: 'Role không hợp lệ' }, { status: 400 })
      }
      updateData.role = role
    }

    if (name !== undefined) {
      updateData.name = name.trim()
    }

    if (Object.keys(updateData).length === 0 && !password) {
      return NextResponse.json({ error: 'Không có dữ liệu để cập nhật' }, { status: 400 })
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    // Đặt lại mật khẩu (nếu có)
    if (password !== undefined && password !== null && password !== '') {
      if (typeof password !== 'string' || password.length < 6) {
        return NextResponse.json(
          { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
          { status: 400 },
        )
      }
      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
      })
      if (pwError) {
        return NextResponse.json({ error: pwError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update profile error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}