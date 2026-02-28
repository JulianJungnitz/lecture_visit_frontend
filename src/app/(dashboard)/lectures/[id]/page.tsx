import { supabase } from '@/lib/supabase'
import { LectureDetail } from '@/components/lectures/lecture-detail'
import { EmptyState } from '@/components/empty-state'
import { BookOpen } from 'lucide-react'
import type { Lecture, Professor, LectureSchedule, StudyProgram, University } from '@/types/database'

export default async function LecturePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch lecture with university
  const { data: lecture } = await supabase
    .from('lectures')
    .select('*, university:universities(id, name)')
    .eq('id', id)
    .single()

  if (!lecture) {
    return (
      <EmptyState
        title="Lecture not found"
        description="The lecture you're looking for doesn't exist."
        icon={BookOpen}
      />
    )
  }

  // Fetch professors via junction table
  const { data: professorLinks } = await supabase
    .from('lecture_professors')
    .select('professor:professors(*)')
    .eq('lecture_id', id)
  const professors = (professorLinks?.map(l => l.professor).filter(Boolean) ?? []) as unknown as Professor[]

  // Fetch schedules
  const { data: schedules } = await supabase
    .from('lecture_schedules')
    .select('*')
    .eq('lecture_id', id)

  // Fetch study programs via junction table
  const { data: programLinks } = await supabase
    .from('lecture_study_programs')
    .select('study_program:study_programs(*, university:universities(id, name))')
    .eq('lecture_id', id)
  const studyPrograms = (programLinks?.map(l => l.study_program).filter(Boolean) ?? []) as unknown as (StudyProgram & { university: University })[]

  return (
    <LectureDetail
      lecture={lecture as Lecture & { university: University }}
      professors={professors}
      schedules={schedules as LectureSchedule[] ?? []}
      studyPrograms={studyPrograms}
    />
  )
}
