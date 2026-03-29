'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { RankedMember } from '@/lib/leaderboard'
import type { SerializableMilestone } from '@/lib/milestones'
import {
  BookMarked,
  Mail,
  CheckCircle,
  Trophy,
  Zap,
  Award,
  Star,
  Sparkles,
} from 'lucide-react'

type IconComponent = React.ComponentType<{ className?: string }>

const ICON_MAP: Record<string, IconComponent> = {
  BookMarked,
  Mail,
  CheckCircle,
  Trophy,
  Zap,
  Award,
  Star,
  Sparkles,
}

const AVATAR_COLORS = [
  'bg-blue-200',
  'bg-emerald-200',
  'bg-amber-200',
  'bg-purple-200',
  'bg-rose-200',
  'bg-cyan-200',
] as const

function getAvatarColor(name: string | null): string {
  if (!name) return AVATAR_COLORS[0]
  const hash = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function getInitials(name: string | null): string {
  if (!name) return 'M'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function SerializableMilestoneBadges({ badges }: { badges: SerializableMilestone[] }) {
  if (badges.length === 0) return null

  const display = badges.slice(0, 3)
  const extra = badges.length - 3

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      {display.map((badge) => {
        const Icon = ICON_MAP[badge.icon]
        return (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center justify-center rounded-full w-6 h-6 bg-muted border border-border text-muted-foreground cursor-default hover:bg-muted/70 transition-colors">
                {Icon && <Icon className="h-3 w-3" />}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium text-xs">{badge.label}</p>
              <p className="text-xs opacity-75">{badge.description}</p>
            </TooltipContent>
          </Tooltip>
        )
      })}
      {extra > 0 && (
        <span className="text-xs text-muted-foreground">+{extra}</span>
      )}
    </div>
  )
}

interface ContributorCardProps {
  member: RankedMember
  badges: SerializableMilestone[]
  isFirst: boolean
  showDone: boolean
}

function ContributorCard({
  member,
  badges,
  isFirst,
  showDone,
}: ContributorCardProps) {
  const name = member.displayName ?? 'Member'
  const isTruncated = name.length > 20
  const truncatedName = isTruncated ? name.slice(0, 20) + '…' : name
  const initials = getInitials(member.displayName)
  const avatarColor = getAvatarColor(member.displayName)
  const primaryMetric = showDone
    ? `${member.done} visited`
    : `${member.confirmed} confirmed`

  return (
    <div
      className={cn(
        'rounded-xl border border-border/50 bg-card p-4 flex flex-col items-center gap-2',
        isFirst &&
          'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10 dark:border-emerald-800/50'
      )}
    >
      <Avatar className={cn(isFirst ? 'h-12 w-12' : 'h-10 w-10')}>
        <AvatarFallback
          className={cn(
            'font-semibold text-slate-700 dark:text-slate-900',
            isFirst ? 'text-sm' : 'text-xs',
            avatarColor
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="font-semibold text-sm truncate block w-full text-center cursor-default max-w-full">
            {truncatedName}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{name}</p>
        </TooltipContent>
      </Tooltip>

      <p
        className={cn(
          'text-sm font-medium text-center',
          isFirst
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-foreground'
        )}
      >
        {primaryMetric}
      </p>

      <p className="text-xs text-muted-foreground text-center">
        {member.confirmed} confirmed&nbsp;·&nbsp;{member.claimed} claimed
      </p>

      {badges.length > 0 && <SerializableMilestoneBadges badges={badges} />}
    </div>
  )
}

function EmptySlot({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-4 flex items-center justify-center min-h-[120px] w-full">
      <p className="text-sm text-muted-foreground italic text-center">
        {message}
      </p>
    </div>
  )
}

export interface PodiumProps {
  topContributors: RankedMember[]
  badgesByMember: Map<string, SerializableMilestone[]>
}

export function Podium({ topContributors, badgesByMember }: PodiumProps) {
  const count = topContributors.length

  if (count === 0) {
    return (
      <TooltipProvider>
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-muted-foreground italic text-center">
            Campaign just started — be the first contributor!
          </p>
        </div>
      </TooltipProvider>
    )
  }

  // Whether any member has completed visits; if not, show confirmed count instead
  const showDone = topContributors.some((m) => m.done > 0)

  const first = topContributors[0]
  const second = topContributors[1] ?? null
  const third = topContributors[2] ?? null

  const firstName = first.displayName ?? 'them'

  // Layout order: [2nd – left] [1st – center] [3rd – right]
  // Classic podium stepping: center is highest, achieved via mt-* on side wrappers
  // with items-start so center starts at the top (visually highest).
  return (
    <TooltipProvider>
      <div className="flex gap-3 items-start">
        <div className="flex-1 mt-3">
          {second ? (
            <ContributorCard
              member={second}
              badges={badgesByMember.get(second.profileId) ?? []}
              isFirst={false}
              showDone={showDone}
            />
          ) : (
            <EmptySlot message={`Join ${firstName} on the podium!`} />
          )}
        </div>

        <div className="flex-1">
          <ContributorCard
            member={first}
            badges={badgesByMember.get(first.profileId) ?? []}
            isFirst={true}
            showDone={showDone}
          />
        </div>

        <div className="flex-1 mt-6">
          {third ? (
            <ContributorCard
              member={third}
              badges={badgesByMember.get(third.profileId) ?? []}
              isFirst={false}
              showDone={showDone}
            />
          ) : (
            <EmptySlot
              message={
                count === 1
                  ? `Join ${firstName} on the podium!`
                  : 'Claim the bronze!'
              }
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
