'use server'

import { createClient } from '@/lib/supabase/server'
import { rankMembers } from '@/lib/leaderboard'
import type { MemberStats } from '@/lib/milestones'
import type { RankedMember } from '@/lib/leaderboard'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DashboardStats = {
  curated: number   // is_starred = true lectures
  claimed: number   // lectures with an owner
  emailed: number   // outreach_status = 'emailed'
  confirmed: number // outreach_status = 'confirmed'
  done: number      // outreach_status = 'done'
}

export type LeaderboardEntry = RankedMember // re-export for consumers

// ---------------------------------------------------------------------------
// getDashboardStats
// ---------------------------------------------------------------------------

export async function getDashboardStats(
  semester: string
): Promise<DashboardStats> {
  const supabase = await createClient()

  const [curatedRes, claimedRes, emailedRes, confirmedRes, doneRes] =
    await Promise.all([
      supabase
        .from('lectures')
        .select('*', { count: 'exact', head: true })
        .eq('is_starred', true)
        .eq('semester', semester),
      supabase
        .from('lectures')
        .select('*', { count: 'exact', head: true })
        .not('owner', 'is', null)
        .eq('semester', semester),
      supabase
        .from('lectures')
        .select('*', { count: 'exact', head: true })
        .eq('outreach_status', 'emailed')
        .eq('semester', semester),
      supabase
        .from('lectures')
        .select('*', { count: 'exact', head: true })
        .eq('outreach_status', 'confirmed')
        .eq('semester', semester),
      supabase
        .from('lectures')
        .select('*', { count: 'exact', head: true })
        .eq('outreach_status', 'done')
        .eq('semester', semester),
    ])

  if (curatedRes.error) throw curatedRes.error
  if (claimedRes.error) throw claimedRes.error
  if (emailedRes.error) throw emailedRes.error
  if (confirmedRes.error) throw confirmedRes.error
  if (doneRes.error) throw doneRes.error

  return {
    curated: curatedRes.count ?? 0,
    claimed: claimedRes.count ?? 0,
    emailed: emailedRes.count ?? 0,
    confirmed: confirmedRes.count ?? 0,
    done: doneRes.count ?? 0,
  }
}

// ---------------------------------------------------------------------------
// getLeaderboardData
// ---------------------------------------------------------------------------

export async function getLeaderboardData(
  semester: string
): Promise<RankedMember[]> {
  const supabase = await createClient()

  // Fetch all claimed lectures for this semester with owner
  const { data: lectures, error } = await supabase
    .from('lectures')
    .select('id, owner, outreach_status')
    .not('owner', 'is', null)
    .eq('semester', semester)

  if (error) throw error

  // Aggregate stats per member (only for those who have claimed)
  const statsMap = new Map<string, MemberStats>()

  if (lectures && lectures.length > 0) {
    // Get all unique owner IDs
    const ownerIds = [...new Set(lectures.map((l) => l.owner as string))]

    // Fetch profiles for those owners
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', ownerIds)

    if (profilesError) throw profilesError

    // Build profile map
    const profileMap = new Map<
      string,
      { id: string; display_name: string | null }
    >()
    for (const p of profiles ?? []) {
      profileMap.set(p.id, p)
    }

    for (const lecture of lectures) {
      const ownerId = lecture.owner as string
      if (!statsMap.has(ownerId)) {
        const profile = profileMap.get(ownerId)
        statsMap.set(ownerId, {
          profileId: ownerId,
          displayName: profile?.display_name ?? null,
          claimed: 0,
          emailed: 0,
          confirmed: 0,
          done: 0,
        })
      }
      const stats = statsMap.get(ownerId)!
      stats.claimed += 1
      if (lecture.outreach_status === 'emailed') stats.emailed += 1
      if (lecture.outreach_status === 'confirmed') stats.confirmed += 1
      if (lecture.outreach_status === 'done') stats.done += 1
    }
  }

  // Also include profiles with no claimed lectures (zero-activity members)
  // so team list shows everyone
  const { data: allProfiles, error: allProfilesError } = await supabase
    .from('profiles')
    .select('id, display_name')

  if (allProfilesError) throw allProfilesError

  for (const profile of allProfiles ?? []) {
    if (!statsMap.has(profile.id)) {
      statsMap.set(profile.id, {
        profileId: profile.id,
        displayName: profile.display_name,
        claimed: 0,
        emailed: 0,
        confirmed: 0,
        done: 0,
      })
    }
  }

  const allStats = Array.from(statsMap.values())
  return rankMembers(allStats)
}

// ---------------------------------------------------------------------------
// getPersonalStats
// ---------------------------------------------------------------------------

export async function getPersonalStats(
  semester: string
): Promise<MemberStats | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: lectures, error } = await supabase
    .from('lectures')
    .select('id, outreach_status')
    .eq('owner', user.id)
    .eq('semester', semester)

  if (error) throw error

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', user.id)
    .single()

  const stats: MemberStats = {
    profileId: user.id,
    displayName: profile?.display_name ?? null,
    claimed: lectures?.length ?? 0,
    emailed:
      lectures?.filter((l) => l.outreach_status === 'emailed').length ?? 0,
    confirmed:
      lectures?.filter((l) => l.outreach_status === 'confirmed').length ?? 0,
    done: lectures?.filter((l) => l.outreach_status === 'done').length ?? 0,
  }

  return stats
}

// ---------------------------------------------------------------------------
// getSemesterGoal
// ---------------------------------------------------------------------------

export async function getSemesterGoal(
  semester: string
): Promise<number | null> {
  const supabase = await createClient()

  const key = `semester_goal_${semester}`
  const { data, error } = await supabase
    .from('parameters')
    .select('value')
    .eq('key', key)
    .single()

  if (error || !data?.value) return null

  const parsed = parseInt(data.value, 10)
  return isNaN(parsed) ? null : parsed
}
