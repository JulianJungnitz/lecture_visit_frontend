'use client'

import { useState } from 'react'
import { AlertTriangle, Clock, Copy, ExternalLink, Loader2, Mail, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UniversityBadge } from '@/components/university-badge'
import { EmptyState } from '@/components/empty-state'
import { useToast } from '@/hooks/use-toast'
import { claimLecture } from '@/app/actions/campaigns'
import type { CampaignLecture, ProfessorDedupWarning } from '@/app/actions/campaigns'

const DAY_OPTIONS = [
  { label: 'Monday', value: 'Mo' },
  { label: 'Tuesday', value: 'Di' },
  { label: 'Wednesday', value: 'Mi' },
  { label: 'Thursday', value: 'Do' },
  { label: 'Friday', value: 'Fr' },
]

interface AvailableTabProps {
  lectures: CampaignLecture[]
  universities: { id: string; name: string }[]
  currentUserId?: string
  dedupWarnings: Record<string, ProfessorDedupWarning[]>
}

function getProfessorDisplayName(prof: CampaignLecture['professors'][number]) {
  const parts = [prof.title, prof.first_name, prof.last_name].filter(Boolean)
  return parts.join(' ')
}

export function AvailableTab({
  lectures,
  universities,
  dedupWarnings,
}: AvailableTabProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [universityFilter, setUniversityFilter] = useState('all')
  const [dayFilter, setDayFilter] = useState('all')
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set())
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set())

  const filtered = lectures.filter((lec) => {
    if (claimedIds.has(lec.id)) return false
    if (search.trim()) {
      if (!lec.title.toLowerCase().includes(search.toLowerCase())) return false
    }
    if (universityFilter !== 'all') {
      if (lec.university?.id !== universityFilter) return false
    }
    if (dayFilter !== 'all') {
      const hasDayMatch = lec.schedules.some((s) =>
        s.day_time?.startsWith(dayFilter)
      )
      if (!hasDayMatch) return false
    }
    return true
  })

  async function handleClaim(lectureId: string) {
    setClaimingIds((prev) => new Set(prev).add(lectureId))
    try {
      await claimLecture(lectureId)
      setClaimedIds((prev) => new Set(prev).add(lectureId))
      toast({ title: 'Visit claimed!' })
    } catch (err) {
      toast({
        title: 'Failed to claim visit',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setClaimingIds((prev) => {
        const next = new Set(prev)
        next.delete(lectureId)
        return next
      })
    }
  }

  async function handleCopyEmail(email: string) {
    await navigator.clipboard.writeText(email)
    toast({ title: 'Email copied!' })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search lectures..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={universityFilter} onValueChange={setUniversityFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="University" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All universities</SelectItem>
            {universities.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dayFilter} onValueChange={setDayFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All days</SelectItem>
            {DAY_OPTIONS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No available lectures"
          description="No available lectures match your filters."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lec) => {
            const warnings = dedupWarnings[lec.id] ?? []
            const isClaiming = claimingIds.has(lec.id)
            const schedule = lec.schedules[0]
            const program = lec.study_programs[0]

            return (
              <div
                key={lec.id}
                className="rounded-xl border border-border/50 bg-card p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm leading-snug flex-1">
                    {lec.title}
                  </p>
                  {lec.university && (
                    <UniversityBadge universityName={lec.university.name} />
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  {schedule?.day_time && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      {schedule.day_time}
                    </span>
                  )}
                  {schedule?.location && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {schedule.location}
                    </span>
                  )}
                  {program?.name && (
                    <span className="text-xs text-muted-foreground">
                      {program.name}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {lec.professors.map((prof) => (
                    <div
                      key={prof.id}
                      className="flex items-start justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {getProfessorDisplayName(prof)}
                        </p>
                        {prof.email ? (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="h-2.5 w-2.5 shrink-0" />
                            {prof.email}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            No email on file
                            {prof.source_url && (
                              <a
                                href={prof.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-muted-foreground hover:text-foreground"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </span>
                        )}
                      </div>
                      {prof.email && (
                        <button
                          onClick={() => handleCopyEmail(prof.email!)}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {warnings.length > 0 && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 flex gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      {warnings.map((w, i) => (
                        <p key={i} className="text-xs text-amber-700">
                          <span className="font-medium">{w.professorName}</span> already
                          in &ldquo;{w.otherLectureTitle}&rdquo;
                          {w.claimedByName && (
                            <> (by {w.claimedByName})</>
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleClaim(lec.id)}
                  disabled={isClaiming}
                  className={cn(
                    'mt-auto w-full rounded-lg py-2 text-sm font-medium transition-colors',
                    'bg-foreground text-background hover:bg-foreground/90',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'flex items-center justify-center gap-2'
                  )}
                >
                  {isClaiming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Claim this visit
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
