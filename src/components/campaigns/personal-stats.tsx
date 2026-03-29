'use client'

import React from 'react'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import type { MemberStats, SerializableMilestone } from '@/lib/milestones'

interface PersonalStatsProps {
  stats: MemberStats | null
  earnedBadges: SerializableMilestone[]
}

function isZeroActivity(stats: MemberStats | null): boolean {
  return (
    stats === null ||
    (stats.claimed === 0 &&
      stats.emailed === 0 &&
      stats.confirmed === 0 &&
      stats.done === 0)
  )
}

export function PersonalStats({ stats, earnedBadges }: PersonalStatsProps) {
  const zeroActivity = isZeroActivity(stats)

  if (zeroActivity) {
    return (
      <Card className="border-l-2 border-l-emerald-400">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            You haven&apos;t claimed any lectures yet — head to the{' '}
            <strong className="text-foreground/70">Schedule</strong> page to get
            started.
          </p>
          {stats?.displayName && (
            <span className="text-sm text-muted-foreground shrink-0">
              {stats.displayName}
            </span>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card className="border-l-2 border-l-emerald-400">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Your Semester</CardTitle>
            {stats?.displayName && (
              <span className="text-sm text-muted-foreground shrink-0">
                {stats.displayName}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm',
                'bg-zinc-100 text-zinc-700'
              )}
            >
              <span className="font-semibold">{stats?.claimed ?? 0}</span>
              Claimed
            </span>

            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm border',
                'bg-amber-50 text-amber-700 border-amber-200'
              )}
            >
              <span className="font-semibold">{stats?.emailed ?? 0}</span>
              Emailed
            </span>

            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm border',
                'bg-emerald-50 text-emerald-700 border-emerald-200'
              )}
            >
              <span className="font-semibold">{stats?.confirmed ?? 0}</span>
              Confirmed
            </span>

            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm border',
                'bg-blue-50 text-blue-700 border-blue-200'
              )}
            >
              <span className="font-semibold">{stats?.done ?? 0}</span>
              Visited
            </span>
          </div>

          {earnedBadges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map((milestone) => {
                const IconComponent = LucideIcons[
                  milestone.icon as keyof typeof LucideIcons
                ] as React.ElementType

                return (
                  <Tooltip key={milestone.id}>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-default select-none items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/80">
                        {IconComponent && (
                          <IconComponent className="h-3.5 w-3.5 shrink-0" />
                        )}
                        {milestone.label}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{milestone.description}</TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
