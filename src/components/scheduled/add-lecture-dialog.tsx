'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { UniversityBadge } from '@/components/university-badge'
import { X, Search, Plus, Mail, MapPin, ExternalLink, Clock, Users, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { addLectureToBoard } from '@/app/actions/lecture-board'
import type { Lecture, University, Professor, LectureSchedule, StudyProgram } from '@/types/database'

type LectureWithUniversity = Lecture & { university?: University | null }

type LectureDetails = {
  professors: Professor[]
  schedules: LectureSchedule[]
  studyPrograms: (StudyProgram & { university: University })[]
}

type Props = {
  open: boolean
  onClose: () => void
  lectures: LectureWithUniversity[]
  onSelect: (lecture: LectureWithUniversity) => void
  excludeIds: Set<string>
}

export function AddLectureDialog({ open, onClose, lectures, onSelect, excludeIds }: Props) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [details, setDetails] = useState<LectureDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [addingLecture, setAddingLecture] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setSearch('')
      setSelectedId(null)
      setDetails(null)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const fetchDetails = useCallback(async (lectureId: string) => {
    setLoadingDetails(true)
    setDetails(null)
    const supabase = createClient()

    const [professorsRes, schedulesRes, programsRes] = await Promise.all([
      supabase
        .from('lecture_professors')
        .select('professor:professors(*)')
        .eq('lecture_id', lectureId),
      supabase
        .from('lecture_schedules')
        .select('*')
        .eq('lecture_id', lectureId),
      supabase
        .from('lecture_study_programs')
        .select('study_program:study_programs(*, university:universities(id, name))')
        .eq('lecture_id', lectureId),
    ])

    const professors = (professorsRes.data?.map(l => (l as Record<string, unknown>).professor).filter(Boolean) ?? []) as unknown as Professor[]
    const schedules = (schedulesRes.data ?? []) as LectureSchedule[]
    const studyPrograms = (programsRes.data?.map(l => (l as Record<string, unknown>).study_program).filter(Boolean) ?? []) as unknown as (StudyProgram & { university: University })[]

    setDetails({ professors, schedules, studyPrograms })
    setLoadingDetails(false)
  }, [])

  const handleSelectLecture = useCallback((lectureId: string) => {
    if (selectedId === lectureId) {
      setSelectedId(null)
      setDetails(null)
    } else {
      setSelectedId(lectureId)
      fetchDetails(lectureId)
    }
  }, [selectedId, fetchDetails])

  const handleAddLecture = useCallback(async (lecture: LectureWithUniversity) => {
    try {
      setAddingLecture(true)
      await addLectureToBoard(lecture.id)
      onSelect(lecture) // Still call onSelect to update local state
      onClose()
    } catch (error) {
      console.error('Failed to add lecture to board:', error)
    } finally {
      setAddingLecture(false)
    }
  }, [onSelect, onClose])

  const filtered = useMemo(() => {
    const available = lectures.filter(l => !excludeIds.has(l.id))
    if (!search.trim()) return available.slice(0, 50)
    const q = search.toLowerCase()
    return available.filter(l => l.title.toLowerCase().includes(q)).slice(0, 50)
  }, [lectures, search, excludeIds])

  const selectedLecture = useMemo(() => {
    if (!selectedId) return null
    return lectures.find(l => l.id === selectedId) ?? null
  }, [selectedId, lectures])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center px-6 pt-[10vh]">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className={cn(
        'relative z-50 w-full rounded-xl border bg-background shadow-lg animate-fade-in-up flex transition-all duration-200 overflow-hidden',
        selectedId ? 'max-w-[1100px]' : 'max-w-2xl'
      )}>
        {/* Left panel: search + list */}
        <div className={cn('flex flex-col min-w-0 overflow-hidden', selectedId ? 'w-[520px] shrink-0 border-r' : 'w-full')}>
          <div className="flex items-center gap-2 border-b px-5 py-4">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lectures..."
              className="border-0 shadow-none focus-visible:ring-0 px-0 h-auto"
            />
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <ScrollArea className="max-h-[480px]">
            <div className={cn('p-3 divide-y divide-border/40', selectedId && 'pr-4')}>
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No lectures found</p>
              ) : (
                filtered.map((lecture) => (
                  <div
                    key={lecture.id}
                    className={cn(
                      'group flex items-start gap-2 w-full text-left px-3.5 py-3 text-sm transition-colors cursor-pointer',
                      selectedId === lecture.id ? 'bg-muted rounded-lg' : 'hover:bg-muted/50 rounded-lg'
                    )}
                    onClick={() => handleSelectLecture(lecture.id)}
                  >
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="font-medium overflow-hidden text-ellipsis whitespace-nowrap">{lecture.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {lecture.university && (
                          <UniversityBadge universityName={lecture.university.name} className="text-[10px] px-1.5 py-0" />
                        )}
                        {lecture.lecture_type && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {lecture.lecture_type}
                          </Badge>
                        )}
                        {lecture.semester && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {lecture.semester}
                          </Badge>
                        )}
                      </div>
                      {lecture.description && (
                        <p className="text-xs text-muted-foreground mt-1 overflow-hidden text-ellipsis whitespace-nowrap">
                          {lecture.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddLecture(lecture)
                      }}
                      disabled={addingLecture}
                      className="shrink-0 mt-0.5 p-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition-all disabled:opacity-50"
                      aria-label="Add to board"
                      title="Add to board"
                    >
                      {addingLecture ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right panel: detail view */}
        {selectedId && (
          <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b px-5 py-4 gap-3">
              <span className="text-sm font-medium truncate">Lecture details</span>
              <div className="flex items-center gap-2">
                {selectedLecture && (
                  <button
                    type="button"
                    onClick={() => handleAddLecture(selectedLecture)}
                    disabled={addingLecture}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-black text-white hover:bg-black/90 transition-colors disabled:opacity-50"
                  >
                    {addingLecture ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    Add to board
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setSelectedId(null); setDetails(null) }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Close detail"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <ScrollArea className="max-h-[480px]">
              <div className="p-5 space-y-5 overflow-hidden">
                {selectedLecture && (
                  <>
                    {/* Header */}
                    <div className="overflow-hidden">
                      <h3 className="text-base font-semibold leading-tight break-words">{selectedLecture.title}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {selectedLecture.university && (
                          <UniversityBadge universityName={selectedLecture.university.name} />
                        )}
                        {selectedLecture.lecture_type && (
                          <Badge variant="secondary" className="text-xs">{selectedLecture.lecture_type}</Badge>
                        )}
                        {selectedLecture.semester && (
                          <Badge variant="outline" className="text-xs">{selectedLecture.semester}</Badge>
                        )}
                      </div>
                      {selectedLecture.description && (
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed break-words">{selectedLecture.description}</p>
                      )}
                      {selectedLecture.source_url && (
                        <a
                          href={selectedLecture.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View on university website
                        </a>
                      )}
                      {selectedLecture.notes && (
                        <div className="mt-2 p-2.5 rounded-md bg-muted/50 text-xs text-muted-foreground break-words">
                          {selectedLecture.notes}
                        </div>
                      )}
                    </div>

                    {/* Details loading / content */}
                    {loadingDetails ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : details ? (
                      <>
                        {/* Professors */}
                        {details.professors.length > 0 && (
                          <div>
                            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              <Users className="h-3.5 w-3.5" />
                              Professors ({details.professors.length})
                            </h4>
                            <div className="space-y-1.5">
                              {details.professors.map(prof => (
                                <div key={prof.id} className="rounded-lg border p-2.5 overflow-hidden">
                                  <p className="text-sm font-medium truncate">
                                    {[prof.title, prof.first_name, prof.last_name].filter(Boolean).join(' ')}
                                  </p>
                                  {prof.department && (
                                    <p className="text-xs text-muted-foreground truncate">{prof.department}</p>
                                  )}
                                  {prof.email && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                                      <Mail className="h-3 w-3 shrink-0" />
                                      <span className="truncate">{prof.email}</span>
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Schedules */}
                        {details.schedules.length > 0 && (
                          <div>
                            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              <Clock className="h-3.5 w-3.5" />
                              Schedule ({details.schedules.length})
                            </h4>
                            <div className="space-y-1.5">
                              {details.schedules.map(schedule => (
                                <div key={schedule.id} className="rounded-lg border p-2.5 text-sm overflow-hidden">
                                  {schedule.day_time && (
                                    <p className="font-medium truncate">{schedule.day_time}</p>
                                  )}
                                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                                    {schedule.frequency && <span>{schedule.frequency}</span>}
                                    {schedule.date_range && <span>{schedule.date_range}</span>}
                                    {schedule.location && (
                                      <span className="flex items-center gap-0.5">
                                        <MapPin className="h-3 w-3" />
                                        {schedule.location}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Study Programs */}
                        {details.studyPrograms.length > 0 && (
                          <div>
                            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Study Programs ({details.studyPrograms.length})
                            </h4>
                            <div className="space-y-1">
                              {details.studyPrograms.map(program => (
                                <div key={program.id} className="flex items-center gap-2 text-sm px-2.5 py-1.5 rounded-md min-w-0">
                                  <span className="font-medium truncate min-w-0">{program.name}</span>
                                  <Badge variant="secondary" className="text-[10px] shrink-0">{program.degree_type}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Empty state when no extra details */}
                        {details.professors.length === 0 && details.schedules.length === 0 && details.studyPrograms.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">No additional details available</p>
                        )}
                      </>
                    ) : null}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
