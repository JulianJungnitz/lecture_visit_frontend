import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface UniversityBadgeProps {
  universityName: string
  className?: string
}

export function UniversityBadge({ universityName, className }: UniversityBadgeProps) {
  const isTUM = universityName === 'TUM'
  const isLMU = universityName === 'LMU'

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium px-1.5 py-0',
        isTUM && 'bg-blue-50 text-blue-600 border-blue-200',
        isLMU && 'bg-emerald-50 text-emerald-600 border-emerald-200',
        !isTUM && !isLMU && 'bg-muted text-muted-foreground',
        className
      )}
    >
      {universityName}
    </Badge>
  )
}
