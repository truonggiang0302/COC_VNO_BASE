import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: 'Thiếu userId hoặc role' }, { status: 400 })
    }

    if (!['viewer', 'admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Role không hợp lệ' }, { status: 400 })
    }

    // Dùng service_role key để cập nhật (bỏ qua RLS)
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

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update role error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}