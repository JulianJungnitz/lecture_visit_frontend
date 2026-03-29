'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { KanbanCard, type KanbanItem } from './kanban-card'

const STATUS_COLORS: Record<string, string> = {
  'Not Contacted': 'bg-muted-foreground/70',
  Emailed: 'bg-amber-500',
  Confirmed: 'bg-emerald-500',
  Declined: 'bg-red-500',
  Done: 'bg-foreground/80',
}

type Props = {
  id: string
  title: string
  items: KanbanItem[]
  onCardClick?: (item: KanbanItem) => void
  onMoveItem?: (itemId: string, targetStatus: string) => void
  onRemoveItem?: (itemId: string) => void
  onMarkDone?: (itemId: string, estimatedAttendees: number | null) => void
  showOwner?: boolean
}

export function KanbanColumn({ id, title, items, onCardClick, onMoveItem, onRemoveItem, onMarkDone, showOwner = false }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex flex-col min-w-[180px] flex-1 h-full">
      <div className="flex items-center gap-2 mb-3 px-1 flex-shrink-0">
        <span className={cn('h-2 w-2 rounded-full shrink-0', STATUS_COLORS[title] ?? 'bg-gray-400')} />
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <Badge variant="secondary" className="text-xs px-1.5 py-0">
          {items.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-col gap-2 p-2 rounded-lg bg-muted/50 transition-colors overflow-y-auto',
          isOver && 'bg-muted'
        )}
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <KanbanCard key={item.id} item={item} onCardClick={onCardClick} onMoveItem={onMoveItem} onRemoveItem={onRemoveItem} onMarkDone={onMarkDone} columnStatus={title} showOwner={showOwner} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}