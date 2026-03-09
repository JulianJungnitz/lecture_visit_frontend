'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  closestCorners,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Plus, User, Users } from 'lucide-react'
import { KanbanColumn } from './kanban-column'
import { KanbanCard, type KanbanItem } from './kanban-card'
import { AddLectureDialog } from './add-lecture-dialog'
import type { Lecture, University } from '@/types/database'

type LectureWithUniversity = Lecture & { university?: University | null }

const STATUSES = ['Open', 'Contacted', 'Scheduled', 'Done', 'Declined'] as const
type Status = (typeof STATUSES)[number]

type Columns = Record<Status, KanbanItem[]>

const emptyColumns: Columns = {
  Open: [],
  Contacted: [],
  Scheduled: [],
  Done: [],
  Declined: [],
}

type Props = {
  lectures: LectureWithUniversity[]
}

export function KanbanBoard({ lectures }: Props) {
  const [columns, setColumns] = useState<Columns>(emptyColumns)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [view, setView] = useState<'personal' | 'all'>('personal')

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const excludeIds = useMemo(() => {
    const ids = new Set<string>()
    for (const items of Object.values(columns)) {
      for (const item of items) ids.add(item.lecture.id)
    }
    return ids
  }, [columns])

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
        const overIndex = overItems.findIndex((i) => i.id === over.id)
        const insertIndex = overIndex >= 0 ? overIndex : overItems.length

        overItems.splice(insertIndex, 0, moved)

        return { ...prev, [activeCol]: activeItems, [overCol]: overItems }
      })
    },
    [findColumn]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return

      const activeCol = findColumn(String(active.id))
      const overCol = findColumn(String(over.id))
      if (!activeCol || !overCol) return

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
    [findColumn]
  )

  const handleAddLecture = useCallback((lecture: LectureWithUniversity) => {
    const item: KanbanItem = {
      id: `kanban-${lecture.id}`,
      lecture,
    }
    setColumns((prev) => ({
      ...prev,
      Open: [...prev.Open, item],
    }))
  }, [])

  return (
    <div className="relative min-h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
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
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add lecture
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              id={status}
              title={status}
              items={columns[status]}
            />
          ))}
        </div>

      </DndContext>

      <AddLectureDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        lectures={lectures}
        onSelect={handleAddLecture}
        excludeIds={excludeIds}
      />
    </div>
  )
}
