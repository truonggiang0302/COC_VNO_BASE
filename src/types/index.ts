export type BaseType =
  | 'Farming'
  | 'War'
  | 'Trophy'
  | 'Hybrid'
  | 'Anti 2 Star'
  | 'Anti 3 Star'

export interface Base {
  id: string
  name: string
  townhall: number
  base_type: BaseType
  image_url: string
  base_link: string
  description: string | null
  downloads: number
  rating: number
  rating_count: number
  created_by: string | null
  created_at: string
  // Joined from profiles (optional, may not be present in all queries)
  profiles?: { name: string } | null
}

export type UserRole = 'super_admin' | 'admin' | 'viewer'

export interface Profile {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
}

export interface BaseFilters {
  search?: string
  townhall?: string
  base_type?: string
}

export const BASE_TYPES: BaseType[] = [
  'Farming',
  'War',
  'Trophy',
  'Hybrid',
  'Anti 2 Star',
  'Anti 3 Star',
]

export const TOWNHALL_LEVELS = Array.from({ length: 10 }, (_, i) => i + 9) // 9..18

export type ClanRole = 'leader' | 'co_leader' | 'elder' | 'member'

export interface ClanMember {
  id: string
  name: string
  role: ClanRole
  image_url: string
  display_order: number
  created_at: string
}

export const CLAN_ROLE_LABELS: Record<ClanRole, string> = {
  leader: 'Thủ Lĩnh',
  co_leader: 'Đồng Thủ Lĩnh',
  elder: 'Huynh Trưởng',
  member: 'Thành Viên',
}

export const BASE_TYPE_COLORS: Record<BaseType, string> = {
  'Farming':    'bg-army-700 text-army-400 border border-army-600',
  'War':        'bg-red-950 text-red-400 border border-red-800',
  'Trophy':     'bg-yellow-950 text-gold-400 border border-gold-700',
  'Hybrid':     'bg-purple-950 text-purple-400 border border-purple-800',
  'Anti 2 Star':'bg-blue-950 text-blue-400 border border-blue-800',
  'Anti 3 Star':'bg-orange-950 text-orange-400 border border-orange-800',
}
