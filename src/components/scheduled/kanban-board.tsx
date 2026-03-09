'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Plus, User, Users } from 'lucide-react'
import { KanbanColumn } from './kanban-column'
import { KanbanCard, type KanbanItem } from './kanban-card'
import { AddLectureDialog } from './add-lecture-dialog'
import { LectureDetailPanel } from './lecture-detail-panel'
import { updateLectureStatus } from '@/app/actions/lecture-board'
import type { Lecture, University, Profile, OutreachStatus } from '@/types/database'

type LectureWithUniversityAndOwner = Lecture & {
  university?: University | null
  owner_profile?: Profile | null
}

// UI column names
const STATUSES = ['Not Contacted', 'Emailed', 'Confirmed', 'Declined', 'Done'] as const
type Status = (typeof STATUSES)[number]

// Map between UI column names and database enum values
const statusToDbEnum: Record<Status, OutreachStatus> = {
  'Not Contacted': 'not_contacted',
  'Emailed': 'emailed',
  'Confirmed': 'confirmed',
  'Declined': 'declined',
  'Done': 'done'
}

// Map from database enum to UI column names
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

export function KanbanBoard({ lectures, currentUserId }: Props) {
  const [columns, setColumns] = useState<Columns>(emptyColumns)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [view, setView] = useState<'personal' | 'all'>('personal')
  const [selectedLecture, setSelectedLecture] = useState<LectureWithUniversityAndOwner | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Initialize columns from lectures based on their outreach_status
  useEffect(() => {
    const newColumns: Columns = {
      'Not Contacted': [],
      'Emailed': [],
      'Confirmed': [],
      'Declined': [],
      'Done': [],
    }

    // Filter lectures that have owners
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
    // Exclude all lectures that have an owner (are already on someone's board)
    lectures.forEach(lecture => {
      if (lecture.owner) {
        ids.add(lecture.id)
      }
    })
    return ids
  }, [lectures])

  // Filter columns based on view
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
      // Check if id is a column id
      if (STATUSES.includes(id as Status)) return id as Status
      // Find which column contains this item
      for (const status of STATUSES) {
        if (columns[status].some((item) => item.id === id)) return status
      }
      return undefined
    },
    [columns]
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

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

        // Update the local state immediately for responsiveness
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
      setActiveId(null)
      const { active, over } = event
      if (!over) return

      const activeCol = findColumn(String(active.id))
      const overCol = findColumn(String(over.id))
      if (!activeCol || !overCol) return

      // Find the lecture that was dragged
      const draggedItem = columns[activeCol].find(item => item.id === active.id)
      if (!draggedItem) return

      // Extract lecture ID from the kanban item ID (format: "kanban-{lecture.id}")
      const lectureId = draggedItem.lecture.id

      // If moved to a different column, update the status in the database
      if (activeCol !== overCol) {
        try {
          const dbStatus = statusToDbEnum[overCol]
          await updateLectureStatus(lectureId, dbStatus)
        } catch (error) {
          console.error('Failed to update lecture status:', error)
          // Optionally revert the UI change here
          return
        }
      }

      if (activeCol === overCol) {
        setColumns((prev) => {
          const items = [...prev[activeCol]]
          const oldIndex = items.findIndex((i) => i.id === active.id)
          const newIndex = items.findIndex((i) => i.id === over.id)
          if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev
          return { ...prev, [activeCol]: arrayMove(items, oldIndex, newIndex) }
        })
      }
    },
    [findColumn, columns]
  )

  const handleAddLecture = useCallback((lecture: LectureWithUniversityAndOwner) => {
    // This is called after the server action has already set the owner
    // We just need to update the local state to show the lecture on the board
    const lectureWithUpdates = {
      ...lecture,
      owner: currentUserId || lecture.owner,
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

  const handleCardClick = useCallback((item: KanbanItem) => {
    setSelectedLecture(item.lecture)
    setIsPanelOpen(true)
  }, [])

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false)
    // Clear selected lecture after animation
    setTimeout(() => setSelectedLecture(null), 300)
  }, [])

  // Find the active item being dragged
  const activeItem = useMemo(() => {
    if (!activeId) return null
    for (const status of STATUSES) {
      const item = columns[status].find((item) => item.id === activeId)
      if (item) return item
    }
    return null
  }, [activeId, columns])

  return (
    <div className="relative flex flex-col h-[calc(100vh-7rem)]">
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
              showOwner={view === 'all'}
            />
          ))}
        </div>

        <DragOverlay
          dropAnimation={null}
          style={{
            cursor: 'grabbing',
          }}
        >
          {activeItem ? (
            <KanbanCard
              item={activeItem}
              showOwner={view === 'all'}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <AddLectureDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        lectures={lectures}
        onSelect={handleAddLecture}
        excludeIds={excludeIds}
      />

      <LectureDetailPanel
        lectureId={selectedLecture?.id ?? null}
        open={isPanelOpen}
        onClose={handleClosePanel}
        lecture={selectedLecture}
      />
    </div>
  )
}
