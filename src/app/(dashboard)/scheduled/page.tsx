import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/scheduled/kanban-board'
import type { Lecture, University } from '@/types/database'

type LectureWithUniversity = Lecture & { university?: University | null }

export default async function ScheduledPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('lectures')
    .select('*, university:universities(id, name, full_name, website)')
    .order('title')

  const lectures: LectureWithUniversity[] = (data as LectureWithUniversity[]) ?? []

  return (
    <div className="animate-fade-in-up">
      <KanbanBoard lectures={lectures} />
    </div>
  )
}
