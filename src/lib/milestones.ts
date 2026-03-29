export type MemberStats = {
  profileId: string
  displayName: string | null
  claimed: number   // lectures with this owner
  emailed: number   // outreach_status = 'emailed'
  confirmed: number // outreach_status = 'confirmed'
  done: number      // outreach_status = 'done'
}

export type Milestone = {
  id: string
  label: string
  icon: string
  description: string
  check: (stats: MemberStats) => boolean
}

export type SerializableMilestone = Omit<Milestone, 'check'>

export const MILESTONES: Milestone[] = [
  {
    id: 'first_claim',
    label: 'First Claim',
    icon: 'BookMarked',
    description: 'Claimed your first lecture',
    check: (stats) => stats.claimed >= 1,
  },
  {
    id: 'first_email',
    label: 'First Email',
    icon: 'Mail',
    description: 'Sent your first outreach email',
    check: (stats) => stats.emailed >= 1,
  },
  {
    id: 'first_confirmation',
    label: 'First Confirmation!',
    icon: 'CheckCircle',
    description: 'Got your first professor confirmation',
    check: (stats) => stats.confirmed >= 1,
  },
  {
    id: 'first_visit',
    label: 'First Visit Done',
    icon: 'Trophy',
    description: 'Completed your first lecture visit',
    check: (stats) => stats.done >= 1,
  },
  {
    id: 'five_claims',
    label: 'Claimed Five',
    icon: 'Zap',
    description: 'Claimed 5 lectures',
    check: (stats) => stats.claimed >= 5,
  },
  {
    id: 'five_confirmed',
    label: 'High Five',
    icon: 'Award',
    description: 'Got 5 professor confirmations',
    check: (stats) => stats.confirmed >= 5,
  },
  {
    id: 'ten_claims',
    label: 'Double Digits',
    icon: 'Star',
    description: 'Claimed 10 lectures',
    check: (stats) => stats.claimed >= 10,
  },
  {
    id: 'all_emailed',
    label: 'Outreach Complete',
    icon: 'Sparkles',
    description: 'Reached out to all claimed lectures',
    check: (stats) =>
      stats.claimed > 0 && stats.emailed + stats.confirmed + stats.done >= stats.claimed,
  },
]

export function computeEarnedBadges(stats: MemberStats): SerializableMilestone[] {
  return MILESTONES
    .filter((m) => m.check(stats))
    .map(({ check: _, ...rest }) => rest)
}
