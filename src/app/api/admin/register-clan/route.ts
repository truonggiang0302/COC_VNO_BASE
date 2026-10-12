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
    const { tag } = await request.json()
    if (!tag || !tag.trim()) {
      return NextResponse.json({ error: 'Thiếu tag clan' }, { status: 400 })
    }
    const clanTag = tag.trim().startsWith('#') ? tag.trim() : '#' + tag.trim()

    // 1. Xác định user đang đăng nhập
    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('email', user.email)
      .single()
    if (!profile) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 })
    }

    // 2. Lấy cấu hình API được bật (endpoint GET clan members)
    const { data: configs } = await supabaseAdmin
      .from('api_configs')
      .select('id, name, base_url, api_key, enabled')
      .eq('enabled', true)
      .order('created_at')
      .limit(1)
      .single()
    if (!configs) {
      return NextResponse.json(
        { error: 'Chưa có cấu hình API nào được bật. Vào tab "Quản lý API" để thêm.' },
        { status: 400 },
      )
    }

    const url = `${configs.base_url}/v1/clans/${encodeURIComponent(clanTag)}/members`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${configs.api_key}`,
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      return NextResponse.json(
        { error: `Gọi API thất bại (${res.status}): ${body?.error || 'unknown'}` },
        { status: 400 },
      )
    }

    const members = await res.json()
    if (!Array.isArray(members)) {
      return NextResponse.json({ error: 'Dữ liệu API không hợp lệ' }, { status: 400 })
    }

    const participants = members
      .map((m: any) => {
        const rank = m.leagueTier?.name ?? 'Unranked'
        return {
          tag: m.tag,
          name: m.name,
          rank,
          trophies: m.trophies ?? 0,
        }
      })
      .filter((m: any) => m.tag) // bỏ member không có tag

    // 3. Lưu kết quả đăng ký
    const { error } = await supabaseAdmin
      .from('registered_clans')
      .insert({
        user_id: profile.id,
        clan_tag: clanTag,
        clan_name: participants.length ? participants[0].name : '',
        participants,
      })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      clan_tag: clanTag,
      participant_count: participants.length,
      participants,
    })
  } catch (err) {
    console.error('Register clan error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
