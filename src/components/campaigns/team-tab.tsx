'use client'

import { cn } from '@/lib/utils'
import type { CampaignLecture } from '@/app/actions/campaigns'

type OutreachStatus = NonNullable<CampaignLecture['outreach_status']>

interface TeamTabProps {
  teamData: {
    profile: { id: string; display_name: string | null }
    lectures: CampaignLecture[]
  }[]
  totalMembers: number
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
        'inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium border',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}

export function TeamTab({ teamData, totalMembers }: TeamTabProps) {
  const sorted = [...teamData].sort(
    (a, b) => b.lectures.length - a.lectures.length
  )

  const unclaimed = totalMembers - teamData.length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sorted.map(({ profile, lectures }) => {
        const confirmed = lectures.filter(
          (l) => l.outreach_status === 'confirmed'
        ).length
        const emailed = lectures.filter(
          (l) => l.outreach_status === 'emailed'
        ).length

        return (
          <div
            key={profile.id}
            className="rounded-xl border border-border/50 bg-card p-4 flex flex-col gap-3"
          >
            <div>
              <p className="font-semibold text-sm">
                {profile.display_name ?? 'Unknown member'}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {lectures.length} claimed &middot; {confirmed} confirmed &middot; {emailed} emailed
              </p>
            </div>

            {lectures.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {lectures.map((lec) => (
                  <div
                    key={lec.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <p className="text-sm truncate flex-1">{lec.title}</p>
                    {lec.outreach_status && (
                      <OutreachStatusBadge
                        status={lec.outreach_status as OutreachStatus}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {unclaimed > 0 && (
        <div className="rounded-xl border border-dashed border-border p-4 flex items-center justify-center">
          <p className="text-sm text-muted-foreground italic text-center">
            {unclaimed} member{unclaimed !== 1 ? 's' : ''} haven&apos;t claimed yet
          </p>
        </div>
      )}
    </div>
  )
}
