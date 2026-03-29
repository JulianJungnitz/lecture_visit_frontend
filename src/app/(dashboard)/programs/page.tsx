import { createClient } from '@/lib/supabase/server'
import { ProgramSearch } from '@/components/programs/program-search'
import type { StudyProgramWithUniversity } from '@/types/database'

const PAGE_SIZE = 50

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; university?: string; degree?: string; category?: string; starred?: string; page?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const parsedPage = params.page ? parseInt(params.page, 10) : 1
  const page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage)
  const search = params.q?.trim() ?? ''
  const universityFilters = params.university?.split(',').filter(Boolean) ?? []
  const degreeFilters = params.degree?.split(',').filter(Boolean) ?? []
  const categoryFilters = params.category?.split(',').filter(Boolean) ?? []
  const starredFilter = params.starred === 'true'

  const offset = (page - 1) * PAGE_SIZE

  // Fetch universities for filter dropdown
  const { data: universities } = await supabase
    .from('universities')
    .select('id, name')
    .order('name')

  // Fetch distinct degree types for filter dropdown
  const { data: degreeData } = await supabase
    .from('study_programs')
    .select('degree_type')
  const degreeTypes = [...new Set(
    (degreeData ?? []).map(r => r.degree_type).filter(Boolean)
  )].sort() as string[]

  // Fetch distinct categories for filter dropdown
  const { data: catData } = await supabase
    .from('study_programs')
    .select('category')
    .not('category', 'is', null)
  const categories = [...new Set(
    (catData ?? []).map(r => r.category).filter(Boolean)
  )].sort() as string[]

  // Build paginated + filtered query
  let query = supabase
    .from('study_programs')
    .select('*, university:universities(id, name)', { count: 'exact' })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }
  if (universityFilters.length > 0) {
    const uniIds = (universities ?? []).filter(u => universityFilters.includes(u.name)).map(u => u.id)
    if (uniIds.length > 0) query = query.in('university_id', uniIds)
  }
  if (degreeFilters.length > 0) {
    query = query.in('degree_type', degreeFilters)
  }
  if (categoryFilters.length > 0) {
    query = query.in('category', categoryFilters)
  }
  if (starredFilter) {
    query = query.eq('is_starred', true)
  }

  const { data, count, error } = await query
    .order('is_starred', { ascending: false, nullsFirst: false })
    .order('name')
    .range(offset, offset + PAGE_SIZE - 1)

  const programs: StudyProgramWithUniversity[] = error ? [] : (data as StudyProgramWithUniversity[]) ?? []
  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const starredCounts: Record<string, number> = {}
  const programIds = programs.map(p => p.id)
  if (programIds.length > 0) {
    const { data: lectureLinks } = await supabase
      .from('lecture_study_programs')
      .select('study_program_id, lecture:lectures(is_starred)')
      .in('study_program_id', programIds)

    for (const link of lectureLinks ?? []) {
      const lec = (link as unknown as { study_program_id: string; lecture: { is_starred: boolean | null } | null }).lecture
      if (lec?.is_starred) {
        starredCounts[link.study_program_id] = (starredCounts[link.study_program_id] ?? 0) + 1
      }
    }
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Study Programs</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse programs from LMU and TUM</p>
      </div>
      <ProgramSearch
        programs={programs}
        universities={(universities ?? []).map(u => u.name)}
        degreeTypes={degreeTypes}
        categories={categories}
        totalCount={totalCount}
        page={page}
        totalPages={totalPages}
        starredCounts={starredCounts}
      />
    </div>
  )
}
