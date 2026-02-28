'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, FileText, BookOpen } from 'lucide-react'
import { UniversityBadge } from '@/components/university-badge'
import { SearchInput } from '@/components/search-input'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { StudyProgramWithDetails, Lecture } from '@/types/database'

interface ProgramDetailProps {
  program: StudyProgramWithDetails
  lectures: Lecture[]
}

export function ProgramDetail({ program, lectures }: ProgramDetailProps) {
  const [search, setSearch] = useState('')

  const filtered = lectures.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex gap-0 h-[calc(100vh-8rem)]">
      {/* Left panel: 60% */}
      <div className="flex flex-col w-[60%] border-r border-black/[0.06] pr-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold tracking-tight">{program.name}</h1>
            <UniversityBadge universityName={program.university.name} />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{program.degree_type}</Badge>
            {program.category && (
              <span className="text-xs text-muted-foreground">{program.category}</span>
            )}
            {program.faculty && (
              <span className="text-xs text-muted-foreground">· {program.faculty.name}</span>
            )}
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Lecture search */}
        <div className="mb-3">
          <SearchInput
            placeholder="Search lectures..."
            value={search}
            onChange={setSearch}
          />
        </div>

        <div className="text-xs text-muted-foreground mb-3">
          {filtered.length} {filtered.length === 1 ? 'lecture' : 'lectures'}
        </div>

        {/* Lecture list */}
        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <EmptyState
              title="No lectures found"
              description={search ? 'Try a different search term' : 'No lectures assigned to this program'}
              icon={BookOpen}
            />
          ) : (
            <div className="space-y-1 pr-4">
              {filtered.map(lecture => (
                <Link
                  key={lecture.id}
                  href={`/lectures/${lecture.id}`}
                  className="block rounded-lg px-3 py-2.5 hover:bg-black/[0.03] transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{lecture.title}</span>
                    {lecture.lecture_type && (
                      <Badge variant="outline" className="text-xs ml-2 shrink-0">
                        {lecture.lecture_type}
                      </Badge>
                    )}
                  </div>
                  {lecture.semester && (
                    <span className="text-xs text-muted-foreground">{lecture.semester}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right panel: 40% — PDF viewer */}
      <div className="flex flex-col w-[40%] pl-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">Curriculum Document</h2>
          {program.studienordnung_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={program.studienordnung_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Open in new tab
              </a>
            </Button>
          )}
        </div>

        <div className="flex-1 rounded-xl border border-black/[0.06] overflow-hidden bg-black/[0.01]">
          {program.studienordnung_url ? (
            <div className="h-full flex flex-col">
              <iframe
                src={program.studienordnung_url}
                className="flex-1 w-full"
                title="Curriculum document"
                onError={() => {/* silent — user can use open in new tab */}}
              />
              {/* Fallback shown below iframe in case it's blocked */}
              <div className="px-4 py-3 border-t border-border bg-background text-xs text-muted-foreground flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                <span>If the document doesn&apos;t load, use &quot;Open in new tab&quot; above.</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <EmptyState
                title="No curriculum document"
                description="No study regulations document is available for this program."
                icon={FileText}
              />
            </div>
          )}
        </div>

        {program.url && (
          <div className="mt-3">
            <a
              href={program.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              External program page
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
