import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

interface Player {
  id: string
  name: string
}

interface MatchRow {
  id: number
  round: number
  slot: number
  player1_id: string | null
  player1_name: string
  player2_id: string | null
  player2_name: string
  winner_id: string | null
  is_third_place: boolean
}

/** Trộn ngẫu nhiên mảng (Fisher–Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Ghép danh sách người chơi thành các trận của 1 vòng (số lẻ → người cuối được bye) */
function pairRound(players: Player[]) {
  const matches: { p1: Player; p2: Player | null }[] = []
  for (let i = 0; i < players.length; i += 2) {
    matches.push({ p1: players[i], p2: players[i + 1] ?? null })
  }
  return matches
}

/**
 * Nếu vòng hiện tại đã đủ kết quả → tạo vòng tiếp theo.
 * - Vòng còn >2 trận: ghép các winner theo thứ tự slot (thừa 1 người → bye)
 * - Vòng còn đúng 2 trận (bán kết): tạo trận Chung kết + trận tranh hạng Ba
 * - Trận chung kết vừa có kết quả: chuyển giải sang 'finished'
 */
async function advanceRound(round: number) {
  const { data: roundMatches } = await supabaseAdmin
    .from('tournament_matches')
    .select('*')
    .eq('round', round)
    .eq('is_third_place', false)
    .order('slot', { ascending: true })
  const rows = (roundMatches ?? []) as MatchRow[]
  if (rows.length === 0 || rows.some((m) => !m.winner_id)) {
    return // chưa đủ kết quả
  }

  const winners: Player[] = rows.map((m) => ({
    id: m.winner_id!,
    name: m.winner_id === m.player1_id ? m.player1_name : m.player2_name,
  }))

  // Vòng này là CHUNG KẾT → giải kết thúc
  if (rows.length === 1) {
    await supabaseAdmin
      .from('tournament_state')
      .update({ status: 'finished', updated_at: new Date().toISOString() })
      .eq('id', 1)
    return
  }

  const nextRound = round + 1

  // Vòng này là BÁN KẾT (2 trận) → tạo Chung kết + trận tranh hạng Ba
  if (rows.length === 2) {
    const losers: Player[] = rows.map((m) => {
      const loserIsP1 = m.winner_id === m.player2_id
      return {
        id: (loserIsP1 ? m.player1_id : m.player2_id)!,
        name: loserIsP1 ? m.player1_name : m.player2_name,
      }
    })
    await supabaseAdmin.from('tournament_matches').insert([
      {
        round: nextRound,
        slot: 1,
        player1_id: winners[0].id,
        player1_name: winners[0].name,
        player2_id: winners[1].id,
        player2_name: winners[1].name,
      },
      {
        round: nextRound,
        slot: 1,
        player1_id: losers[0].id,
        player1_name: losers[0].name,
        player2_id: losers[1].id,
        player2_name: losers[1].name,
        is_third_place: true,
      },
    ])
    return
  }

  // Vòng thường → ghép winner thành vòng tiếp theo
  const pairs = pairRound(winners)
  await supabaseAdmin
    .from('tournament_matches')
    .insert(
      pairs.map((p, idx) => ({
        round: nextRound,
        slot: idx + 1,
        player1_id: p.p1.id,
        player1_name: p.p1.name,
        player2_id: p.p2?.id ?? null,
        player2_name: p.p2?.name ?? '',
        winner_id: p.p2 ? null : p.p1.id, // bye → tự động đi tiếp
      })),
    )
  // Nếu có bye trong vòng mới → kiểm tra luôn vòng mới đã đủ kết quả chưa
  if (pairs.some((p) => !p.p2)) {
    await advanceRound(nextRound)
  }
}

