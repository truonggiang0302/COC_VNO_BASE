'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, ChevronDown, X } from 'lucide-react'
import { BASE_TYPES, TOWNHALL_LEVELS, type BaseType } from '@/types'
import { cn } from '@/lib/cn'

export default function FilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentTH = searchParams.get('townhall') ?? ''
  const currentType = searchParams.get('base_type') ?? ''

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page') // reset pagination
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [searchParams, pathname, router],
  )

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParams('search', searchValue)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchValue, updateParams])

  const hasFilters = currentTH || currentType || searchValue

  const clearAll = () => {
    setSearchValue('')
    startTransition(() => {
      router.push(pathname)
    })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
        <input
          type="text"
          placeholder="Tìm kiếm base..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="coc-input w-full rounded-md py-2 pl-9 pr-4 text-sm"
        />
      </div>

      {/* Town Hall Filter */}
      <div className="relative">
        <select
          value={currentTH}
          onChange={(e) => updateParams('townhall', e.target.value)}
          className="coc-input appearance-none rounded-md py-2 pl-3 pr-8 text-sm cursor-pointer"
        >
          <option value="">Tất cả Town Hall</option>
          {TOWNHALL_LEVELS.map((th) => (
            <option key={th} value={th}>
              TH {th}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
      </div>

      {/* Base Type Filter */}
      <div className="relative">
        <select
          value={currentType}
          onChange={(e) => updateParams('base_type', e.target.value)}
          className="coc-input appearance-none rounded-md py-2 pl-3 pr-8 text-sm cursor-pointer"
        >
          <option value="">Tất cả loại base</option>
          {BASE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className={cn(
            'flex items-center gap-1.5 rounded-md border border-stone-750 px-3 py-2 text-sm',
            'text-stone-400 hover:border-gold-700 hover:text-gold-400 transition-colors',
          )}
        >
          <X className="h-3.5 w-3.5" />
          Xóa lọc
        </button>
      )}
    </div>
  )
}
