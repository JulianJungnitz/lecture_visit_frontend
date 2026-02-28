import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="animate-fade-in-up">
      {/* Header skeleton */}
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-5 w-10 rounded-md" />
      </div>
      <div className="flex items-center gap-2 mb-1">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Separator */}
      <div className="my-4 h-px bg-black/[0.06]" />

      {/* Search skeleton */}
      <Skeleton className="h-9 w-full mb-3" />
      <Skeleton className="h-4 w-20 mb-3" />

      {/* Lecture list skeleton */}
      <div className="space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="px-3 py-2.5"
            style={{ opacity: 1 - i * 0.1 }}
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-[65%]" />
              <Skeleton className="h-5 w-14 rounded-md" />
            </div>
            <Skeleton className="h-3 w-20 mt-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
