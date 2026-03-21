'use client'

import { useState } from 'react'
import { Copy, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UniversityBadge } from '@/components/university-badge'
import { EmptyState } from '@/components/empty-state'
import { useToast } from '@/hooks/use-toast'
import { updateOutreachStatus, unclaimLecture } from '@/app/actions/campaigns'
import type { CampaignLecture } from '@/app/actions/campaigns'

type OutreachStatus = NonNullable<CampaignLecture['outreach_status']>

interface MyVisitsTabProps {
  lectures: CampaignLecture[]
}

const STATUS_BADGE: Record<
  OutreachStatus,
  { label: string; className: string }
> = {
  not_contacted: {
    label: 'Not contacted',
    className: 'bg-muted text-muted-foreground border-border',
  },
  emailed: {
    label: 'Emailed',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  declined: {
    label: 'Declined',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  done: {
    label: 'Done',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
}

function OutreachStatusBadge({ status }: { status: OutreachStatus }) {
  const config = STATUS_BADGE[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}

function getProfessorName(prof: CampaignLecture['professors'][number]) {
  return [prof.title, prof.first_name, prof.last_name].filter(Boolean).join(' ')
}

export function MyVisitsTab({ lectures: initialLectures }: MyVisitsTabProps) {
  const { toast } = useToast()
  const [lectures, setLectures] = useState(initialLectures)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  function setLoading(id: string, loading: boolean) {
    setLoadingIds((prev) => {
      const next = new Set(prev)
      if (loading) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function handleCopyEmail(email: string) {
    await navigator.clipboard.writeText(email)
    toast({ title: 'Email copied!' })
  }

  async function handleUnclaim(lectureId: string) {
    setLoading(lectureId, true)
    try {
      await unclaimLecture(lectureId)
      setLectures((prev) => prev.filter((l) => l.id !== lectureId))
      toast({ title: 'Visit unclaimed' })
    } catch (err) {
      toast({
        title: 'Failed to unclaim',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setLoading(lectureId, false)
    }
  }

  async function handleStatusUpdate(
    lectureId: string,
    status: 'emailed' | 'confirmed' | 'declined' | 'done'
  ) {
    setLoading(lectureId, true)
    try {
      await updateOutreachStatus(lectureId, status)
      setLectures((prev) =>
        prev.map((l) =>
          l.id === lectureId ? { ...l, outreach_status: status } : l
        )
      )
    } catch (err) {
      toast({
        title: 'Failed to update status',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setLoading(lectureId, false)
    }
  }

  if (lectures.length === 0) {
    return (
      <EmptyState
        title="No visits claimed"
        description="You haven't claimed any visits yet."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {lectures.map((lec) => {
        const status = lec.outreach_status ?? 'not_contacted'
        const isLoading = loadingIds.has(lec.id)
        const schedule = lec.schedules[0]
        const professor = lec.professors[0]
        const emailProfessor = lec.professors.find((p) => p.email)

        return (
          <div
            key={lec.id}
            className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-semibold text-sm">{lec.title}</p>
                {lec.university && (
                  <UniversityBadge universityName={lec.university.name} />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {professor && <span>{getProfessorName(professor)}</span>}
                {schedule?.day_time && <span>{schedule.day_time}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
              <OutreachStatusBadge status={status as OutreachStatus} />

              {emailProfessor?.email && (
                <button
                  onClick={() => handleCopyEmail(emailProfessor.email!)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  Copy email
                </button>
              )}

              {status === 'not_contacted' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(lec.id, 'emailed')}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 rounded-lg bg-foreground text-background px-3 py-1.5 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
                  >
                    {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                    Mark emailed
                  </button>
                  <button
                    onClick={() => handleUnclaim(lec.id)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-destructive text-destructive px-3 py-1.5 text-sm hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                    Unclaim
                  </button>
                </>
              )}

              {status === 'emailed' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(lec.id, 'confirmed')}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 px-3 py-1.5 text-sm hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  >
                    {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                    Mark confirmed
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(lec.id, 'declined')}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-red-50 text-red-700 px-3 py-1.5 text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                    Mark declined
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
