import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, role, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Thiếu email hoặc mật khẩu' }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Thiếu tên hiển thị' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 })
    }

    // Dùng service_role key để tạo user (chỉ chạy ở server)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Tạo user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Cập nhật name + role
    if (authData.user) {
      const updateData: Record<string, string> = { name: name.trim() }
      if (role && role !== 'viewer') {
        updateData.role = role
      }
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', authData.user.id)

      if (profileError) {
        console.error('Failed to update profile:', profileError)
      }
    }

    return NextResponse.json({
      success: true,
      user: { id: authData.user?.id, email: authData.user?.email, name: name.trim() },
    })
  } catch (err) {
    console.error('Create user error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}