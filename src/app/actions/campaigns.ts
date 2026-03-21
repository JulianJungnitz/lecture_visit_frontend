'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CampaignLecture = {
  id: string
  title: string
  lecture_type: string | null
  semester: string | null
  is_starred: boolean | null
  owner: string | null
  outreach_status:
    | 'not_contacted'
    | 'emailed'
    | 'confirmed'
    | 'declined'
    | 'done'
    | null
  university: { id: string; name: string } | null
  professors: Array<{
    id: string
    first_name: string
    last_name: string | null
    title: string | null
    email: string | null
    source_url: string | null
  }>
  schedules: Array<{
    id: string
    day_time: string | null
    location: string | null
    frequency: string | null
  }>
  study_programs: Array<{
    id: string
    name: string
    degree_type: string
  }>
  owner_profile: { id: string; display_name: string | null } | null
}

export type CampaignStats = {
  curated: number
  needSomeone: number
  claimed: number
  emailed: number
  confirmed: number
}

export type ProfessorDedupWarning = {
  professorName: string
  otherLectureTitle: string
  claimedByName: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

/**
 * Hydrate a list of base lectures with professors, schedules, study_programs
 * and owner_profile. Shared by getAvailableLectures, getMyVisits, getTeamVisits.
 */
async function hydrateLectures(
  supabase: Awaited<ReturnType<typeof createClient>>,
  baseLectures: Array<{
    id: string
    title: string
    lecture_type: string | null
    semester: string | null
    is_starred: boolean | null
    owner: string | null
    outreach_status: string | null
    university: { id: string; name: string } | null
  }>
): Promise<CampaignLecture[]> {
  if (baseLectures.length === 0) return []

  const ids = baseLectures.map((l) => l.id)
  const ownerIds = [
    ...new Set(baseLectures.map((l) => l.owner).filter(Boolean)),
  ] as string[]

  const [professorsRes, schedulesRes, programsRes, profilesRes] =
    await Promise.all([
      supabase
        .from('lecture_professors')
        .select(
          'lecture_id, professor:professors(id, first_name, last_name, title, email, source_url)'
        )
        .in('lecture_id', ids),
      supabase
        .from('lecture_schedules')
        .select('id, lecture_id, day_time, location, frequency')
        .in('lecture_id', ids),
      supabase
        .from('lecture_study_programs')
        .select(
          'lecture_id, study_program:study_programs(id, name, degree_type)'
        )
        .in('lecture_id', ids),
      ownerIds.length > 0
        ? supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', ownerIds)
        : Promise.resolve({ data: [] as { id: string; display_name: string | null }[], error: null }),
    ])

  if (professorsRes.error) throw professorsRes.error
  if (schedulesRes.error) throw schedulesRes.error
  if (programsRes.error) throw programsRes.error
  if (profilesRes.error) throw profilesRes.error

  // Build lookup maps
  const profsByLecture = new Map<string, CampaignLecture['professors']>()
  for (const row of professorsRes.data ?? []) {
    const typed = row as unknown as {
      lecture_id: string
      professor: CampaignLecture['professors'][number] | null
    }
    if (!typed.professor) continue
    const existing = profsByLecture.get(typed.lecture_id) ?? []
    existing.push(typed.professor)
    profsByLecture.set(typed.lecture_id, existing)
  }

  const schedsByLecture = new Map<string, CampaignLecture['schedules']>()
  for (const row of schedulesRes.data ?? []) {
    const typed = row as { id: string; lecture_id: string; day_time: string | null; location: string | null; frequency: string | null }
    const existing = schedsByLecture.get(typed.lecture_id) ?? []
    existing.push({
      id: typed.id,
      day_time: typed.day_time,
      location: typed.location,
      frequency: typed.frequency,
    })
    schedsByLecture.set(typed.lecture_id, existing)
  }

  const progsByLecture = new Map<string, CampaignLecture['study_programs']>()
  for (const row of programsRes.data ?? []) {
    const typed = row as unknown as {
      lecture_id: string
      study_program: CampaignLecture['study_programs'][number] | null
    }
    if (!typed.study_program) continue
    const existing = progsByLecture.get(typed.lecture_id) ?? []
    existing.push(typed.study_program)
    progsByLecture.set(typed.lecture_id, existing)
  }

  const profileMap = new Map<
    string,
    { id: string; display_name: string | null }
  >()
  for (const p of profilesRes.data ?? []) {
    profileMap.set(p.id, p)
  }

  return baseLectures.map((l) => ({
    id: l.id,
    title: l.title,
    lecture_type: l.lecture_type,
    semester: l.semester,
    is_starred: l.is_starred,
    owner: l.owner,
    outreach_status: l.outreach_status as CampaignLecture['outreach_status'],
    university: l.university,
    professors: profsByLecture.get(l.id) ?? [],
    schedules: schedsByLecture.get(l.id) ?? [],
    study_programs: progsByLecture.get(l.id) ?? [],
    owner_profile: l.owner ? (profileMap.get(l.owner) ?? null) : null,
  }))
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

export async function getActiveSemester(): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('parameters')
    .select('value')
    .eq('key', 'active_semester')
    .single()

  if (error || !data?.value) return 'SoSe 2026'
  return data.value
}

export async function getCampaignStats(
  semester: string
): Promise<CampaignStats> {
  const supabase = await createClient()

  const [curatedRes, needSomeoneRes, claimedRes, emailedRes, confirmedRes] =
    await Promise.all([
      supabase
        .from('lectures')
        .select('*', { count: 'exact', head: true })
        .eq('is_starred', true)
        .eq('semester', semester),
      supabase
        .from('lectures')
        .select('*', { count: 'exact', head: true })
        .eq('is_starred', true)
        .is('owner', null)
        .eq('semester', semester),
      supabase
        .from('lectures')
        .select('*', { count: 'exact', head: true })
        .not('owner', 'is', null)
        .eq('semester', semester),
      supabase
        .from('lectures')
        .select('*', { count: 'exact', head: true })
        .eq('outreach_status', 'emailed')
        .eq('semester', semester),
      supabase
        .from('lectures')
        .select('*', { count: 'exact', head: true })
        .eq('outreach_status', 'confirmed')
        .eq('semester', semester),
    ])

  if (curatedRes.error) throw curatedRes.error
  if (needSomeoneRes.error) throw needSomeoneRes.error
  if (claimedRes.error) throw claimedRes.error
  if (emailedRes.error) throw emailedRes.error
  if (confirmedRes.error) throw confirmedRes.error

  return {
    curated: curatedRes.count ?? 0,
    needSomeone: needSomeoneRes.count ?? 0,
    claimed: claimedRes.count ?? 0,
    emailed: emailedRes.count ?? 0,
    confirmed: confirmedRes.count ?? 0,
  }
}

export async function getAvailableLectures(
  semester: string,
  filters?: {
    universityId?: string
    dayPrefix?: string
    studyProgramId?: string
    search?: string
  }
): Promise<CampaignLecture[]> {
  const supabase = await createClient()

  // Pre-filter by day_time if dayPrefix provided
  let lectureIdsByDay: string[] | null = null
  if (filters?.dayPrefix?.trim()) {
    const prefix = filters.dayPrefix.trim()
    const { data, error } = await supabase
      .from('lecture_schedules')
      .select('lecture_id')
      .ilike('day_time', `${prefix}%`)
    if (error) throw error
    lectureIdsByDay = data ? [...new Set(data.map((r) => r.lecture_id))] : []
  }

  // Pre-filter by study program if provided
  let lectureIdsByProgram: string[] | null = null
  if (filters?.studyProgramId?.trim()) {
    const { data, error } = await supabase
      .from('lecture_study_programs')
      .select('lecture_id')
      .eq('study_program_id', filters.studyProgramId)
    if (error) throw error
    lectureIdsByProgram = data
      ? [...new Set(data.map((r) => r.lecture_id))]
      : []
  }

  // Intersect pre-filter sets
  let candidateIds: string[] | null = null
  const sets = [lectureIdsByDay, lectureIdsByProgram].filter(
    (s): s is string[] => s != null
  )
  if (sets.length > 0) {
    candidateIds = sets.reduce((acc, set) =>
      acc.filter((id) => set.includes(id))
    )
    if (candidateIds.length === 0) return []
  }

  // Main query
  let query = supabase
    .from('lectures')
    .select('id, title, lecture_type, semester, is_starred, owner, outreach_status, university:universities(id, name)')
    .eq('is_starred', true)
    .is('owner', null)
    .eq('semester', semester)
    .order('title')
    .limit(100)

  if (filters?.universityId?.trim()) {
    query = query.eq('university_id', filters.universityId)
  }
  if (filters?.search?.trim()) {
    query = query.ilike('title', `%${filters.search.trim()}%`)
  }
  if (candidateIds != null) {
    query = query.in('id', candidateIds)
  }

  const { data, error } = await query

  if (error) throw error
  if (!data || data.length === 0) return []

  const baseLectures = (data as unknown as Array<{
    id: string
    title: string
    lecture_type: string | null
    semester: string | null
    is_starred: boolean | null
    owner: string | null
    outreach_status: string | null
    university: { id: string; name: string } | null
  }>)

  return hydrateLectures(supabase, baseLectures)
}

export async function getMyVisits(
  semester: string
): Promise<CampaignLecture[]> {
  const { supabase, user } = await requireAuth()

  const { data, error } = await supabase
    .from('lectures')
    .select('id, title, lecture_type, semester, is_starred, owner, outreach_status, university:universities(id, name)')
    .eq('owner', user.id)
    .eq('semester', semester)
    .order('outreach_status')
    .order('title')

  if (error) throw error
  if (!data || data.length === 0) return []

  const baseLectures = (data as unknown as Array<{
    id: string
    title: string
    lecture_type: string | null
    semester: string | null
    is_starred: boolean | null
    owner: string | null
    outreach_status: string | null
    university: { id: string; name: string } | null
  }>)

  return hydrateLectures(supabase, baseLectures)
}

export async function getTeamVisits(
  semester: string
): Promise<
  {
    profile: { id: string; display_name: string | null }
    lectures: CampaignLecture[]
  }[]
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lectures')
    .select('id, title, lecture_type, semester, is_starred, owner, outreach_status, university:universities(id, name)')
    .not('owner', 'is', null)
    .eq('semester', semester)
    .order('title')

  if (error) throw error
  if (!data || data.length === 0) return []

  const baseLectures = (data as unknown as Array<{
    id: string
    title: string
    lecture_type: string | null
    semester: string | null
    is_starred: boolean | null
    owner: string | null
    outreach_status: string | null
    university: { id: string; name: string } | null
  }>)

  const hydrated = await hydrateLectures(supabase, baseLectures)

  // Group by owner
  const grouped = new Map<string, CampaignLecture[]>()
  for (const lecture of hydrated) {
    if (!lecture.owner) continue
    const existing = grouped.get(lecture.owner) ?? []
    existing.push(lecture)
    grouped.set(lecture.owner, existing)
  }

  // Fetch profiles for all owners
  const ownerIds = [...grouped.keys()]
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', ownerIds)

  if (profilesError) throw profilesError

  const profileMap = new Map<
    string,
    { id: string; display_name: string | null }
  >()
  for (const p of profiles ?? []) {
    profileMap.set(p.id, p)
  }

  const result = ownerIds.map((ownerId) => ({
    profile: profileMap.get(ownerId) ?? {
      id: ownerId,
      display_name: null,
    },
    lectures: grouped.get(ownerId) ?? [],
  }))

  // Sort by display_name
  result.sort((a, b) => {
    const nameA = a.profile.display_name ?? ''
    const nameB = b.profile.display_name ?? ''
    return nameA.localeCompare(nameB)
  })

  return result
}

