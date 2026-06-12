import { Suspense } from 'react'
import type { BaseFilters } from '@/types'
import Header from '@/components/Header'
import FilterBar from '@/components/FilterBar'
import BaseGrid from '@/components/BaseGrid'
import BaseGridSkeleton from '@/components/BaseGridSkeleton'

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams

  const filters: BaseFilters = {
    search:    typeof params.search    === 'string' ? params.search    : undefined,
    townhall:  typeof params.townhall  === 'string' ? params.townhall  : undefined,
    base_type: typeof params.base_type === 'string' ? params.base_type : undefined,
  }

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative border-b border-stone-750 bg-gradient-to-b from-[#1e1810] to-[#141210] py-10">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="gold-shimmer mb-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            COC VNO
          </h1>
          <p className="text-stone-400">
            Khám phá và chia sẻ base layout Clash of Clans tốt nhất cho anh em clan VietNamOnline
          </p>
        </div>
        {/* Decorative lines */}
        <div className="absolute bottom-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-gold-800/30 to-transparent" />
      </section>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Filter Bar */}
        <div className="mb-8 rounded-xl border border-stone-750 bg-[#1a1612] p-4">
          <Suspense>
            <FilterBar />
          </Suspense>
        </div>

        {/* Base Grid */}
        <Suspense fallback={<BaseGridSkeleton />}>
          <BaseGrid filters={filters} />
        </Suspense>
      </main>

      <footer className="border-t border-stone-750 py-6 text-center text-xs text-stone-600">
        © {new Date().getFullYear()} CoC VNO – Không liên kết với Supercell
      </footer>
    </div>
  )
}