// POST – Các hành động admin: seed / set-winner / swap / reset
export async function POST(request: Request) {
  try {
    // Xác thực + phân quyền
    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role
    const isAdmin = role === 'admin' || role === 'super_admin'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
    }

    const { action, matchId, winnerId, match1Id, side1, match2Id, side2 } =
      await request.json()

    // Đảm bảo có dòng trạng thái
    const { error: stateInitError } = await supabaseAdmin
      .from('tournament_state')
      .upsert({ id: 1 })
    if (stateInitError) {
      return NextResponse.json({ error: stateInitError.message }, { status: 400 })
    }

    switch (action) {
      // Ghép đối thủ: trộn ngẫu nhiên + tạo vòng 1
      case 'seed': {
        const { data: state } = await supabaseAdmin
          .from('tournament_state')
          .select('status')
          .eq('id', 1)
          .single()
        if (state?.status !== 'open') {
          return NextResponse.json(
            { error: 'Chỉ ghép đối thủ khi giải đang mở đăng ký' },
            { status: 400 },
          )
        }

        const { data: entries } = await supabaseAdmin
          .from('tournament_entries')
          .select('user_id, user_name')
        if (!entries || entries.length < 4) {
          return NextResponse.json(
            { error: 'Cần ít nhất 4 thành viên đăng ký để ghép trận' },
            { status: 400 },
          )
        }

        const players = shuffle(
          entries.map((e: { user_id: string; user_name: string }) => ({
            id: e.user_id,
            name: e.user_name,
          })),
        )
        const pairs = pairRound(players)

        const { error } = await supabaseAdmin.from('tournament_matches').insert(
          pairs.map((p, idx) => ({
            round: 1,
            slot: idx + 1,
            player1_id: p.p1.id,
            player1_name: p.p1.name,
            player2_id: p.p2?.id ?? null,
            player2_name: p.p2?.name ?? '',
            winner_id: p.p2 ? null : p.p1.id, // bye → tự động đi tiếp
          })),
        )
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })

        // Xử lý bye ở vòng 1 (nếu có)
        if (pairs.some((p) => !p.p2)) {
          await advanceRound(1)
        }

        const { error: stateError } = await supabaseAdmin
          .from('tournament_state')
          .update({ status: 'running', updated_at: new Date().toISOString() })
          .eq('id', 1)
        if (stateError) {
          return NextResponse.json({ error: stateError.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
      }

      // Chọn người thắng của 1 trận
      case 'set-winner': {
        const { data: match } = await supabaseAdmin
          .from('tournament_matches')
          .select('*')
          .eq('id', matchId)
          .single()
        if (!match) {
          return NextResponse.json({ error: 'Không tìm thấy trận đấu' }, { status: 404 })
        }
        if (match.winner_id) {
          return NextResponse.json({ error: 'Trận này đã có kết quả' }, { status: 400 })
        }
        if (winnerId !== match.player1_id && winnerId !== match.player2_id) {
          return NextResponse.json(
            { error: 'Người thắng phải là 1 trong 2 người của trận' },
            { status: 400 },
          )
        }

        const { error } = await supabaseAdmin
          .from('tournament_matches')
          .update({ winner_id: winnerId })
          .eq('id', matchId)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })

        await advanceRound(match.round)
        return NextResponse.json({ success: true })
      }

      // Đổi người giữa 2 vị trí trên sơ đồ (trận chưa có kết quả)
      case 'swap': {
        const sideOf = (s: unknown) => (s === 'p2' ? 'p2' : 'p1')
        const { data: m1 } = await supabaseAdmin
          .from('tournament_matches')
          .select('*')
          .eq('id', match1Id)
          .single()
        const { data: m2 } = await supabaseAdmin
          .from('tournament_matches')
          .select('*')
          .eq('id', match2Id)
          .single()
        if (!m1 || !m2) {
          return NextResponse.json({ error: 'Không tìm thấy trận đấu' }, { status: 404 })
        }
        if (m1.winner_id || m2.winner_id) {
          return NextResponse.json(
            { error: 'Chỉ đổi người trong các trận chưa có kết quả' },
            { status: 400 },
          )
        }

        const s1 = sideOf(side1)
        const s2 = sideOf(side2)
        const p1a = s1 === 'p1' ? m1.player1_id : m1.player2_id
        const n1a = s1 === 'p1' ? m1.player1_name : m1.player2_name
        const p2a = s2 === 'p1' ? m2.player1_id : m2.player2_id
        const n2a = s2 === 'p1' ? m2.player1_name : m2.player2_name

        const [upd1, upd2] = await Promise.all([
          supabaseAdmin
            .from('tournament_matches')
            .update(
              s1 === 'p1'
                ? { player1_id: p2a, player1_name: n2a }
                : { player2_id: p2a, player2_name: n2a },
            )
            .eq('id', m1.id),
          supabaseAdmin
            .from('tournament_matches')
            .update(
              s2 === 'p1'
                ? { player1_id: p1a, player1_name: n1a }
                : { player2_id: p1a, player2_name: n1a },
            )
            .eq('id', m2.id),
        ])
        if (upd1.error) return NextResponse.json({ error: upd1.error.message }, { status: 400 })
        if (upd2.error) return NextResponse.json({ error: upd2.error.message }, { status: 400 })

        return NextResponse.json({ success: true })
      }

      // Reset giải (xóa toàn bộ trận + đăng ký, mở lại đăng ký)
      case 'reset': {
        const [delMatches, delEntries] = await Promise.all([
          supabaseAdmin.from('tournament_matches').delete().neq('id', 0),
          supabaseAdmin.from('tournament_entries').delete().neq('id', 0),
        ])
        if (delMatches.error) {
          return NextResponse.json({ error: delMatches.error.message }, { status: 400 })
        }
        if (delEntries.error) {
          return NextResponse.json({ error: delEntries.error.message }, { status: 400 })
        }
        const { error } = await supabaseAdmin
          .from('tournament_state')
          .update({ status: 'open', updated_at: new Date().toISOString() })
          .eq('id', 1)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 })
    }
  } catch (err) {
    console.error('POST tournament/admin error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
