import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/scheduled/kanban-board'
import type { Lecture, University, Profile } from '@/types/database'

type LectureWithUniversityAndOwner = Lecture & {
  university?: University | null
  owner_profile?: Profile | null
}

export default async function ScheduledPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch lectures with owner profiles
  const { data } = await supabase
    .from('lectures')
    .select('*, university:universities(id, name, full_name, website), owner_profile:profiles!owner(id, display_name, created_at, updated_at)')
    .order('title')

  const lectures: LectureWithUniversityAndOwner[] = (data as LectureWithUniversityAndOwner[]) ?? []

  return (
    <div className="animate-fade-in-up">
      <KanbanBoard lectures={lectures} currentUserId={user?.id} />
    </div>
  )
}
