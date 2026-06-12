export default function BaseGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="stone-card overflow-hidden rounded-xl">
          {/* Image skeleton */}
          <div className="aspect-[4/3] w-full animate-pulse bg-stone-800" />
          {/* Content skeleton */}
          <div className="flex flex-col gap-3 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-stone-800" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-stone-800" />
            <div className="mt-2 flex gap-2">
              <div className="h-8 flex-1 animate-pulse rounded-md bg-stone-800" />
              <div className="h-8 w-10 animate-pulse rounded-md bg-stone-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
