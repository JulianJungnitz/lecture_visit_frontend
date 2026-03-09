import { createClient } from '@/lib/supabase/server'
import { LectureSearch } from '@/components/lectures/lecture-search'
import type { Lecture, University } from '@/types/database'

type LectureWithUniversity = Lecture & { university: University }

const PAGE_SIZE = 50

export default async function LecturesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; university?: string; type?: string; starred?: string; lecturesOnly?: string; page?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const parsedPage = params.page ? parseInt(params.page, 10) : 1
  const page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage)
  const search = params.q?.trim() ?? ''
  const universityFilters = params.university?.split(',').filter(Boolean) ?? []
  const typeFilters = params.type?.split(',').filter(Boolean) ?? []
  const starredFilter = params.starred === 'true'

  const offset = (page - 1) * PAGE_SIZE

  // Fetch universities for filter dropdown
  const { data: universities } = await supabase
    .from('universities')
    .select('id, name')
    .order('name')

  // Fetch distinct lecture types for filter dropdown
  const { data: typeData } = await supabase
    .from('lectures')
    .select('lecture_type')
    .not('lecture_type', 'is', null)
  const lectureTypes = [...new Set(
    (typeData ?? []).map(r => r.lecture_type).filter(Boolean)
  )].sort() as string[]

  // "Lectures only" filter: types containing Vorlesung or Lecture
  const lecturesOnlyFilter = params.lecturesOnly === 'true'
  const lectureOnlyTypes = lectureTypes.filter(t => /vorlesung|lecture/i.test(t))

  // Build paginated + filtered query
  let query = supabase
    .from('lectures')
    .select('*, university:universities(id, name)', { count: 'exact' })

  if (lecturesOnlyFilter && lectureOnlyTypes.length > 0) {
    query = query.in('lecture_type', lectureOnlyTypes)
  }
  if (search) {
    query = query.ilike('title', `%${search}%`)
  }
  if (universityFilters.length > 0) {
    const uniIds = (universities ?? []).filter(u => universityFilters.includes(u.name)).map(u => u.id)
    if (uniIds.length > 0) query = query.in('university_id', uniIds)
  }
  if (typeFilters.length > 0) {
    query = query.in('lecture_type', typeFilters)
  }
  if (starredFilter) {
    query = query.eq('is_starred', true)
  }

  const { data, count, error } = await query
    .order('is_starred', { ascending: false, nullsFirst: false })
    .order('title')
    .range(offset, offset + PAGE_SIZE - 1)

  const lectures: LectureWithUniversity[] = error ? [] : (data as LectureWithUniversity[]) ?? []
  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Lectures</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse lectures from LMU and TUM</p>
      </div>
      <LectureSearch
        lectures={lectures}
        universities={(universities ?? []).map(u => u.name)}
        lectureTypes={lectureTypes}
        lecturesOnly={lecturesOnlyFilter}
        totalCount={totalCount}
        page={page}
        totalPages={totalPages}
      />
    </div>
  )
}
