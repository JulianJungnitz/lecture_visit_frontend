'use client'

import { useState, useEffect, useCallback } from 'react'
import { SidePanel } from '@/components/ui/side-panel'
import { Badge } from '@/components/ui/badge'
import { UniversityBadge } from '@/components/university-badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Mail, ExternalLink, Users, Clock, MapPin, Star, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Lecture, University, Professor, LectureSchedule, StudyProgram } from '@/types/database'

type LectureWithUniversity = Lecture & { university?: University | null }

type LectureDetails = {
  lecture: LectureWithUniversity
  professors: Professor[]
  schedules: LectureSchedule[]
  studyPrograms: (StudyProgram & { university: University })[]
}

type Props = {
  lectureId: string | null
  open: boolean
  onClose: () => void
  lecture?: LectureWithUniversity
  onAddToBoard?: (lecture: LectureWithUniversity) => void
  addingToBoard?: boolean
}

export function LectureDetailPanel({ lectureId, open, onClose, lecture, onAddToBoard, addingToBoard }: Props) {
  const [details, setDetails] = useState<LectureDetails | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchDetails = useCallback(async (id: string) => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Fetch lecture if not provided
      let lectureData = lecture
      if (!lectureData) {
        const { data } = await supabase
          .from('lectures')
          .select('*, university:universities(id, name, full_name, website)')
          .eq('id', id)
          .single()
        lectureData = data as LectureWithUniversity
      }

      // Fetch related data in parallel
      const [professorsRes, schedulesRes, programsRes] = await Promise.all([
        supabase
          .from('lecture_professors')
          .select('professor:professors(*)')
          .eq('lecture_id', id),
        supabase
          .from('lecture_schedules')
          .select('*')
          .eq('lecture_id', id),
        supabase
          .from('lecture_study_programs')
          .select('study_program:study_programs(*, university:universities(id, name))')
          .eq('lecture_id', id),
      ])

      const professors = (professorsRes.data?.map(l => (l as Record<string, unknown>).professor).filter(Boolean) ?? []) as unknown as Professor[]
      const schedules = (schedulesRes.data ?? []) as LectureSchedule[]
      const studyPrograms = (programsRes.data?.map(l => (l as Record<string, unknown>).study_program).filter(Boolean) ?? []) as unknown as (StudyProgram & { university: University })[]

      if (lectureData) {
        setDetails({ lecture: lectureData, professors, schedules, studyPrograms })
      }
    } catch (error) {
      console.error('Error fetching lecture details:', error)
    } finally {
      setLoading(false)
    }
  }, [lecture])

  useEffect(() => {
    if (open && lectureId) {
      fetchDetails(lectureId)
    } else if (!open) {
      // Clear details when closing
      setTimeout(() => setDetails(null), 300) // Wait for animation
    }
  }, [open, lectureId, fetchDetails])

  const lectureTitle = details?.lecture?.title || lecture?.title || 'Lecture Details'
  const showAddToBoard =
    !loading && details && !details.lecture.owner && onAddToBoard != null

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={lectureTitle}
      headerActions={
        showAddToBoard && details ? (
          <button
            type="button"
            onClick={() => onAddToBoard(details.lecture)}
            disabled={addingToBoard}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-black text-white hover:bg-black/90 transition-colors disabled:opacity-50"
          >
            {addingToBoard ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            Add to board
          </button>
        ) : undefined
      }
    >
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && details && (
        <div className="space-y-6">
          {/* Basic Info Section */}
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1">
                {details.lecture.university && (
                  <UniversityBadge
                    universityName={details.lecture.university.name}
                    className="mb-2"
                  />
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {details.lecture.lecture_type && (
                    <Badge variant="secondary">{details.lecture.lecture_type}</Badge>
                  )}
                  {details.lecture.semester && (
                    <Badge variant="outline">{details.lecture.semester}</Badge>
                  )}
                  {details.lecture.is_starred && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                </div>
              </div>
            </div>

            {details.lecture.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {details.lecture.description}
              </p>
            )}

            {details.lecture.source_url && (
              <a
                href={details.lecture.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                <ExternalLink className="h-3 w-3" />
                View on university website
              </a>
            )}
          </div>

          <Separator />

          {/* Professors Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Professors ({details.professors.length})</h3>
            </div>
            {details.professors.length > 0 ? (
              <div className="space-y-2">
                {details.professors.map((professor) => (
                  <div
                    key={professor.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium text-sm">
                      {professor.title} {professor.first_name} {professor.last_name}
                    </div>
                    {professor.department && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {professor.department}
                      </div>
                    )}
                    {professor.email && (
                      <a
                        href={`mailto:${professor.email}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                      >
                        <Mail className="h-3 w-3" />
                        {professor.email}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No professors assigned</p>
            )}
          </div>

          <Separator />

          {/* Schedule Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Schedule ({details.schedules.length})</h3>
            </div>
            {details.schedules.length > 0 ? (
              (() => {
                const hasFrequency = details.schedules.some((s) => s.frequency)
                const hasDateRange = details.schedules.some((s) => s.date_range)
                const hasLocation = details.schedules.some((s) => s.location)
                const hasRoomUrl = details.schedules.some((s) => s.room_url)
                return (
                  <div className="rounded-xl border border-black/[0.06] overflow-hidden">
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
                            <TableCell className="font-medium text-sm">
                              {schedule.day_time ?? '—'}
                            </TableCell>
                            {hasFrequency && (
                              <TableCell className="text-sm text-muted-foreground">
                                {schedule.frequency ?? '—'}
                              </TableCell>
                            )}
                            {hasDateRange && (
                              <TableCell className="text-sm text-muted-foreground">
                                {schedule.date_range ?? '—'}
                              </TableCell>
                            )}
                            {hasLocation && (
                              <TableCell className="text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
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
                )
              })()
            ) : (
              <p className="text-sm text-muted-foreground">No schedule information</p>
            )}
          </div>

          <Separator />

          {/* Study Programs Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Study Programs ({details.studyPrograms.length})</h3>
            </div>
            {details.studyPrograms.length > 0 ? (
              <div className="space-y-2">
                {details.studyPrograms.map((program) => (
                  <div
                    key={program.id}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="font-medium text-sm">{program.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {program.degree_type && (
                        <Badge variant="secondary" className="text-xs">
                          {program.degree_type}
                        </Badge>
                      )}
                      {program.university && (
                        <UniversityBadge
                          universityName={program.university.name}
                          className="text-xs"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No associated programs</p>
            )}
          </div>

          {/* Notes Section */}
          {details.lecture.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {details.lecture.notes}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </SidePanel>
  )
}