'use client'

import { cn } from '@/lib/utils'
import type { CampaignStats } from '@/app/actions/campaigns'

interface StatsBarProps {
  stats: CampaignStats
}

interface StatCardProps {
  label: string
  value: number
  variant?: 'default' | 'amber' | 'green'
}

function StatCard({ label, value, variant = 'default' }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex-1 min-w-[120px]',
        variant === 'default' && 'border-border/50 bg-card',
        variant === 'amber' &&
          'border-amber-200 bg-amber-50 text-amber-700',
        variant === 'green' &&
          'border-emerald-200 bg-emerald-50 text-emerald-700'
      )}
    >
      <p
        className={cn(
          'text-2xl font-bold',
          variant === 'default' && 'text-foreground',
          variant === 'amber' && 'text-amber-700',
          variant === 'green' && 'text-emerald-700'
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          'text-xs uppercase tracking-wider mt-1',
          variant === 'default' && 'text-muted-foreground',
          variant === 'amber' && 'text-amber-600',
          variant === 'green' && 'text-emerald-600'
        )}
      >
        {label}
      </p>
    </div>
  )
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <StatCard label="Curated" value={stats.curated} variant="default" />
      <StatCard label="Need someone" value={stats.needSomeone} variant="amber" />
      <StatCard label="Claimed" value={stats.claimed} variant="default" />
      <StatCard label="Emailed" value={stats.emailed} variant="default" />
      <StatCard label="Confirmed" value={stats.confirmed} variant="green" />
    </div>
  )
}