export async function claimLecture(lectureId: string): Promise<void> {
  const { supabase, user } = await requireAuth()

  // Check if already claimed
  const { data: existing, error: checkError } = await supabase
    .from('lectures')
    .select('owner')
    .eq('id', lectureId)
    .single()

  if (checkError) throw checkError
  if (existing?.owner) throw new Error('Lecture already claimed')

  // Atomically claim (only if still unclaimed)
  const { data: updated, error } = await supabase
    .from('lectures')
    .update({ owner: user.id, outreach_status: 'not_contacted' as const })
    .eq('id', lectureId)
    .is('owner', null)
    .select('id')

  if (error) throw error
  if (!updated || updated.length === 0) {
    throw new Error('Lecture already claimed by another member')
  }

  revalidatePath('/campaigns')
}

export async function unclaimLecture(lectureId: string): Promise<void> {
  const { supabase, user } = await requireAuth()

  // Check current status
  const { data: lecture, error: checkError } = await supabase
    .from('lectures')
    .select('outreach_status')
    .eq('id', lectureId)
    .eq('owner', user.id)
    .single()

  if (checkError) throw checkError
  if (lecture?.outreach_status !== 'not_contacted') {
    throw new Error('Cannot unclaim: professor has already been contacted')
  }

  const { error } = await supabase
    .from('lectures')
    .update({ owner: null, outreach_status: null })
    .eq('id', lectureId)
    .eq('owner', user.id)
    .eq('outreach_status', 'not_contacted')

  if (error) throw error

  revalidatePath('/campaigns')
}

