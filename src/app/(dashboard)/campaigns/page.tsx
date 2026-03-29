import { getActiveSemester } from '@/app/actions/campaigns'
import {
  getDashboardStats,
  getLeaderboardData,
  getPersonalStats,
  getSemesterGoal,
} from '@/app/actions/dashboard'
import { computeEarnedBadges } from '@/lib/milestones'
import type { SerializableMilestone } from '@/lib/milestones'
import { CampaignDashboard } from '@/components/campaigns/campaign-dashboard'

export default async function CampaignsPage() {
  const semester = await getActiveSemester()

  const [stats, leaderboard, personalStats, goal] = await Promise.all([
    getDashboardStats(semester),
    getLeaderboardData(semester),
    getPersonalStats(semester),
    getSemesterGoal(semester),
  ])

  const badgesByMemberRecord: Record<string, SerializableMilestone[]> = {}
  for (const member of leaderboard) {
    badgesByMemberRecord[member.profileId] = computeEarnedBadges(member)
  }
  const personalBadges = personalStats ? computeEarnedBadges(personalStats) : []

  return (
    <div className="animate-fade-in-up">
      <CampaignDashboard
        semester={semester}
        stats={stats}
        leaderboard={leaderboard}
        personalStats={personalStats}
        personalBadges={personalBadges}
        badgesByMember={badgesByMemberRecord}
        goal={goal}
      />
    </div>
  )
}
