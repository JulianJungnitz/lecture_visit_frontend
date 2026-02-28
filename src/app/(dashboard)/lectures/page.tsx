import { supabase } from '@/lib/supabase'
import { LectureSearch } from '@/components/lectures/lecture-search'
import type { Lecture, University } from '@/types/database'

type LectureWithUniversity = Lecture & { university: University }

export default async function LecturesPage() {
  const { data, error } = await supabase
    .from('lectures')
    .select('*, university:universities(id, name)')
    .order('title')

  const lectures: LectureWithUniversity[] = error ? [] : (data as LectureWithUniversity[]) ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Lectures</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse lectures from LMU and TUM</p>
      </div>
      <LectureSearch lectures={lectures} />
    </div>
  )
}
