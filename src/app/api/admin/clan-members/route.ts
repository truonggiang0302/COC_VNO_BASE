import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// GET – Lấy danh sách clan members (public)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('clan_members')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('GET clan-members error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

// POST – Thêm clan member mới (admin / super_admin)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, role, image_url, display_order } = body

    if (!name?.trim() || !role || !image_url) {
      return NextResponse.json({ error: 'Thiếu tên, chức vụ hoặc ảnh' }, { status: 400 })
    }

    if (!['leader', 'co_leader', 'elder', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Chức vụ không hợp lệ' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('clan_members')
      .insert({
        name: name.trim(),
        role,
        image_url,
        display_order: display_order ?? 0,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('POST clan-members error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

// PUT – Cập nhật clan member
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, role, image_url, display_order } = body

    if (!id) {
      return NextResponse.json({ error: 'Thiếu id' }, { status: 400 })
    }

    const updateData: Record<string, string | number> = {}

    if (name !== undefined) updateData.name = name.trim()
    if (role !== undefined) {
      if (!['leader', 'co_leader', 'elder', 'member'].includes(role)) {
        return NextResponse.json({ error: 'Chức vụ không hợp lệ' }, { status: 400 })
      }
      updateData.role = role
    }
    if (image_url !== undefined) updateData.image_url = image_url
    if (display_order !== undefined) updateData.display_order = display_order

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Không có dữ liệu cập nhật' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('clan_members')
      .update(updateData)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PUT clan-members error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

// DELETE – Xóa clan member
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Thiếu id' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('clan_members')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE clan-members error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}