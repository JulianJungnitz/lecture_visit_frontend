import { createClient } from '@/lib/supabase/server'
import { CampaignHub } from '@/components/campaigns/campaign-hub'
import {
  getActiveSemester,
  getCampaignStats,
  getAvailableLectures,
  getMyVisits,
  getTeamVisits,
  checkProfessorDedup,
} from '@/app/actions/campaigns'
import type { ProfessorDedupWarning } from '@/app/actions/campaigns'

export default async function CampaignsPage() {
  // 1. Get active semester (from parameters table)
  const semester = await getActiveSemester()

  // 2. Run parallel fetches
  const [stats, availableLectures, myVisits, teamData, universitiesRes, profileCountRes] =
    await Promise.all([
      getCampaignStats(semester),
      getAvailableLectures(semester),
      getMyVisits(semester),
      getTeamVisits(semester),
      createClient().then(supabase => supabase.from('universities').select('id, name').order('name')),
      createClient().then(supabase => supabase.from('profiles').select('id', { count: 'exact', head: true })),
    ])

  const universities = universitiesRes.data ?? []
  const totalMembers = profileCountRes.count ?? 0

  // 3. Compute dedup warnings for available lectures in parallel
  const dedupResults = await Promise.all(
    availableLectures.map(async (lec) => {
      const warnings = await checkProfessorDedup(lec.id, semester)
      return [lec.id, warnings] as [string, ProfessorDedupWarning[]]
    })
  )
  const dedupWarnings = Object.fromEntries(dedupResults.filter(([, w]) => w.length > 0))

  // 4. Get current user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="animate-fade-in-up">
      <CampaignHub
        semester={semester}
        stats={stats}
        availableLectures={availableLectures}
        myVisits={myVisits}
        teamData={teamData}
        universities={universities}
        dedupWarnings={dedupWarnings}
        totalMembers={totalMembers}
        currentUserId={user?.id}
      />
    </div>
  )
}
