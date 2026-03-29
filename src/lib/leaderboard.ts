import type { MemberStats } from './milestones'

export type RankedMember = MemberStats & {
  rank: number // 1-indexed, ties get same rank (1, 2, 2, 4 pattern)
}

/**
 * Ranks members by contribution metrics with olympic-style tie handling.
 * Sort order: done desc → confirmed desc → emailed desc → displayName asc (alphabetical, null last)
 * Members with same done + confirmed score get the same rank. Next rank skips (1, 2, 2, 4).
 */
export function rankMembers(members: MemberStats[]): RankedMember[] {
  const sorted = [...members].sort((a, b) => {
    if (b.done !== a.done) return b.done - a.done
    if (b.confirmed !== a.confirmed) return b.confirmed - a.confirmed
    if (b.emailed !== a.emailed) return b.emailed - a.emailed
    const nameA = a.displayName ?? 'zzz'
    const nameB = b.displayName ?? 'zzz'
    return nameA.localeCompare(nameB)
  })

  let currentRank = 1
  return sorted.map((member, i) => {
    if (i > 0) {
      const prev = sorted[i - 1]
      if (member.done !== prev.done || member.confirmed !== prev.confirmed) {
        currentRank = i + 1
      }
    }
    return { ...member, rank: currentRank }
  })
}

/**
 * Returns the top N contributors from a ranked member list.
 */
export function getTopContributors(
  ranked: RankedMember[],
  count: number
): RankedMember[] {
  return ranked.slice(0, count)
}

export type { MemberStats }
