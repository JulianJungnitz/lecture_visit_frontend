'use server'

import { createClient } from '@/lib/supabase/server'
import type { Lecture, University } from '@/types/database'

export type LectureSearchResult = Lecture & { university: Pick<University, 'id' | 'name'> }

export async function searchAllLectures(query: string, excludeIds: string[], universityId: string): Promise<LectureSearchResult[]> {
  const supabase = await createClient()

  let q = supabase
    .from('lectures')
    .select('id, title, lecture_type, semester, university_id, description, source_url, external_id, is_starred, notes, university:universities(id, name)')
    .eq('university_id', universityId)

  if (query.trim()) {
    q = q.ilike('title', `%${query.trim()}%`)
  }

  if (excludeIds.length > 0) {
    q = q.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  const { data } = await q.order('title').limit(20)
  return (data ?? []) as LectureSearchResult[]
}

export async function addLectureToProgram(lectureId: string, programId: string, obligation: string | null = null): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('lecture_study_programs')
    .insert({ lecture_id: lectureId, study_program_id: programId, lecture_obligation: obligation })
}

export async function removeLectureFromProgram(lectureId: string, programId: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('lecture_study_programs')
    .delete()
    .eq('lecture_id', lectureId)
    .eq('study_program_id', programId)
}

export async function toggleLectureStar(lectureId: string, starred: boolean): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('lectures')
    .update({ is_starred: starred })
    .eq('id', lectureId)
}

export async function toggleProgramStar(programId: string, starred: boolean): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('study_programs')
    .update({ is_starred: starred })
    .eq('id', programId)
}
