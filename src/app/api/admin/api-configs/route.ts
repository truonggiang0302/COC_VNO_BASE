import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('api_configs')
      .select('id, name, base_url, api_key, enabled, created_at')
      .order('created_at')
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ configs: data ?? [] })
  } catch (err) {
    console.error('Get api configs error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, base_url, api_key, enabled = true } = await request.json()
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Thiếu tên' }, { status: 400 })
    }
    if (!base_url || !base_url.trim()) {
      return NextResponse.json({ error: 'Thiếu base URL' }, { status: 400 })
    }
    if (!api_key || !api_key.trim()) {
      return NextResponse.json({ error: 'Thiếu api key' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('api_configs')
      .insert({ name: name.trim(), base_url: base_url.trim(), api_key: api_key.trim(), enabled })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Create api config error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
