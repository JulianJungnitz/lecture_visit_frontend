'use server'

import { createClient } from '@/lib/supabase/server'
import type { Lecture, University } from '@/types/database'

export type LectureWithUniversity = Lecture & { university?: University | null }

export type AddLectureFilterOptions = {
  locations: string[]
  days: { label: string; value: string }[]
  universities: { id: string; name: string }[]
  lectureTypes: string[]
  studyPrograms: { id: string; name: string; universityName?: string }[]
}

export type SearchLecturesFilters = {
  title?: string
  location?: string
  dayOfWeek?: string
  universityIds?: string[]
  studyProgramIds?: string[]
  /** true = starred only, false = non-starred only, undefined = all */
  isStarred?: boolean
  /** filter by lecture_type (e.g. Vorlesung, Seminar); empty/undefined = all */
  lectureTypes?: string[]
  excludeIds?: string[]
  limit?: number
}

export async function getAddLectureFilterOptions(): Promise<AddLectureFilterOptions> {
  const supabase = await createClient()

  const [schedulesRes, programsRes, universitiesRes, typesRes] = await Promise.all([
    supabase.from('lecture_schedules').select('location, day_time'),
    supabase
      .from('study_programs')
      .select('id, name, university:universities(id, name)')
      .order('name'),
    supabase.from('universities').select('id, name').order('name'),
    supabase.from('lectures').select('lecture_type').not('lecture_type', 'is', null),
  ])

  const locations =
    schedulesRes.data != null
      ? [...new Set(
          schedulesRes.data
            .map((r) => r.location)
            .filter((loc): loc is string => Boolean(loc))
            .map((loc) => loc.split(' - ')[0].split(',')[0].trim())
            .filter(Boolean)
        )].sort()
      : []

  const DAY_MAP: Record<string, string> = {
    'Mo': 'Montag', 'Di': 'Dienstag', 'Mi': 'Mittwoch',
    'Do': 'Donnerstag', 'Fr': 'Freitag', 'Sa': 'Samstag', 'So': 'Sonntag',
  }
  const foundPrefixes = schedulesRes.data != null
    ? new Set(
        schedulesRes.data
          .map((r) => r.day_time?.trim().slice(0, 2))
          .filter((s): s is string => Boolean(s) && s in DAY_MAP)
      )
    : new Set<string>()
  const days = Object.entries(DAY_MAP)
    .filter(([prefix]) => foundPrefixes.has(prefix))
    .map(([value, label]) => ({ label, value }))

  const studyPrograms =
    programsRes.data != null
      ? (programsRes.data as unknown as { id: string; name: string; university: { name: string } | null }[]).map(
          (p) => ({
            id: p.id,
            name: p.name,
            universityName: p.university?.name,
          })
        )
      : []

  const universities =
    universitiesRes.data != null
      ? (universitiesRes.data as { id: string; name: string }[])
      : []

  const lectureTypes = [...new Set(
    (typesRes.data ?? []).map((r: { lecture_type: string | null }) => r.lecture_type).filter(Boolean)
  )].sort() as string[]

  return { locations, days, universities, lectureTypes, studyPrograms }
}

export async function searchLecturesForBoard(
  filters: SearchLecturesFilters
): Promise<LectureWithUniversity[]> {
  const supabase = await createClient()
  const {
    title,
    location,
    dayOfWeek,
    universityIds,
    studyProgramIds,
    isStarred,
    lectureTypes: lectureTypesFilter,
    excludeIds = [],
    limit = 50,
  } = filters

  let lectureIdsByLocation: string[] | null = null
  let lectureIdsByDay: string[] | null = null
  let lectureIdsByProgram: string[] | null = null

  if (location?.trim()) {
    const addr = location.trim().replace(/"/g, '')
    const { data } = await supabase
      .from('lecture_schedules')
      .select('lecture_id')
      .or(`location.ilike."${addr} - %",location.ilike."${addr}, %",location.eq."${addr}"`)
    lectureIdsByLocation = data != null ? [...new Set(data.map((r) => r.lecture_id))] : []
  }

  if (dayOfWeek?.trim()) {
    const prefix = dayOfWeek.trim().slice(0, 2)
    const { data } = await supabase
      .from('lecture_schedules')
      .select('lecture_id')
      .ilike('day_time', `${prefix}%`)
    lectureIdsByDay = data != null ? [...new Set(data.map((r) => r.lecture_id))] : []
  }

  if (studyProgramIds != null && studyProgramIds.length > 0) {
    const { data } = await supabase
      .from('lecture_study_programs')
      .select('lecture_id')
      .in('study_program_id', studyProgramIds)
    lectureIdsByProgram = data != null ? [...new Set(data.map((r) => r.lecture_id))] : []
  }

  let candidateIds: string[] | null = null
  const sets = [lectureIdsByLocation, lectureIdsByDay, lectureIdsByProgram].filter(
    (s): s is string[] => s != null
  )
  if (sets.length > 0) {
    const intersection = sets.reduce((acc, set) =>
      acc.filter((id) => set.includes(id))
    )
    candidateIds = intersection
  }

  let query = supabase
    .from('lectures')
    .select('*, university:universities(id, name)')
    .order('title')

  if (title?.trim()) {
    query = query.ilike('title', `%${title.trim()}%`)
  }

  if (universityIds != null && universityIds.length > 0) {
    query = query.in('university_id', universityIds)
  }

  if (isStarred === true) {
    query = query.eq('is_starred', true)
  } else if (isStarred === false) {
    query = query.or('is_starred.eq.false,is_starred.is.null')
  }

  if (lectureTypesFilter != null && lectureTypesFilter.length > 0) {
    query = query.in('lecture_type', lectureTypesFilter)
  }

  if (candidateIds != null) {
    if (candidateIds.length === 0) {
      return []
    }
    query = query.in('id', candidateIds)
  }

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  const { data, error } = await query.range(0, limit - 1)

  if (error) throw error
  return (data as LectureWithUniversity[]) ?? []
}
