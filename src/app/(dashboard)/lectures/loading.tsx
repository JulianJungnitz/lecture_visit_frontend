import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="animate-fade-in-up">
      {/* Header skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-36 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Filters row skeleton */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton className="h-9 flex-1 min-w-48" />
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-9 w-44 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* Count skeleton */}
      <Skeleton className="h-4 w-20 mb-4" />

      {/* Card skeletons */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-black/[0.04] px-4 py-3"
            style={{ opacity: 1 - i * 0.08 }}
          >
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-[55%]" />
              <Skeleton className="h-5 w-10 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-md ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
