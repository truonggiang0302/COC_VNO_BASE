import { createClient } from '@/utils/supabase/server'
import type { BaseFilters } from '@/types'
import BaseCard from './BaseCard'
import { Shield } from 'lucide-react'

interface BaseGridProps {
  filters: BaseFilters
}

export default async function BaseGrid({ filters }: BaseGridProps) {
  const supabase = await createClient()

  let query = supabase
    .from('bases')
    .select('*, profiles:created_by ( name )')
    .order('created_at', { ascending: false })

  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }
  if (filters.townhall) {
    query = query.eq('townhall', parseInt(filters.townhall))
  }
  if (filters.base_type) {
    query = query.eq('base_type', filters.base_type)
  }

  const { data: bases, error } = await query

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="mb-4 h-12 w-12 text-red-700" />
        <p className="text-stone-400">Có lỗi khi tải dữ liệu. Vui lòng thử lại.</p>
      </div>
    )
  }

  if (!bases || bases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="mb-4 h-16 w-16 text-stone-700" />
        <h3 className="mb-2 text-lg font-semibold text-stone-400">
          Không tìm thấy base nào
        </h3>
        <p className="text-sm text-stone-600">
          Hãy thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác.
        </p>
      </div>
    )
  }

  return (
    <>
      <p className="mb-4 text-sm text-stone-500">
        Tìm thấy{' '}
        <span className="font-semibold text-gold-500">{bases.length}</span> base
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {bases.map((base) => (
          <BaseCard key={base.id} base={base} />
        ))}
      </div>
    </>
  )
}
