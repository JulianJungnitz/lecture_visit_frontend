import { supabase } from '@/lib/supabase'
import { ProgramDetail } from '@/components/programs/program-detail'
import { EmptyState } from '@/components/empty-state'
import { BookOpen } from 'lucide-react'
import type { StudyProgramWithDetails, Lecture } from '@/types/database'

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch program with university and faculty
  const { data: program } = await supabase
    .from('study_programs')
    .select('*, university:universities(id, name), faculty:faculties(id, name)')
    .eq('id', id)
    .single()

  if (!program) {
    return (
      <EmptyState
        title="Program not found"
        description="The study program you're looking for doesn't exist."
        icon={BookOpen}
      />
    )
  }

  // Fetch lectures for this program via junction table
  const { data: lectureLinks } = await supabase
    .from('lecture_study_programs')
    .select('lecture:lectures(id, title, lecture_type, semester, university_id)')
    .eq('study_program_id', id)

  const lectures = (lectureLinks?.map(l => l.lecture).filter(Boolean) ?? []) as unknown as Lecture[]

  return (
    <ProgramDetail
      program={program as StudyProgramWithDetails}
      lectures={lectures}
    />
  )
}
