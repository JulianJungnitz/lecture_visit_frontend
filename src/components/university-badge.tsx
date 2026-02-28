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
        isTUM && 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        isLMU && 'bg-green-500/10 text-green-400 border-green-500/30',
        !isTUM && !isLMU && 'bg-muted text-muted-foreground',
        className
      )}
    >
      {universityName}
    </Badge>
  )
}
