'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { DashboardStats } from '@/app/actions/dashboard'

export interface GoalTrackerProps {
  stats: DashboardStats
  goal: number | null
  semester: string
}

type PipelineVariant = 'default' | 'blue' | 'amber' | 'emerald' | 'emerald-dark'

interface PipelineStatProps {
  label: string
  value: number
  variant?: PipelineVariant
}

function PipelineStat({ label, value, variant = 'default' }: PipelineStatProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex-1 min-w-[100px]',
        variant === 'default' && 'border-border/50 bg-card',
        variant === 'blue' && 'border-blue-200 bg-blue-50',
        variant === 'amber' && 'border-amber-200 bg-amber-50',
        variant === 'emerald' && 'border-emerald-200 bg-emerald-50',
        variant === 'emerald-dark' && 'border-emerald-300 bg-emerald-100'
      )}
    >
      <p
        className={cn(
          'text-2xl font-bold',
          variant === 'default' && 'text-foreground',
          variant === 'blue' && 'text-blue-700',
          variant === 'amber' && 'text-amber-700',
          variant === 'emerald' && 'text-emerald-700',
          variant === 'emerald-dark' && 'text-emerald-800'
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          'text-xs uppercase tracking-wider mt-1',
          variant === 'default' && 'text-muted-foreground',
          variant === 'blue' && 'text-blue-600',
          variant === 'amber' && 'text-amber-600',
          variant === 'emerald' && 'text-emerald-600',
          variant === 'emerald-dark' && 'text-emerald-700'
        )}
      >
        {label}
      </p>
    </div>
  )
}

export function GoalTracker({ stats, goal, semester }: GoalTrackerProps) {
  const achieved = stats.confirmed + stats.done
  const progressValue =
    goal !== null ? Math.min((achieved / goal) * 100, 100) : 0
  const goalReached = goal !== null && achieved >= goal

  const progressText =
    goal === null
      ? 'No semester goal set yet'
      : goalReached
        ? `Goal reached! ${achieved}/${goal}`
        : `${achieved} of ${goal} confirmed`

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-foreground leading-none">
          {semester} Campaign
        </h2>
        {goal !== null && (
          <span className="text-sm text-muted-foreground shrink-0">
            {goalReached
              ? `Goal reached! ${achieved}/${goal}`
              : `${achieved} of ${goal} lectures confirmed`}
          </span>
        )}
      </div>

      {goal !== null ? (
        <div className="space-y-1.5">
          <Progress
            value={progressValue}
            className="h-2.5 bg-emerald-100 [&>div]:bg-emerald-500"
          />
          <p className="text-xs text-muted-foreground">{progressText}</p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{progressText}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <PipelineStat label="Curated" value={stats.curated} variant="default" />
        <PipelineStat label="Claimed" value={stats.claimed} variant="blue" />
        <PipelineStat label="Emailed" value={stats.emailed} variant="amber" />
        <PipelineStat label="Confirmed" value={stats.confirmed} variant="emerald" />
        <PipelineStat label="Visited" value={stats.done} variant="emerald-dark" />
      </div>
    </Card>
  )
}

export function GoalTrackerSkeleton() {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-36" />
      </div>

      <div className="space-y-1.5">
        <Skeleton className="h-2.5 w-full rounded-full" />
        <Skeleton className="h-3.5 w-32" />
      </div>

      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] flex-1 min-w-[100px] rounded-xl" />
        ))}
      </div>
    </Card>
  )
}
