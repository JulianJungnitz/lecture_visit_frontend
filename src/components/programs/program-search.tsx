'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { SearchInput } from '@/components/search-input'
import { UniversityBadge } from '@/components/university-badge'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/pagination'
import { MultiFilterSelect } from '@/components/multi-filter-select'
import { toggleProgramStar } from '@/app/actions/programs'
import type { StudyProgramWithUniversity } from '@/types/database'

interface ProgramSearchProps {
  programs: StudyProgramWithUniversity[]
  universities: string[]
  degreeTypes: string[]
  categories: string[]
  totalCount: number
  page: number
  totalPages: number
}

export function ProgramSearch({
  programs,
  universities,
  degreeTypes,
  categories,
  totalCount,
  page,
  totalPages,
}: ProgramSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [starredIds, setStarredIds] = useState<Set<string>>(
    () => new Set(programs.filter(p => p.is_starred).map(p => p.id))
  )

  const currentSearch = searchParams.get('q') ?? ''
  const currentUniversities = searchParams.get('university')?.split(',').filter(Boolean) ?? []
  const currentDegreeTypes = searchParams.get('degree')?.split(',').filter(Boolean) ?? []
  const currentCategories = searchParams.get('category')?.split(',').filter(Boolean) ?? []
  const isStarredFilter = searchParams.get('starred') === 'true'

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page')
    router.replace(`?${params.toString()}`)
  }

  function updateMultiParam(key: string, values: string[]) {
    updateParam(key, values.join(','))
  }

  function handleStar(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    const nowStarred = !starredIds.has(id)
    setStarredIds(prev => {
      const next = new Set(prev)
      if (nowStarred) next.add(id)
      else next.delete(id)
      return next
    })
    startTransition(() => {
      toggleProgramStar(id, nowStarred)
    })
  }

  const countLabel = `${totalCount} ${totalCount === 1 ? 'program' : 'programs'}`

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-48">
          <SearchInput
            placeholder="Search programs..."
            value={currentSearch}
            onChange={(v) => updateParam('q', v)}
          />
        </div>

        <MultiFilterSelect
          label="University"
          options={universities}
          selected={currentUniversities}
          onChange={(v) => updateMultiParam('university', v)}
          className="w-40"
        />

        <MultiFilterSelect
          label="Degree type"
          options={degreeTypes}
          selected={currentDegreeTypes}
          onChange={(v) => updateMultiParam('degree', v)}
          className="w-40"
        />

        {categories.length > 0 && (
          <MultiFilterSelect
            label="Category"
            options={categories}
            selected={currentCategories}
            onChange={(v) => updateMultiParam('category', v)}
            className="w-44"
          />
        )}

        <Button
          variant={isStarredFilter ? 'default' : 'outline'}
          size="sm"
          className="h-9 px-3"
          onClick={() => updateParam('starred', isStarredFilter ? '' : 'true')}
          title={isStarredFilter ? 'Show all programs' : 'Show starred only'}
        >
          <Star className={`h-4 w-4${isStarredFilter ? ' fill-current' : ''}`} />
        </Button>
      </div>

      {/* Result count */}
      <p className="text-sm text-muted-foreground">{countLabel}</p>

      {/* Program list */}
      {programs.length === 0 ? (
        <EmptyState
          title="No programs found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <div className="space-y-2">
          {programs.map((program) => {
            const starred = starredIds.has(program.id)
            return (
              <Link
                key={program.id}
                href={`/programs/${program.id}`}
                className="group block"
              >
                <div className="rounded-xl border border-black/[0.06] bg-white px-4 py-3 transition-all duration-200 hover:shadow-sm hover:border-black/[0.1]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={(e) => handleStar(e, program.id)}
                      className="shrink-0 rounded p-0.5 transition-colors hover:bg-yellow-50"
                      aria-label={starred ? 'Unstar program' : 'Star program'}
                    >
                      <Star className={`h-3.5 w-3.5 ${starred ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/40 hover:text-yellow-400'}`} />
                    </button>
                    <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
                      {program.name}
                    </span>
                    <UniversityBadge universityName={program.university.name} />
                    <Badge variant="secondary" className="text-xs">
                      {program.degree_type}
                    </Badge>
                  </div>
                  {program.category && (
                    <p className="mt-1 text-xs text-muted-foreground pl-6">{program.category}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  )
}
