import { supabase } from '@/lib/supabase'
import { ProgramSearch } from '@/components/programs/program-search'
import type { StudyProgramWithUniversity } from '@/types/database'

export default async function ProgramsPage() {
  const { data, error } = await supabase
    .from('study_programs')
    .select('*, university:universities(id, name)')
    .order('name')

  const programs: StudyProgramWithUniversity[] = error ? [] : (data as StudyProgramWithUniversity[]) ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Study Programs</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse programs from LMU and TUM</p>
      </div>
      <ProgramSearch programs={programs} />
    </div>
  )
}
