import { createClient as createServerSupabase } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    if (!email) {
      return NextResponse.json({ error: 'Thiếu email' }, { status: 400 })
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
      .select('id, tag, role, name')
      .eq('email', email)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 })
    }

    return NextResponse.json({
      id: profile.id,
      tag: profile.tag,
      role: profile.role,
      name: profile.name,
    })
  } catch (err) {
    console.error('Get profile by email error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
