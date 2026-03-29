'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { User, Mail, ThumbsDown, ThumbsUp, CheckCircle, X, CalendarDays } from 'lucide-react'
import { GenerateEmailDialog } from './generate-email-dialog'
import { DoneDialog } from './done-dialog'
import { CalendarBlockerDialog } from './calendar-blocker-dialog'
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
  onMoveItem,
  onRemoveItem,
  onMarkDone,
  columnStatus,
  showOwner = false,
  isOverlay = false,
}: {
  item: KanbanItem
  onCardClick?: (item: KanbanItem) => void
  onMoveItem?: (itemId: string, targetStatus: string) => void
  onRemoveItem?: (itemId: string) => void
  onMarkDone?: (itemId: string, estimatedAttendees: number | null) => void
  columnStatus?: string
  showOwner?: boolean
  isOverlay?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = isOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      }

  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [doneDialogOpen, setDoneDialogOpen] = useState(false)
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging && onCardClick) {
      onCardClick(item)
    }
  }

  return (
    <Card
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      onClick={isOverlay ? undefined : handleClick}
      className={cn(
        'p-3 select-none transition-colors',
        isDragging && !isOverlay ? 'opacity-50' : '',
        isOverlay ? 'shadow-lg cursor-grabbing' : 'cursor-grab hover:bg-muted/50',
        onCardClick && !isDragging && !isOverlay && 'cursor-pointer'
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
      {!isOverlay && onMoveItem && columnStatus && (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {columnStatus === 'Not Contacted' && (
            <>
              <Button
                size="sm"
                className="h-7 text-xs gap-1 flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => setEmailDialogOpen(true)}
              >
                <Mail className="h-3 w-3" />
                Generate Email
              </Button>
              {onRemoveItem && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <GenerateEmailDialog
                open={emailDialogOpen}
                onClose={() => setEmailDialogOpen(false)}
                lectureId={item.lecture.id}
                lectureTitle={item.lecture.title}
                onSent={() => onMoveItem(item.id, 'Emailed')}
              />
            </>
          )}
          {columnStatus === 'Emailed' && (
            <>
              <Button
                size="sm"
                className="h-7 text-xs gap-1 min-w-0 flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={() => onMoveItem(item.id, 'Declined')}
              >
                <ThumbsDown className="h-3 w-3 shrink-0" />
                <span className="truncate">Declined</span>
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs gap-1 min-w-0 flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={() => onMoveItem(item.id, 'Confirmed')}
              >
                <ThumbsUp className="h-3 w-3 shrink-0" />
                <span className="truncate">Accepted</span>
              </Button>
            </>
          )}
          {columnStatus === 'Confirmed' && (
            <>
              <Button
                size="sm"
                className="h-7 text-xs gap-1 flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={() => setCalendarDialogOpen(true)}
              >
                <CalendarDays className="h-3 w-3" />
                Calendar
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs gap-1 flex-1 bg-foreground/80 hover:bg-foreground text-background"
                onClick={() => setDoneDialogOpen(true)}
              >
                <CheckCircle className="h-3 w-3" />
                Done
              </Button>
              <CalendarBlockerDialog
                open={calendarDialogOpen}
                onClose={() => setCalendarDialogOpen(false)}
                lectureId={item.lecture.id}
                lectureTitle={item.lecture.title}
              />
              <DoneDialog
                open={doneDialogOpen}
                onClose={() => setDoneDialogOpen(false)}
                lectureTitle={item.lecture.title}
                onConfirm={(estimatedAttendees) => {
                  setDoneDialogOpen(false)
                  onMarkDone
                    ? onMarkDone(item.id, estimatedAttendees)
                    : onMoveItem(item.id, 'Done')
                }}
              />
            </>
          )}
        </div>
      )}
    </Card>
  )
}
