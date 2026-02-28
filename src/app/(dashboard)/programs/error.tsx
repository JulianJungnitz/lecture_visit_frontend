'use client'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <p className="text-muted-foreground text-sm">Something went wrong.</p>
      <button
        onClick={reset}
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        Try again
      </button>
    </div>
  )
}
