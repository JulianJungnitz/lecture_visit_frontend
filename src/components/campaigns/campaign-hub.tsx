'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { StatsBar } from './stats-bar'
import { AvailableTab } from './available-tab'
import { MyVisitsTab } from './my-visits-tab'
import { TeamTab } from './team-tab'
import type {
  CampaignLecture,
  CampaignStats,
  ProfessorDedupWarning,
} from '@/app/actions/campaigns'

type TabId = 'available' | 'my-visits' | 'team'

interface CampaignHubProps {
  semester: string
  stats: CampaignStats
  availableLectures: CampaignLecture[]
  myVisits: CampaignLecture[]
  teamData: {
    profile: { id: string; display_name: string | null }
    lectures: CampaignLecture[]
  }[]
  universities: { id: string; name: string }[]
  dedupWarnings: Record<string, ProfessorDedupWarning[]>
  totalMembers: number
  currentUserId?: string
}

export function CampaignHub({
  semester,
  stats,
  availableLectures,
  myVisits,
  teamData,
  universities,
  dedupWarnings,
  totalMembers,
  currentUserId,
}: CampaignHubProps) {
  const [activeTab, setActiveTab] = useState<TabId>('available')

  const tabs: { id: TabId; label: string }[] = [
    { id: 'available', label: `Available (${availableLectures.length})` },
    { id: 'my-visits', label: `My Visits (${myVisits.length})` },
    { id: 'team', label: 'Team' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {semester} Campaign
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lecture visit coordination for {semester}
        </p>
      </div>

      <StatsBar stats={stats} />

      <div className="inline-flex items-center rounded-full bg-muted p-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'available' && (
        <AvailableTab
          lectures={availableLectures}
          universities={universities}
          currentUserId={currentUserId}
          dedupWarnings={dedupWarnings}
        />
      )}
      {activeTab === 'my-visits' && <MyVisitsTab lectures={myVisits} />}
      {activeTab === 'team' && (
        <TeamTab teamData={teamData} totalMembers={totalMembers} />
      )}
    </div>
  )
}
