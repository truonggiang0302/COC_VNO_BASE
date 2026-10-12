import { createClient as createServerSupabase } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { participants } = body
    if (!Array.isArray(participants)) {
      return NextResponse.json({ error: 'Danh sách thành viên không hợp lệ' }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('email', user.email)
      .single()
    if (!profile) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 })
    }

    const { data: row } = await supabase
      .from('registered_clans')
      .select('id, user_id')
      .eq('id', id)
      .single()
    if (!row) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi' }, { status: 404 })
    }

    // chỉ admin + self mới sửa
    if (profile.role !== 'super_admin' && profile.role !== 'admin' && row.user_id !== profile.id) {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
    }

    const { error } = await supabase
      .from('registered_clans')
      .update({ participants, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update registered clan error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
