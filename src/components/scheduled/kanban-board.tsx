'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  type Modifier,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Plus, User, Users } from 'lucide-react'
import { KanbanColumn } from './kanban-column'
import { KanbanCard, type KanbanItem } from './kanban-card'
import { AddLectureDialog } from './add-lecture-dialog'
import { LectureDetailPanel } from './lecture-detail-panel'
import { updateLectureStatus, addLectureToBoard, removeLectureFromBoard } from '@/app/actions/lecture-board'
import type { Lecture, University, Profile, OutreachStatus } from '@/types/database'
import type { ExtrapolatedDate } from '@/lib/date-utils'
import { useToast } from '@/hooks/use-toast'

type LectureWithUniversityAndOwner = Lecture & {
  university?: University | null
  owner_profile?: Profile | null
}

const STATUSES = ['Not Contacted', 'Emailed', 'Confirmed', 'Declined', 'Done'] as const
type Status = (typeof STATUSES)[number]

const statusToDbEnum: Record<Status, OutreachStatus> = {
  'Not Contacted': 'not_contacted',
  'Emailed': 'emailed',
  'Confirmed': 'confirmed',
  'Declined': 'declined',
  'Done': 'done'
}

const dbEnumToStatus: Record<OutreachStatus, Status> = {
  'not_contacted': 'Not Contacted',
  'emailed': 'Emailed',
  'confirmed': 'Confirmed',
  'declined': 'Declined',
  'done': 'Done'
}

type Columns = Record<Status, KanbanItem[]>

const emptyColumns: Columns = {
  'Not Contacted': [],
  'Emailed': [],
  'Confirmed': [],
  'Declined': [],
  'Done': [],
}

type Props = {
  lectures: LectureWithUniversityAndOwner[]
  currentUserId?: string
}

// Compensate for sidebar width only (w-56 = 14rem = 224px)
const sidebarOffsetModifier: Modifier = ({ transform }) => ({
  ...transform,
  x: transform.x - 244,
  y: transform.y - 80,
})

