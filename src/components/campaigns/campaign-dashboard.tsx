'use client'

import { useMemo } from 'react'
import { GoalTracker } from './goal-tracker'
import { Podium } from './podium'
import { TeamList } from './team-list'
import { PersonalStats } from './personal-stats'
import { getTopContributors } from '@/lib/leaderboard'
import type { DashboardStats } from '@/app/actions/dashboard'
import type { RankedMember } from '@/lib/leaderboard'
import type { MemberStats, SerializableMilestone } from '@/lib/milestones'

interface CampaignDashboardProps {
  semester: string
  stats: DashboardStats
  leaderboard: RankedMember[]
  personalStats: MemberStats | null
  personalBadges: SerializableMilestone[]
  badgesByMember: Record<string, SerializableMilestone[]>
  goal: number | null
}

export function CampaignDashboard({
  semester,
  stats,
  leaderboard,
  personalStats,
  personalBadges,
  badgesByMember: badgesByMemberRecord,
  goal,
}: CampaignDashboardProps) {
  const badgesByMember = useMemo(
    () => new Map(Object.entries(badgesByMemberRecord)),
    [badgesByMemberRecord]
  )

  const topContributors = getTopContributors(leaderboard, 3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{semester} Campaign</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lecture visit coordination for {semester}
        </p>
      </div>

      <GoalTracker stats={stats} goal={goal} semester={semester} />

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Top Contributors
        </h2>
        <Podium topContributors={topContributors} badgesByMember={badgesByMember} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Team
        </h2>
        <TeamList members={leaderboard} badgesByMember={badgesByMember} />
      </section>
    </div>
  )
}
