import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="max-w-4xl animate-fade-in-up">
      {/* Header skeleton */}
      <div className="mb-2">
        <div className="flex items-start gap-3 mb-2">
          <Skeleton className="h-8 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-10 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
        <Skeleton className="h-4 w-full mt-3" />
        <Skeleton className="h-4 w-3/4 mt-1.5" />
      </div>

      {/* Separator */}
      <div className="my-8 h-px bg-black/[0.06]" />

      {/* Professors section skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-6" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-black/[0.04] p-4"
              style={{ opacity: 1 - i * 0.15 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-4 w-14" />
              </div>
              <div className="mt-2">
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className="my-8 h-px bg-black/[0.06]" />

      {/* Schedule section skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-6" />
        </div>
        <div className="rounded-xl border border-black/[0.04] overflow-hidden">
          <div className="border-b border-black/[0.04] px-4 py-3">
            <div className="flex gap-8">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-black/[0.02] last:border-b-0" style={{ opacity: 1 - i * 0.15 }}>
              <div className="flex gap-8">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
