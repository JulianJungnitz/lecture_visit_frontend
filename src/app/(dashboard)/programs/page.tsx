import { supabase } from '@/lib/supabase'
import { ProgramSearch } from '@/components/programs/program-search'
import type { StudyProgramWithUniversity } from '@/types/database'

const PAGE_SIZE = 50

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; university?: string; degree?: string; category?: string; page?: string }>
}) {
  const params = await searchParams
  const parsedPage = params.page ? parseInt(params.page, 10) : 1
  const page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage)
  const search = params.q?.trim() ?? ''
  const universityFilter = params.university ?? ''
  const degreeFilter = params.degree ?? ''
  const categoryFilter = params.category ?? ''

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
  if (universityFilter) {
    const uni = (universities ?? []).find(u => u.name === universityFilter)
    if (uni) query = query.eq('university_id', uni.id)
  }
  if (degreeFilter) {
    query = query.eq('degree_type', degreeFilter)
  }
  if (categoryFilter) {
    query = query.eq('category', categoryFilter)
  }

  const { data, count, error } = await query
    .order('name')
    .range(offset, offset + PAGE_SIZE - 1)

  const programs: StudyProgramWithUniversity[] = error ? [] : (data as StudyProgramWithUniversity[]) ?? []
  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div>
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
      />
    </div>
  )
}