export function KanbanBoard({ lectures, currentUserId }: Props) {
  const [columns, setColumns] = useState<Columns>(emptyColumns)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [view, setView] = useState<'personal' | 'all'>('personal')
  const [selectedLecture, setSelectedLecture] = useState<LectureWithUniversityAndOwner | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const dragOriginColumnRef = useRef<Status | null>(null)
  const [addingToBoard, setAddingToBoard] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const newColumns: Columns = {
      'Not Contacted': [],
      'Emailed': [],
      'Confirmed': [],
      'Declined': [],
      'Done': [],
    }

    const lecturesWithOwners = lectures.filter(l => l.owner !== null)

    lecturesWithOwners.forEach(lecture => {
      const dbStatus = lecture.outreach_status
      if (dbStatus) {
        const uiStatus = dbEnumToStatus[dbStatus]
        if (uiStatus && uiStatus in newColumns) {
          newColumns[uiStatus].push({
            id: `kanban-${lecture.id}`,
            lecture
          })
        }
      }
    })

    setColumns(newColumns)
  }, [lectures])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5
      }
    })
  )

  const excludeIds = useMemo(() => {
    const ids = new Set<string>()
    lectures.forEach(lecture => {
      if (lecture.owner) {
        ids.add(lecture.id)
      }
    })
    return ids
  }, [lectures])

  const filteredColumns = useMemo(() => {
    if (view === 'personal' && currentUserId) {
      const filtered: Columns = { ...emptyColumns }
      Object.entries(columns).forEach(([status, items]) => {
        filtered[status as Status] = items.filter(item =>
          item.lecture.owner === currentUserId
        )
      })
      return filtered
    }
    return columns
  }, [columns, view, currentUserId])

  const findColumn = useCallback(
    (id: string): Status | undefined => {
      if (STATUSES.includes(id as Status)) return id as Status
      for (const status of STATUSES) {
        if (columns[status].some((item) => item.id === id)) return status
      }
      return undefined
    },
    [columns]
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string
    setActiveId(id)
    dragOriginColumnRef.current = findColumn(id) ?? null
  }, [findColumn])

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      const activeCol = findColumn(String(active.id))
      const overCol = findColumn(String(over.id))
      if (!activeCol || !overCol || activeCol === overCol) return

      setColumns((prev) => {
        const activeItems = [...prev[activeCol]]
        const overItems = [...prev[overCol]]
        const activeIndex = activeItems.findIndex((i) => i.id === active.id)
        if (activeIndex === -1) return prev

        const [moved] = activeItems.splice(activeIndex, 1)

        if (moved && activeCol !== overCol) {
          const dbStatus = statusToDbEnum[overCol]
          moved.lecture = { ...moved.lecture, outreach_status: dbStatus }
        }

        const overIndex = overItems.findIndex((i) => i.id === over.id)
        const insertIndex = overIndex >= 0 ? overIndex : overItems.length

        overItems.splice(insertIndex, 0, moved)

        return { ...prev, [activeCol]: activeItems, [overCol]: overItems }
      })
    },
    [findColumn]
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const originColumn = dragOriginColumnRef.current
      setActiveId(null)
      dragOriginColumnRef.current = null

      const { active, over } = event
      if (!over) return

      const currentCol = findColumn(String(active.id))
      if (!currentCol) return

      // Use the origin column ref to detect cross-column moves,
      // since handleDragOver already moved the item in state.
      if (originColumn && originColumn !== currentCol) {
        const draggedItem = columns[currentCol].find(item => item.id === active.id)
        if (!draggedItem) return

        try {
          const dbStatus = statusToDbEnum[currentCol]
          const result = await updateLectureStatus(draggedItem.lecture.id, dbStatus)

          // Show warning if calendar operation failed
          if (result.warning) {
            toast({
              title: 'Calendar Warning',
              description: result.warning,
              variant: 'destructive',
            })
          }
        } catch (error) {
          console.error('Failed to update lecture status:', error)
          toast({
            title: 'Error',
            description: 'Failed to update lecture status. Please try again.',
            variant: 'destructive',
          })
            setColumns((prev) => {
            const fromItems = [...prev[currentCol]]
            const idx = fromItems.findIndex((i) => i.id === active.id)
            if (idx === -1) return prev
            const [moved] = fromItems.splice(idx, 1)
            moved.lecture = { ...moved.lecture, outreach_status: statusToDbEnum[originColumn] }
            return {
              ...prev,
              [currentCol]: fromItems,
              [originColumn]: [...prev[originColumn], moved],
            }
          })
        }
      } else if (currentCol && over) {
        setColumns((prev) => {
          const items = [...prev[currentCol]]
          const oldIndex = items.findIndex((i) => i.id === active.id)
          const newIndex = items.findIndex((i) => i.id === over.id)
          if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev
          return { ...prev, [currentCol]: arrayMove(items, oldIndex, newIndex) }
        })
      }
    },
    [findColumn, columns]
  )

  const handleAddLecture = useCallback((lecture: LectureWithUniversityAndOwner) => {
    const lectureWithUpdates = {
      ...lecture,
      owner: currentUserId || lecture.owner,
      visit_assigned_to: currentUserId || lecture.visit_assigned_to,
      outreach_status: 'not_contacted' as const
    }

    const item: KanbanItem = {
      id: `kanban-${lecture.id}`,
      lecture: lectureWithUpdates,
    }
    setColumns((prev) => ({
      ...prev,
      'Not Contacted': [...prev['Not Contacted'], item],
    }))
  }, [currentUserId])

  const handleMoveItem = useCallback(async (itemId: string, targetStatus: Status, visitScheduledFor?: ExtrapolatedDate) => {
    const sourceStatus = findColumn(itemId)
    if (!sourceStatus || sourceStatus === targetStatus) return

    const item = columns[sourceStatus].find(i => i.id === itemId)
    if (!item) return

    const dbStatus = statusToDbEnum[targetStatus]

    setColumns((prev) => {
      const fromItems = prev[sourceStatus].filter(i => i.id !== itemId)
      const movedItem = { ...item, lecture: { ...item.lecture, outreach_status: dbStatus } }
      return { ...prev, [sourceStatus]: fromItems, [targetStatus]: [...prev[targetStatus], movedItem] }
    })

    try {
      let visitScheduledForIso: string | undefined
      let durationMinutes: number | undefined

      if (visitScheduledFor) {
        // Combine date with startTime to get the actual lecture time
        const [startHours, startMinutes] = visitScheduledFor.startTime.split(':').map(Number)
        const scheduledDate = new Date(visitScheduledFor.date)
        scheduledDate.setHours(startHours, startMinutes, 0, 0)
        visitScheduledForIso = scheduledDate.toISOString()

        // Calculate duration in minutes from start and end times
        const [endHours, endMinutes] = visitScheduledFor.endTime.split(':').map(Number)
        const startTotalMinutes = startHours * 60 + startMinutes
        const endTotalMinutes = endHours * 60 + endMinutes
        durationMinutes = endTotalMinutes - startTotalMinutes
      }

      const result = await updateLectureStatus(item.lecture.id, dbStatus, undefined, visitScheduledForIso, durationMinutes)

      // Show warning if calendar operation failed
      if (result.warning) {
        toast({
          title: 'Calendar Warning',
          description: result.warning,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to update lecture status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update lecture status. Please try again.',
        variant: 'destructive',
      })
      setColumns((prev) => {
        const toItems = prev[targetStatus].filter(i => i.id !== itemId)
        const restored = { ...item, lecture: { ...item.lecture, outreach_status: statusToDbEnum[sourceStatus] } }
        return { ...prev, [targetStatus]: toItems, [sourceSource]: [...prev[sourceStatus], restored] }
      })
    }
  }, [findColumn, columns, toast])

  const handleRemoveItem = useCallback(async (itemId: string) => {
    const sourceStatus = findColumn(itemId)
    if (!sourceStatus) return

    const item = columns[sourceStatus].find(i => i.id === itemId)
    if (!item) return

    setColumns((prev) => ({
      ...prev,
      [sourceStatus]: prev[sourceStatus].filter(i => i.id !== itemId),
    }))

    try {
      await removeLectureFromBoard(item.lecture.id)
    } catch (error) {
      console.error('Failed to remove lecture from board:', error)
      setColumns((prev) => ({
        ...prev,
        [sourceStatus]: [...prev[sourceStatus], item],
      }))
    }
  }, [findColumn, columns])

  const handleMarkDone = useCallback(async (itemId: string, estimatedAttendees: number | null) => {
    const sourceStatus = findColumn(itemId)
    if (!sourceStatus) return

    const item = columns[sourceStatus].find(i => i.id === itemId)
    if (!item) return

    const targetStatus: Status = 'Done'
    const dbStatus = statusToDbEnum[targetStatus]

    setColumns((prev) => {
      const fromItems = prev[sourceStatus].filter(i => i.id !== itemId)
      const movedItem = { ...item, lecture: { ...item.lecture, outreach_status: dbStatus, estimated_attendees: estimatedAttendees } }
      return { ...prev, [sourceStatus]: fromItems, [targetStatus]: [...prev[targetStatus], movedItem] }
    })

    try {
      const result = await updateLectureStatus(item.lecture.id, dbStatus, estimatedAttendees)

      // Show warning if calendar operation failed (shouldn't happen for 'done' status)
      if (result.warning) {
        toast({
          title: 'Calendar Warning',
          description: result.warning,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to mark lecture as done:', error)
      toast({
        title: 'Error',
        description: 'Failed to mark lecture as done. Please try again.',
        variant: 'destructive',
      })
      setColumns((prev) => {
        const toItems = prev[targetStatus].filter(i => i.id !== itemId)
        const restored = { ...item, lecture: { ...item.lecture, outreach_status: statusToDbEnum[sourceStatus] } }
        return { ...prev, [targetStatus]: toItems, [sourceSource]: [...prev[sourceStatus], restored] }
      })
    }
  }, [findColumn, columns])

  const handleCardClick = useCallback((item: KanbanItem) => {
    setSelectedLecture(item.lecture)
    setIsPanelOpen(true)
  }, [])

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false)
    setTimeout(() => setSelectedLecture(null), 300)
  }, [])

  const handleAddToBoardFromPanel = useCallback(
    async (lecture: LectureWithUniversityAndOwner) => {
      setAddingToBoard(true)
      try {
        await addLectureToBoard(lecture.id)
        handleAddLecture(lecture)
        handleClosePanel()
      } finally {
        setAddingToBoard(false)
      }
    },
    [handleAddLecture, handleClosePanel]
  )

  const activeItem = useMemo(() => {
    if (!activeId) return null
    for (const status of STATUSES) {
      const item = columns[status].find((item) => item.id === activeId)
      if (item) return item
    }
    return null
  }, [activeId, columns])

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">Lecture visits outreach</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and manage your lecture visit outreach
        </p>
        <div className="mt-3 inline-flex items-center rounded-full bg-muted p-0.5">
          <button
            onClick={() => setView('personal')}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
              view === 'personal'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Personal
          </button>
          <button
            onClick={() => setView('all')}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
              view === 'all'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            All
          </button>
        </div>
        <div className="mt-4">
          <Button type="button" onClick={() => setDialogOpen(true)} className="bg-black hover:bg-black/90">
            <Plus className="h-4 w-4" />
            Add lecture
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto flex-1 pb-6">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              id={status}
              title={status}
              items={filteredColumns[status]}
              onCardClick={handleCardClick}
              onMoveItem={view === 'personal' ? handleMoveItem : undefined}
              onRemoveItem={view === 'personal' ? handleRemoveItem : undefined}
              onMarkDone={view === 'personal' ? handleMarkDone : undefined}
              showOwner={view === 'all'}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null} modifiers={[sidebarOffsetModifier]}>
          {activeItem ? (
            <KanbanCard
              item={activeItem}
              showOwner={view === 'all'}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <AddLectureDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelect={handleAddLecture}
        excludeIds={excludeIds}
      />

      <LectureDetailPanel
        lectureId={selectedLecture?.id ?? null}
        open={isPanelOpen}
        onClose={handleClosePanel}
        lecture={selectedLecture}
        onAddToBoard={handleAddToBoardFromPanel}
        addingToBoard={addingToBoard}
      />
    </div>
  )
}
