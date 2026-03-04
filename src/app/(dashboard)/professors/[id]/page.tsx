import { createClient } from '@/lib/supabase/server'
import { ProfessorDetail } from '@/components/professors/professor-detail'
import { EmptyState } from '@/components/empty-state'
import { Users } from 'lucide-react'
import type { Professor, Lecture, University } from '@/types/database'

export default async function ProfessorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  // Fetch professor with university
  const { data: professor } = await supabase
    .from('professors')
    .select('*, university:universities(id, name)')
    .eq('id', id)
    .single()

  if (!professor) {
    return (
      <EmptyState
        title="Professor not found"
        description="The professor you're looking for doesn't exist."
        icon={Users}
      />
    )
  }

  // Fetch lectures via junction table
  const { data: lectureLinks } = await supabase
    .from('lecture_professors')
    .select('lecture:lectures(id, title, lecture_type, semester, university_id, university:universities(id, name))')
    .eq('professor_id', id)
  const lectures = (lectureLinks?.map(l => l.lecture).filter(Boolean) ?? []) as unknown as (Lecture & { university: University })[]

  // Fetch outreach status for this professor
  const { data: outreach } = await supabase
    .from('professor_outreach')
    .select('*')
    .eq('professor_id', id)
    .order('semester', { ascending: false })

  return (
    <ProfessorDetail
      professor={professor as Professor & { university: University }}
      lectures={lectures}
      outreach={outreach ?? []}
    />
  )
}