export async function updateOutreachStatus(
  lectureId: string,
  status: 'emailed' | 'confirmed' | 'declined' | 'done'
): Promise<void> {
  const { supabase, user } = await requireAuth()

  const { error } = await supabase
    .from('lectures')
    .update({ outreach_status: status })
    .eq('id', lectureId)
    .eq('owner', user.id)

  if (error) throw error

  revalidatePath('/campaigns')
}

export async function checkProfessorDedup(
  lectureId: string,
  semester: string
): Promise<ProfessorDedupWarning[]> {
  const supabase = await createClient()

  // Get professor IDs for this lecture
  const { data: lecProfs, error: lpError } = await supabase
    .from('lecture_professors')
    .select('professor_id')
    .eq('lecture_id', lectureId)

  if (lpError) throw lpError
  if (!lecProfs || lecProfs.length === 0) return []

  const professorIds = lecProfs.map((r) => r.professor_id)

  // Find other lectures in same semester taught by the same professors
  const { data: otherLecProfs, error: olpError } = await supabase
    .from('lecture_professors')
    .select('lecture_id, professor_id')
    .in('professor_id', professorIds)
    .neq('lecture_id', lectureId)

  if (olpError) throw olpError
  if (!otherLecProfs || otherLecProfs.length === 0) return []

  const otherLectureIds = [...new Set(otherLecProfs.map((r) => r.lecture_id))]

  // Get those lectures that are owned and in the same semester
  const { data: claimedLectures, error: clError } = await supabase
    .from('lectures')
    .select('id, title, owner')
    .in('id', otherLectureIds)
    .not('owner', 'is', null)
    .eq('semester', semester)

  if (clError) throw clError
  if (!claimedLectures || claimedLectures.length === 0) return []

  // Fetch owner profiles
  const ownerIds = [
    ...new Set(claimedLectures.map((l) => l.owner).filter(Boolean)),
  ] as string[]
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', ownerIds)

  if (profError) throw profError

  const profileMap = new Map<string, string | null>()
  for (const p of profiles ?? []) {
    profileMap.set(p.id, p.display_name)
  }

  // Fetch professor names
  const { data: professors, error: profsError } = await supabase
    .from('professors')
    .select('id, first_name, last_name')
    .in('id', professorIds)

  if (profsError) throw profsError

  const profNameMap = new Map<string, string>()
  for (const p of professors ?? []) {
    profNameMap.set(
      p.id,
      [p.first_name, p.last_name].filter(Boolean).join(' ')
    )
  }

  // Build a lookup: lectureId → professor_id
  const lectureToProf = new Map<string, string>()
  for (const row of otherLecProfs) {
    // Pick the first matching professor for each lecture
    if (!lectureToProf.has(row.lecture_id)) {
      lectureToProf.set(row.lecture_id, row.professor_id)
    }
  }

  const warnings: ProfessorDedupWarning[] = []
  for (const cl of claimedLectures) {
    const profId = lectureToProf.get(cl.id)
    const professorName = profId ? (profNameMap.get(profId) ?? 'Unknown') : 'Unknown'
    warnings.push({
      professorName,
      otherLectureTitle: cl.title,
      claimedByName: cl.owner ? (profileMap.get(cl.owner) ?? null) : null,
    })
  }

  return warnings
}
