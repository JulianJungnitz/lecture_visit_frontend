'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Users, Mail } from 'lucide-react'
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
import type { ProfessorWithUniversity } from '@/types/database'

function formatProfessorName(prof: ProfessorWithUniversity): string {
  const parts = [prof.title, prof.first_name, prof.last_name].filter(Boolean)
  return parts.join(' ')
}

interface ProfessorSearchProps {
  professors: ProfessorWithUniversity[]
  universities: string[]
  departments: string[]
  totalCount: number
  page: number
  totalPages: number
}

export function ProfessorSearch({
  professors,
  universities,
  departments,
  totalCount,
  page,
  totalPages,
}: ProfessorSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get('q') ?? ''
  const currentUniversity = searchParams.get('university') ?? '__all__'
  const currentDepartment = searchParams.get('department') ?? '__all__'

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

  const countLabel = `${totalCount} ${totalCount === 1 ? 'professor' : 'professors'}`

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-48">
          <SearchInput
            placeholder="Search professors..."
            value={currentSearch}
            onChange={(v) => updateParam('q', v)}
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

        {departments.length > 0 && (
          <Select value={currentDepartment} onValueChange={(v) => updateParam('department', v)}>
            <SelectTrigger className="w-52 h-9 text-sm">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Result count */}
      <p className="text-sm text-muted-foreground">{countLabel}</p>

      {/* Professor list */}
      {professors.length === 0 ? (
        <EmptyState
          title="No professors found"
          description="Try adjusting your search or filters"
          icon={Users}
        />
      ) : (
        <div className="space-y-2">
          {professors.map((professor) => (
            <Link
              key={professor.id}
              href={`/professors/${professor.id}`}
              className="group block"
            >
              <div className="rounded-xl border border-black/[0.06] bg-white px-4 py-3 transition-all duration-200 hover:shadow-sm hover:border-black/[0.1]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
                    {formatProfessorName(professor)}
                  </span>
                  <UniversityBadge universityName={professor.university.name} />
                  {professor.department && (
                    <Badge variant="secondary" className="text-xs">
                      {professor.department}
                    </Badge>
                  )}
                  {professor.email && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {professor.email}
                    </span>
                  )}
                </div>
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
