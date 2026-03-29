'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { UniversityBadge } from '@/components/university-badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiFilterSelect } from '@/components/multi-filter-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { X, Search, Plus, Loader2, Mail, ExternalLink, Clock, Users, MapPin, Star, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { addLectureToBoard } from '@/app/actions/lecture-board'
import {
  getAddLectureFilterOptions,
  searchLecturesForBoard,
  type LectureWithUniversity,
  type AddLectureFilterOptions,
} from '@/app/actions/search-lectures'
import type { Professor, LectureSchedule, StudyProgram, University } from '@/types/database'

type LectureDetails = {
  professors: Professor[]
  schedules: LectureSchedule[]
  studyPrograms: (StudyProgram & { university: University })[]
}

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (lecture: LectureWithUniversity) => void
  excludeIds: Set<string>
}

const TITLE_DEBOUNCE_MS = 300
const SEARCH_LIMIT = 50

export function AddLectureDialog({
  open,
  onClose,
  onSelect,
  excludeIds,
}: Props) {
  const [titleSearch, setTitleSearch] = useState('')
  const [titleDebounced, setTitleDebounced] = useState('')
  const [locationFilter, setLocationFilter] = useState<string>('')
  const [dayFilter, setDayFilter] = useState<string>('')
  const [universityId, setUniversityId] = useState<string>('')
  const [starredFilter, setStarredFilter] = useState<'all' | 'starred'>('starred')
  const [lecturesOnly, setLecturesOnly] = useState(true)
  const [studyProgramNames, setStudyProgramNames] = useState<string[]>([])
  const [results, setResults] = useState<LectureWithUniversity[]>([])
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [filterOptions, setFilterOptions] = useState<AddLectureFilterOptions | null>(null)
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [details, setDetails] = useState<LectureDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [ready, setReady] = useState(false)
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchDetails = useCallback(async (lectureId: string) => {
    setLoadingDetails(true)
    setDetails(null)
    const supabase = createClient()
    const [professorsRes, schedulesRes, programsRes] = await Promise.all([
      supabase.from('lecture_professors').select('professor:professors(*)').eq('lecture_id', lectureId),
      supabase.from('lecture_schedules').select('*').eq('lecture_id', lectureId),
      supabase.from('lecture_study_programs').select('study_program:study_programs(*, university:universities(id, name))').eq('lecture_id', lectureId),
    ])
    const professors = (professorsRes.data?.map((l) => (l as Record<string, unknown>).professor).filter(Boolean) ?? []) as unknown as Professor[]
    const schedules = (schedulesRes.data ?? []) as LectureSchedule[]
    const studyPrograms = (programsRes.data?.map((l) => (l as Record<string, unknown>).study_program).filter(Boolean) ?? []) as unknown as (StudyProgram & { university: University })[]
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

  // Debounce title for search
  useEffect(() => {
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current)
    titleDebounceRef.current = setTimeout(() => {
      setTitleDebounced(titleSearch)
    }, TITLE_DEBOUNCE_MS)
    return () => {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current)
    }
  }, [titleSearch])

  // Combined initialization: reset state + load filter options (fixes race condition)
  useEffect(() => {
    if (!open) {
      setReady(false)
      return
    }

    let cancelled = false

    setTitleSearch('')
    setTitleDebounced('')
    setLocationFilter('')
    setDayFilter('')
    setUniversityId('')
    setStarredFilter('starred')
    setLecturesOnly(true)
    setStudyProgramNames([])
    setSelectedId(null)
    setDetails(null)
    setReady(false)
    setTimeout(() => inputRef.current?.focus(), 0)

    if (filterOptions) {
      setReady(true)
    } else {
      setFilterOptionsLoading(true)
      getAddLectureFilterOptions()
        .then((opts) => {
          if (cancelled) return
          setFilterOptions(opts)
          setReady(true)
        })
        .finally(() => {
          if (!cancelled) setFilterOptionsLoading(false)
        })
    }

    return () => { cancelled = true }
  }, [open])

  // Run search when filters or excludeIds change
  const runSearch = useCallback(async () => {
    if (!open) return
    setLoading(true)
    const studyProgramIds =
      filterOptions != null && studyProgramNames.length > 0
        ? studyProgramNames
            .map((name) => filterOptions.studyPrograms.find((p) => p.name === name)?.id)
            .filter((id): id is string => id != null)
        : undefined
    const isStarred = starredFilter === 'starred' ? true : undefined
    let lectureTypes: string[] | undefined = undefined
    if (lecturesOnly && filterOptions) {
      const onlyTypes = filterOptions.lectureTypes.filter((t) => /vorlesung|lecture/i.test(t))
      if (onlyTypes.length > 0) {
        lectureTypes = onlyTypes
      }
    }

    try {
      const data = await searchLecturesForBoard({
        title: titleDebounced.trim() || undefined,
        location: locationFilter.trim() || undefined,
        dayOfWeek: dayFilter.trim() || undefined,
        universityIds: universityId.trim() ? [universityId] : undefined,
        studyProgramIds,
        isStarred,
        lectureTypes,
        excludeIds: Array.from(excludeIds),
        limit: SEARCH_LIMIT,
      })
      setResults(data)
    } finally {
      setLoading(false)
    }
  }, [
    open,
    titleDebounced,
    locationFilter,
    dayFilter,
    universityId,
    starredFilter,
    lecturesOnly,
    studyProgramNames,
    filterOptions,
    excludeIds,
  ])

  useEffect(() => {
    if (!open || !ready) return
    runSearch()
  }, [open, ready, runSearch])

  const selectedLecture = results.find((l) => l.id === selectedId) ?? null

  const handleAddLecture = useCallback(
    async (lecture: LectureWithUniversity) => {
      try {
        setAddingId(lecture.id)
        await addLectureToBoard(lecture.id)
        onSelect(lecture)
        setResults((prev) => prev.filter((l) => l.id !== lecture.id))
      } catch (error) {
        console.error('Failed to add lecture to board:', error)
      } finally {
        setAddingId(null)
      }
    },
    [onSelect]
  )

  if (!open) return null

  const studyProgramOptions =
    filterOptions?.studyPrograms.map((p) => p.name) ?? []

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center px-6 pt-[8vh] pb-[8vh]">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        className={cn(
          'relative z-50 w-full h-[calc(84vh)] rounded-2xl border border-border/70 bg-background shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] animate-fade-in-up flex transition-all duration-200 overflow-hidden',
          selectedId ? 'max-w-7xl flex-row' : 'max-w-5xl flex-col'
        )}
      >
        {/* Left: header + filters + list */}
        <div className={cn('flex flex-col min-w-0 overflow-hidden', selectedId && 'w-[min(640px,100%)] shrink-0 border-r border-border/60')}>
          {/* Minimal variant: clear header and subtitle */}
          <div className="border-b border-border/60 px-5 pt-5 pb-4 pr-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Add lectures</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Find and coordinate university lecture visits.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg p-2 -mt-1 shrink-0 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex items-center h-9 gap-2 flex-1 min-w-[140px] max-w-full">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={titleSearch}
                  onChange={(e) => setTitleSearch(e.target.value)}
                  placeholder="Search by title..."
                  className="h-9 flex-1 min-w-0 border-border/70 bg-muted/30 focus:bg-background rounded-lg text-sm"
                />
              </div>
              <Select
                value={locationFilter || '__none__'}
                onValueChange={(v) => setLocationFilter(v === '__none__' ? '' : v)}
              >
                <SelectTrigger className="w-[8rem] h-9 text-sm shrink-0 border-border/70 bg-muted/30 rounded-lg">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">All locations</SelectItem>
                  {(filterOptions?.locations ?? []).map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={dayFilter || '__none__'}
                onValueChange={(v) => setDayFilter(v === '__none__' ? '' : v)}
              >
                <SelectTrigger className="w-[8.5rem] h-9 text-sm shrink-0 border-border/70 bg-muted/30 rounded-lg">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">All days</SelectItem>
                  {(filterOptions?.days ?? []).map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={universityId || '__none__'}
                onValueChange={(v) => setUniversityId(v === '__none__' ? '' : v)}
              >
                <SelectTrigger className="w-[10rem] h-9 text-sm shrink-0 border-border/70 bg-muted/30 rounded-lg">
                  <SelectValue placeholder="University" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">All universities</SelectItem>
                  {(filterOptions?.universities ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <MultiFilterSelect
                label="Study program"
                options={studyProgramOptions}
                selected={studyProgramNames}
                onChange={setStudyProgramNames}
                className="w-[11rem] shrink-0 [&_button]:border-border/70 [&_button]:bg-muted/30 [&_button]:rounded-lg"
              />
              <Button
                variant={starredFilter === 'starred' ? 'default' : 'outline'}
                size="sm"
                className="h-9 px-3"
                onClick={() => setStarredFilter((prev) => prev === 'starred' ? 'all' : 'starred')}
                title={starredFilter === 'starred' ? 'Show all lectures' : 'Show starred only'}
              >
                <Star className={`h-4 w-4${starredFilter === 'starred' ? ' fill-current' : ''}`} />
              </Button>
              <Button
                variant={lecturesOnly ? 'default' : 'outline'}
                size="sm"
                className="h-9 px-3"
                onClick={() => setLecturesOnly((prev) => !prev)}
                title={lecturesOnly ? 'Show all types' : 'Show lectures only'}
              >
                <BookOpen className="h-4 w-4 mr-1" />
                Lectures only
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 py-2 divide-y divide-border/50">
              {filterOptionsLoading && results.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : loading && results.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : results.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No lectures found. Try changing filters.
                </p>
              ) : (
                results.map((lecture) => (
                  <div
                    key={lecture.id}
                    className={cn(
                      'group flex items-start gap-3 w-full text-left px-4 py-4 text-sm transition-colors cursor-pointer rounded-xl hover:bg-muted/40',
                      selectedId === lecture.id && 'bg-muted/50'
                    )}
                    onClick={() => handleSelectLecture(lecture.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">
                        {[lecture.university?.name, lecture.lecture_type, lecture.semester].filter(Boolean).join(' · ')}
                      </p>
                      <p className="font-semibold text-foreground line-clamp-2 break-words leading-snug">
                        {lecture.title}
                      </p>
                      {lecture.description && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3 break-words leading-relaxed">
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
                      disabled={addingId != null}
                      className="shrink-0 self-center px-3 py-1.5 rounded-lg text-xs font-medium bg-foreground text-background hover:bg-foreground/90 opacity-100 transition-all disabled:opacity-50 flex items-center gap-1.5"
                      aria-label="Add to board"
                      title="Add to board"
                    >
                      {addingId === lecture.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right: detail sidebar inside popup (minimal variant) */}
        {selectedId && (
          <div className="flex-1 min-w-0 flex flex-col border-l border-border/60 bg-muted/20 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4 shrink-0 bg-background min-w-0">
              <span className="text-sm font-medium text-muted-foreground truncate min-w-0">Lecture details</span>
              <div className="flex items-center gap-2 shrink-0">
                {selectedLecture && (
                  <button
                    type="button"
                    onClick={() => handleAddLecture(selectedLecture)}
                    disabled={addingId != null}
                    className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
                  >
                    {addingId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Add this lecture to board
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null)
                    setDetails(null)
                  }}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg p-2 transition-colors"
                  aria-label="Close detail"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
              <div className="px-4 py-2 space-y-3 min-w-0">
                {selectedLecture && (
                  <>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-semibold leading-tight break-words text-foreground">
                        {selectedLecture.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {selectedLecture.university && (
                          <UniversityBadge universityName={selectedLecture.university.name} />
                        )}
                        {selectedLecture.lecture_type && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {selectedLecture.lecture_type}
                          </Badge>
                        )}
                        {selectedLecture.semester && (
                          <Badge variant="outline" className="text-xs font-normal">
                            {selectedLecture.semester}
                          </Badge>
                        )}
                      </div>
                      {selectedLecture.description && (
                        <p className="text-sm text-muted-foreground leading-snug break-words">
                          {selectedLecture.description}
                        </p>
                      )}
                      {selectedLecture.source_url && (
                        <a
                          href={selectedLecture.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View on university website
                        </a>
                      )}
                    </div>

                    {loadingDetails ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : details ? (
                      <>
                        <Separator className="bg-border/60" />
                        {details.professors.length > 0 && (
                          <div className="space-y-1.5">
                            <h4 className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              <Users className="h-3.5 w-3.5" />
                              Professors
                            </h4>
                            <div className="space-y-1.5 min-w-0">
                              {details.professors.map((prof) => (
                                <div key={prof.id} className="rounded-lg border border-border/50 bg-background/80 px-3 py-2 text-sm min-w-0 overflow-hidden">
                                  <p className="font-medium text-foreground break-words">
                                    {[prof.title, prof.first_name, prof.last_name].filter(Boolean).join(' ')}
                                  </p>
                                  {prof.department && (
                                    <p className="text-xs text-muted-foreground mt-0.5 break-words">{prof.department}</p>
                                  )}
                                  {prof.email && (
                                    <p className="text-xs text-muted-foreground flex items-start gap-1.5 mt-1 min-w-0">
                                      <Mail className="h-3 w-3 shrink-0 mt-0.5" />
                                      <span className="break-all min-w-0">{prof.email}</span>
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {details.schedules.length > 0 && (() => {
                          const hasFrequency = details.schedules.some((s) => s.frequency)
                          const hasDateRange = details.schedules.some((s) => s.date_range)
                          const hasLocation = details.schedules.some((s) => s.location)
                          const hasRoomUrl = details.schedules.some((s) => s.room_url)
                          return (
                            <div className="space-y-1.5">
                              <h4 className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                <Clock className="h-3.5 w-3.5" />
                                Schedule
                              </h4>
                              <div className="rounded-lg border border-border/50 overflow-hidden bg-background/80 min-w-0">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Day &amp; Time</TableHead>
                                      {hasFrequency && <TableHead>Frequency</TableHead>}
                                      {hasDateRange && <TableHead>Date Range</TableHead>}
                                      {hasLocation && <TableHead>Location</TableHead>}
                                      {hasRoomUrl && <TableHead>Room</TableHead>}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {details.schedules.map((schedule) => (
                                      <TableRow key={schedule.id}>
                                        <TableCell className="font-medium text-sm min-w-0 break-words">
                                          {schedule.day_time ?? '—'}
                                        </TableCell>
                                        {hasFrequency && (
                                          <TableCell className="text-sm text-muted-foreground min-w-0 break-words">
                                            {schedule.frequency ?? '—'}
                                          </TableCell>
                                        )}
                                        {hasDateRange && (
                                          <TableCell className="text-sm text-muted-foreground min-w-0 break-words">
                                            {schedule.date_range ?? '—'}
                                          </TableCell>
                                        )}
                                        {hasLocation && (
                                          <TableCell className="text-sm text-muted-foreground min-w-0">
                                            <span className="flex items-center gap-1 break-words">
                                              <MapPin className="h-3 w-3 shrink-0" />
                                              {schedule.location ?? '—'}
                                            </span>
                                          </TableCell>
                                        )}
                                        {hasRoomUrl && (
                                          <TableCell className="text-sm">
                                            {schedule.room_url ? (
                                              <a
                                                href={schedule.room_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                              >
                                                <ExternalLink className="h-3 w-3" />
                                                Room
                                              </a>
                                            ) : (
                                              '—'
                                            )}
                                          </TableCell>
                                        )}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )
                        })()}

                        {details.studyPrograms.length > 0 && (
                          <div className="space-y-1.5">
                            <h4 className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Study programs
                            </h4>
                            <div className="space-y-1.5 min-w-0">
                              {details.studyPrograms.map((program) => (
                                <div
                                  key={program.id}
                                  className="flex items-start gap-2 text-sm px-3 py-2 rounded-lg border border-border/50 bg-background/80 min-w-0"
                                >
                                  <span className="font-medium min-w-0 text-foreground break-words flex-1">{program.name}</span>
                                  <Badge variant="secondary" className="text-[10px] font-normal shrink-0">
                                    {program.degree_type}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
