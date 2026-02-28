'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SearchInput } from '@/components/search-input'
import { UniversityBadge } from '@/components/university-badge'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

  const currentSearch = searchParams.get('q') ?? ''
  const currentUniversity = searchParams.get('university') ?? '__all__'
  const currentDegreeType = searchParams.get('degree') ?? '__all__'
  const currentCategory = searchParams.get('category') ?? '__all__'

  const [searchValue, setSearchValue] = useState(currentSearch)

  // Debounced search — update URL after 300ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== currentSearch) {
        updateParam('q', searchValue)
      }
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  // Sync local search value when URL changes externally (e.g. back button)
  useEffect(() => {
    setSearchValue(currentSearch)
  }, [currentSearch])

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === '__all__') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page')
    router.replace(`?${params.toString()}`)
  }

  const countLabel = `${totalCount} ${totalCount === 1 ? 'program' : 'programs'}`

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-48">
          <SearchInput
            placeholder="Search programs..."
            value={searchValue}
            onChange={setSearchValue}
          />
        </div>

        <Select value={currentUniversity} onValueChange={(v) => updateParam('university', v)}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="University" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All universities</SelectItem>
            {universities.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentDegreeType} onValueChange={(v) => updateParam('degree', v)}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Degree type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All degrees</SelectItem>
            {degreeTypes.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {categories.length > 0 && (
          <Select value={currentCategory} onValueChange={(v) => updateParam('category', v)}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
          {programs.map((program) => (
            <Link
              key={program.id}
              href={`/programs/${program.id}`}
              className="group block"
            >
              <div className="rounded-xl border border-black/[0.06] bg-white px-4 py-3 transition-all duration-200 hover:shadow-sm hover:border-black/[0.1]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
                    {program.name}
                  </span>
                  <UniversityBadge universityName={program.university.name} />
                  <Badge variant="secondary" className="text-xs">
                    {program.degree_type}
                  </Badge>
                </div>
                {program.category && (
                  <p className="mt-1 text-xs text-muted-foreground">{program.category}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  )
}
