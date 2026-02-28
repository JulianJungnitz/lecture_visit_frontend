import Link from 'next/link'
import { Mail, ExternalLink, MapPin, Calendar, Star, Users, BookOpen, Clock } from 'lucide-react'
import { UniversityBadge } from '@/components/university-badge'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Lecture, Professor, LectureSchedule, StudyProgram, University } from '@/types/database'

// Helper: format professor display name
function formatProfessorName(prof: Professor): string {
  const parts = [prof.title, prof.first_name, prof.last_name].filter(Boolean)
  return parts.join(' ')
}

// Helper: gender to salutation
function getSalutation(gender: Professor['gender']): string | null {
  if (gender === 'male') return 'Herr'
  if (gender === 'female') return 'Frau'
  return null
}

interface LectureDetailProps {
  lecture: Lecture & { university: University }
  professors: Professor[]
  schedules: LectureSchedule[]
  studyPrograms: (StudyProgram & { university: University })[]
}

export function LectureDetail({ lecture, professors, schedules, studyPrograms }: LectureDetailProps) {
  // Determine which schedule columns have any data
  const hasFrequency = schedules.some(s => s.frequency)
  const hasDateRange = schedules.some(s => s.date_range)
  const hasLocation = schedules.some(s => s.location)
  const hasRoomUrl = schedules.some(s => s.room_url)

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-start gap-3 mb-2">
          <h1 className="text-2xl font-semibold tracking-tight leading-tight">{lecture.title}</h1>
          {lecture.is_starred && (
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 mt-0.5 shrink-0" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <UniversityBadge universityName={lecture.university.name} />
          {lecture.lecture_type && (
            <Badge variant="secondary" className="text-xs">{lecture.lecture_type}</Badge>
          )}
          {lecture.semester && (
            <Badge variant="outline" className="text-xs">{lecture.semester}</Badge>
          )}
        </div>
        {lecture.description && (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{lecture.description}</p>
        )}
        {lecture.source_url && (
          <a
            href={lecture.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            View on university website
          </a>
        )}
        {lecture.notes && (
          <div className="mt-3 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
            {lecture.notes}
          </div>
        )}
      </div>

      <Separator />

      {/* Professors */}
      <section>
        <h2 className="flex items-center gap-2 text-base font-semibold mb-4">
          <Users className="h-4 w-4 text-muted-foreground" />
          Professors
          <span className="text-sm font-normal text-muted-foreground">({professors.length})</span>
        </h2>
        {professors.length === 0 ? (
          <EmptyState
            title="No professor information"
            description="No professor has been assigned to this lecture."
            icon={Users}
          />
        ) : (
          <div className="space-y-4">
            {professors.map(prof => {
              const salutation = getSalutation(prof.gender)
              return (
                <div key={prof.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        {salutation && (
                          <span className="text-xs text-muted-foreground">{salutation}</span>
                        )}
                        <span className="font-medium text-sm">{formatProfessorName(prof)}</span>
                      </div>
                      {prof.department && (
                        <p className="text-xs text-muted-foreground">{prof.department}</p>
                      )}
                    </div>
                    {prof.source_url && (
                      <a
                        href={prof.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Profile
                      </a>
                    )}
                  </div>
                  <div className="mt-2">
                    {prof.email ? (
                      <a
                        href={`mailto:${prof.email}`}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Mail className="h-3 w-3" />
                        {prof.email}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
                        <Mail className="h-3 w-3" />
                        No email available
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <Separator />

      {/* Schedule */}
      <section>
        <h2 className="flex items-center gap-2 text-base font-semibold mb-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Schedule
          <span className="text-sm font-normal text-muted-foreground">({schedules.length})</span>
        </h2>
        {schedules.length === 0 ? (
          <EmptyState
            title="No schedule information"
            description="No schedule has been added for this lecture."
            icon={Calendar}
          />
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
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
                {schedules.map(schedule => (
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
                        ) : '—'}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <Separator />

      {/* Associated Study Programs */}
      <section>
        <h2 className="flex items-center gap-2 text-base font-semibold mb-4">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          Study Programs
          <span className="text-sm font-normal text-muted-foreground">({studyPrograms.length})</span>
        </h2>
        {studyPrograms.length === 0 ? (
          <EmptyState
            title="Not assigned to any program"
            description="This lecture hasn't been linked to any study program."
            icon={BookOpen}
          />
        ) : (
          <div className="space-y-1">
            {studyPrograms.map(program => (
              <Link
                key={program.id}
                href={`/programs/${program.id}`}
                className="flex items-center gap-2 rounded-md px-3 py-2.5 hover:bg-accent transition-colors"
              >
                <span className="text-sm font-medium">{program.name}</span>
                <UniversityBadge universityName={program.university.name} />
                <Badge variant="secondary" className="text-xs ml-auto">{program.degree_type}</Badge>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
