'use client'

import { useState } from 'react'
import * as React from 'react'
import * as LucideIcons from 'lucide-react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import type { RankedMember } from '@/lib/leaderboard'
import type { SerializableMilestone } from '@/lib/milestones'

function getAvatarColor(name: string | null): string {
  const COLORS = [
    'bg-blue-200',
    'bg-emerald-200',
    'bg-amber-200',
    'bg-purple-200',
    'bg-rose-200',
    'bg-cyan-200',
  ]
  if (!name) return COLORS[0]
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return COLORS[hash % COLORS.length]
}

function getInitials(name: string | null): string {
  if (!name) return 'M'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

type SortKey = 'displayName' | 'claimed' | 'emailed' | 'confirmed' | 'done'
type SortDir = 'asc' | 'desc'

interface TeamListProps {
  members: RankedMember[]
  badgesByMember: Map<string, SerializableMilestone[]>
}

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return null
  return dir === 'asc' ? (
    <ChevronUp className="h-3.5 w-3.5 ml-1 shrink-0" />
  ) : (
    <ChevronDown className="h-3.5 w-3.5 ml-1 shrink-0" />
  )
}

interface SortableHeadProps {
  label: string
  sortKey: SortKey
  activeSortKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
  className?: string
}

function SortableHead({
  label,
  sortKey,
  activeSortKey,
  sortDir,
  onSort,
  className,
}: SortableHeadProps) {
  const isActive = activeSortKey === sortKey
  return (
    <TableHead
      className={`cursor-pointer select-none hover:text-foreground transition-colors ${className ?? ''}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center">
        {label}
        <SortIndicator active={isActive} dir={sortDir} />
      </span>
    </TableHead>
  )
}

function BadgeIcons({ badges }: { badges: SerializableMilestone[] }) {
  if (badges.length === 0) return null

  return (
    <span className="inline-flex items-center gap-0.5 ml-1.5">
      {badges.map((badge) => {
        const IconComponent = LucideIcons[
          badge.icon as keyof typeof LucideIcons
        ] as React.ElementType | undefined

        return (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-default">
                {IconComponent ? (
                  <IconComponent className="h-3.5 w-3.5" />
                ) : null}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{badge.label}</p>
              <p className="text-xs opacity-80">{badge.description}</p>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </span>
  )
}

export function TeamList({ members, badgesByMember }: TeamListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('done')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'displayName' ? 'asc' : 'desc')
    }
  }

  const sorted = [...members].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'displayName') {
      cmp = (a.displayName ?? 'zzz').localeCompare(b.displayName ?? 'zzz')
    } else {
      cmp = (a[sortKey] as number) - (b[sortKey] as number)
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No team members yet
      </div>
    )
  }

  const headProps = {
    activeSortKey: sortKey,
    sortDir,
    onSort: handleSort,
  }

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead
              label="Name"
              sortKey="displayName"
              {...headProps}
              className="w-full"
            />
            <SortableHead
              label="Claimed"
              sortKey="claimed"
              {...headProps}
              className="text-right w-24"
            />
            <SortableHead
              label="Emailed"
              sortKey="emailed"
              {...headProps}
              className="text-right w-24"
            />
            <SortableHead
              label="Confirmed"
              sortKey="confirmed"
              {...headProps}
              className="text-right w-24"
            />
            <SortableHead
              label="Visited"
              sortKey="done"
              {...headProps}
              className="text-right w-24 font-semibold text-foreground"
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((member) => {
            const badges = badgesByMember.get(member.profileId) ?? []
            const initials = getInitials(member.displayName)
            const avatarColor = getAvatarColor(member.displayName)

            return (
              <TableRow key={member.profileId}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback
                        className={`${avatarColor} text-[10px] font-semibold text-foreground/80`}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium leading-none">
                      {member.displayName ?? 'Unknown member'}
                    </span>
                    <BadgeIcons badges={badges} />
                  </div>
                </TableCell>

                <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                  {member.claimed}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                  {member.emailed}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                  {member.confirmed}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm font-semibold">
                  {member.done}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TooltipProvider>
  )
}
