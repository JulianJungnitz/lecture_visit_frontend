import Link from 'next/link'
import { Mail, ExternalLink, Users, BookOpen, Building2, MessageSquare } from 'lucide-react'
import { UniversityBadge } from '@/components/university-badge'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Professor, Lecture, University } from '@/types/database'

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

type OutreachStatus = 'not_contacted' | 'emailed' | 'confirmed' | 'declined'

interface OutreachRecord {
  id: string
  semester: string
  outreach_status: OutreachStatus
  notes: string | null
  contacted_at: string | null
}

function outreachStatusColor(status: OutreachStatus): string {
  switch (status) {
    case 'not_contacted': return 'bg-gray-50 text-gray-600 border-gray-200'
    case 'emailed': return 'bg-blue-50 text-blue-600 border-blue-200'
    case 'confirmed': return 'bg-emerald-50 text-emerald-600 border-emerald-200'
    case 'declined': return 'bg-red-50 text-red-600 border-red-200'
  }
}

function outreachStatusLabel(status: OutreachStatus): string {
  switch (status) {
    case 'not_contacted': return 'Not contacted'
    case 'emailed': return 'Emailed'
    case 'confirmed': return 'Confirmed'
    case 'declined': return 'Declined'
  }
}

interface ProfessorDetailProps {
  professor: Professor & { university: University }
  lectures: (Lecture & { university: University })[]
  outreach: OutreachRecord[]
}

export function ProfessorDetail({ professor, lectures, outreach }: ProfessorDetailProps) {
  const salutation = getSalutation(professor.gender)

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-start gap-3 mb-2">
          <h1 className="text-2xl font-semibold tracking-tight leading-tight">
            {formatProfessorName(professor)}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <UniversityBadge universityName={professor.university.name} />
          {salutation && (
            <Badge variant="secondary" className="text-xs">{salutation}</Badge>
          )}
          {professor.department && (
            <Badge variant="outline" className="text-xs">{professor.department}</Badge>
          )}
        </div>

        {/* Contact info */}
        <div className="mt-3 space-y-1.5">
          {professor.email ? (
            <a
              href={`mailto:${professor.email}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              {professor.email}
            </a>
          ) : (
            <span className="text-sm text-muted-foreground/60 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              No email available
            </span>
          )}
          {professor.source_url && (
            <a
              href={professor.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              View on university website
            </a>
          )}
        </div>

        {professor.notes && (
          <div className="mt-3 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
            {professor.notes}
          </div>
        )}
      </div>

      <Separator />

      {/* Lectures */}
      <section>
        <h2 className="flex items-center gap-2 text-base font-semibold mb-4">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          Lectures
          <span className="text-sm font-normal text-muted-foreground">({lectures.length})</span>
        </h2>
        {lectures.length === 0 ? (
          <EmptyState
            title="No lectures found"
            description="This professor hasn't been assigned to any lectures."
            icon={BookOpen}
          />
        ) : (
          <div className="space-y-1">
            {lectures.map(lecture => (
              <Link
                key={lecture.id}
                href={`/lectures/${lecture.id}`}
                className="flex items-center gap-2 rounded-md px-3 py-2.5 hover:bg-accent transition-colors"
              >
                <span className="text-sm font-medium">{lecture.title}</span>
                <UniversityBadge universityName={lecture.university.name} />
                {lecture.lecture_type && (
                  <Badge variant="secondary" className="text-xs">{lecture.lecture_type}</Badge>
                )}
                {lecture.semester && (
                  <Badge variant="outline" className="text-xs ml-auto">{lecture.semester}</Badge>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Outreach History */}
      <section>
        <h2 className="flex items-center gap-2 text-base font-semibold mb-4">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          Outreach History
          <span className="text-sm font-normal text-muted-foreground">({outreach.length})</span>
        </h2>
        {outreach.length === 0 ? (
          <EmptyState
            title="No outreach records"
            description="No outreach has been recorded for this professor."
            icon={MessageSquare}
          />
        ) : (
          <div className="space-y-2">
            {outreach.map(record => (
              <div key={record.id} className="rounded-xl border border-black/[0.06] p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{record.semester}</Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs ${outreachStatusColor(record.outreach_status)}`}
                  >
                    {outreachStatusLabel(record.outreach_status)}
                  </Badge>
                  {record.contacted_at && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(record.contacted_at).toLocaleDateString('de-DE')}
                    </span>
                  )}
                </div>
                {record.notes && (
                  <p className="mt-2 text-xs text-muted-foreground">{record.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
