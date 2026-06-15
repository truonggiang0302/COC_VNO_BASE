'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, ChevronDown, X, Filter, Target, Sword, Shield, Star, Zap, Crosshair } from 'lucide-react'
import { BASE_TYPES, TOWNHALL_LEVELS, type BaseType } from '@/types'
import { cn } from '@/lib/cn'

const TYPE_ICONS: Record<BaseType, React.ReactNode> = {
  'Farming': <Shield className="h-5 w-5" />,
  'War': <Sword className="h-5 w-5" />,
  'Trophy': <Star className="h-5 w-5" />,
  'Hybrid': <Zap className="h-5 w-5" />,
  'Anti 2 Star': <Crosshair className="h-5 w-5" />,
  'Anti 3 Star': <Target className="h-5 w-5" />,
}

const TYPE_BG: Record<BaseType, string> = {
  'Farming':    'from-army-900/60 to-army-950/30 border-army-700 hover:border-army-500',
  'War':        'from-red-950/60 to-red-950/30 border-red-900 hover:border-red-600',
  'Trophy':     'from-yellow-950/60 to-yellow-950/30 border-gold-800 hover:border-gold-600',
  'Hybrid':     'from-purple-950/60 to-purple-950/30 border-purple-900 hover:border-purple-600',
  'Anti 2 Star':'from-blue-950/60 to-blue-950/30 border-blue-900 hover:border-blue-600',
  'Anti 3 Star':'from-orange-950/60 to-orange-950/30 border-orange-900 hover:border-orange-600',
}

const TYPE_TEXT: Record<BaseType, string> = {
  'Farming':    'text-army-400',
  'War':        'text-red-400',
  'Trophy':     'text-gold-400',
  'Hybrid':     'text-purple-400',
  'Anti 2 Star':'text-blue-400',
  'Anti 3 Star':'text-orange-400',
}

export default function FilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '')
  const [selectedTH, setSelectedTH] = useState(searchParams.get('townhall') ?? '')
  const [selectedType, setSelectedType] = useState(searchParams.get('base_type') ?? '')

  const currentTH = searchParams.get('townhall') ?? ''
  const currentType = searchParams.get('base_type') ?? ''
  const currentSearch = searchParams.get('search') ?? ''

  const hasFilters = currentTH || currentType || currentSearch

  const buildUrl = (th: string, type: string, search: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (th) params.set('townhall', th)
    if (type) params.set('base_type', type)
    return params.toString() ? `${pathname}?${params.toString()}` : pathname
  }

  const handleSearch = () => {
    router.push(buildUrl(selectedTH, selectedType, searchValue))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleQuickType = (type: string) => {
    const newType = currentType === type ? '' : type
    router.push(buildUrl(currentTH, newType, currentSearch))
  }

  const handleQuickTH = (th: number) => {
    const newTH = currentTH === String(th) ? '' : String(th)
    router.push(buildUrl(newTH, currentType, currentSearch))
  }

  const clearAll = () => {
    setSearchValue('')
    setSelectedTH('')
    setSelectedType('')
    router.push(pathname)
  }

  return (
    <div className="space-y-6">
      {/* Quick Type Filters */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
          <Filter className="mr-1 inline h-3 w-3" />
          Loại Base
        </p>
        <div className="flex flex-wrap gap-2">
          {BASE_TYPES.map((type) => {
            const isActive = currentType === type
            return (
              <button
                key={type}
                onClick={() => handleQuickType(type)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border bg-gradient-to-b px-3 py-2 text-xs font-semibold transition-all duration-200',
                  TYPE_BG[type],
                  isActive
                    ? `${TYPE_TEXT[type]} border-gold-500 shadow-lg shadow-gold-900/20 scale-105`
                    : 'text-stone-400 opacity-70 hover:opacity-100',
                )}
              >
                {TYPE_ICONS[type]}
                {type}
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick TH Filters */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
          <Target className="mr-1 inline h-3 w-3" />
          Town Hall
        </p>
        <div className="flex flex-wrap gap-2">
          {TOWNHALL_LEVELS.map((th) => {
            const isActive = currentTH === String(th)
            return (
              <button
                key={th}
                onClick={() => handleQuickTH(th)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-all duration-200',
                  isActive
                    ? 'border-gold-500 bg-gold-900/40 text-gold-400 shadow-lg shadow-gold-900/20 scale-110'
                    : 'border-stone-700 bg-stone-900/50 text-stone-500 hover:border-gold-700 hover:text-gold-500',
                )}
              >
                {th}
              </button>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-stone-700 to-transparent" />

      {/* Advanced Search */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
          <Search className="mr-1 inline h-3 w-3" />
          Tìm kiếm nâng cao
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
            <input
              type="text"
              placeholder="Nhập tên base..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="coc-input w-full rounded-lg py-2.5 pl-9 pr-4 text-sm"
            />
          </div>

          {/* Town Hall select */}
          <div className="relative min-w-[160px]">
            <select
              value={selectedTH}
              onChange={(e) => setSelectedTH(e.target.value)}
              className="coc-input appearance-none rounded-lg py-2.5 pl-3 pr-8 text-sm cursor-pointer w-full"
            >
              <option value="">Tất cả TH</option>
              {TOWNHALL_LEVELS.map((th) => (
                <option key={th} value={th}>TH {th}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
          </div>

          {/* Base Type select */}
          <div className="relative min-w-[160px]">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="coc-input appearance-none rounded-lg py-2.5 pl-3 pr-8 text-sm cursor-pointer w-full"
            >
              <option value="">Tất cả loại</option>
              {BASE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            className="btn-gold flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all hover:scale-105"
          >
            <Search className="h-4 w-4" />
            Tìm kiếm
          </button>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 rounded-lg border border-stone-700 px-4 py-2.5 text-sm text-stone-400 hover:border-red-800 hover:text-red-400 transition-colors"
            >
              <X className="h-4 w-4" />
              Xóa lọc
            </button>
          )}
        </div>
      </div>
    </div>
  )
}