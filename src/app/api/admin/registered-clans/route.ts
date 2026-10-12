import { createClient as createServerSupabase } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
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

    const { data: rows } = await supabase.from('registered_clans').select('*').order('updated_at', { ascending: false })
    const myRows = profile.role === 'super_admin' || profile.role === 'admin'
      ? rows
      : rows?.filter((r: any) => r.user_id === profile.id) ?? []

    return NextResponse.json({ clans: myRows ?? [] })
  } catch (err) {
    console.error('Get registered clans error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
