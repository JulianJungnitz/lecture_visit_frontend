'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'
import type { Lecture, University, Profile } from '@/types/database'

export type KanbanItem = {
  id: string
  lecture: Lecture & {
    university?: University | null
    owner_profile?: Profile | null
  }
}

export function KanbanCard({
  item,
  onCardClick,
  showOwner = false
}: {
  item: KanbanItem
  onCardClick?: (item: KanbanItem) => void
  showOwner?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if not dragging and click handler exists
    if (!isDragging && onCardClick) {
      onCardClick(item)
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        'p-3 select-none transition-colors',
        isDragging ? 'opacity-50 shadow-lg cursor-grabbing' : 'cursor-grab hover:bg-muted/50',
        onCardClick && !isDragging && 'cursor-pointer'
      )}
    >
      <p className="text-sm font-medium leading-snug">{item.lecture.title}</p>
      {item.lecture.university && (
        <span className="text-xs text-muted-foreground mt-1 block">
          {item.lecture.university.name}
        </span>
      )}
      {showOwner && (
        <div className="flex items-center gap-1 mt-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {item.lecture.owner_profile?.display_name || 'Unassigned'}
          </span>
        </div>
      )}
    </Card>
  )
}