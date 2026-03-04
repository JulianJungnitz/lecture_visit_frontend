import { createClient } from '@/lib/supabase/server'
import { ProfessorSearch } from '@/components/professors/professor-search'
import type { ProfessorWithUniversity } from '@/types/database'

const PAGE_SIZE = 50

export default async function ProfessorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; university?: string; department?: string; page?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const parsedPage = params.page ? parseInt(params.page, 10) : 1
  const page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage)
  const search = params.q?.trim() ?? ''
  const universityFilter = params.university ?? ''
  const departmentFilter = params.department ?? ''

  const offset = (page - 1) * PAGE_SIZE

  // Fetch universities for filter dropdown
  const { data: universities } = await supabase
    .from('universities')
    .select('id, name')
    .order('name')

  // Fetch distinct departments for filter dropdown
  const { data: deptData } = await supabase
    .from('professors')
    .select('department')
    .not('department', 'is', null)
  const departments = [...new Set(
    (deptData ?? []).map(r => r.department).filter(Boolean)
  )].sort() as string[]

  // Build paginated + filtered query
  let query = supabase
    .from('professors')
    .select('*, university:universities(id, name)', { count: 'exact' })

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
  }
  if (universityFilter) {
    const uni = (universities ?? []).find(u => u.name === universityFilter)
    if (uni) query = query.eq('university_id', uni.id)
  }
  if (departmentFilter) {
    query = query.eq('department', departmentFilter)
  }

  const { data, count, error } = await query
    .order('last_name')
    .order('first_name')
    .range(offset, offset + PAGE_SIZE - 1)

  const professors: ProfessorWithUniversity[] = error ? [] : (data as ProfessorWithUniversity[]) ?? []
  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Professors</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse professors from LMU and TUM</p>
      </div>
      <ProfessorSearch
        professors={professors}
        universities={(universities ?? []).map(u => u.name)}
        departments={departments}
        totalCount={totalCount}
        page={page}
        totalPages={totalPages}
      />
    </div>
  )
}
