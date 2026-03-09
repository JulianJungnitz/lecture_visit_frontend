'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Lecture, University } from '@/types/database'

export type KanbanItem = {
  id: string
  lecture: Lecture & { university?: University | null }
}

export function KanbanCard({ item }: { item: KanbanItem }) {
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'p-3 cursor-grab active:cursor-grabbing select-none',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <p className="text-sm font-medium leading-snug">{item.lecture.title}</p>
      {item.lecture.university && (
        <span className="text-xs text-muted-foreground mt-1 block">
          {item.lecture.university.name}
        </span>
      )}
    </Card>
  )
}
