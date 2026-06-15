import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId, role, name } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 })
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

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Không có dữ liệu để cập nhật' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update profile error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}