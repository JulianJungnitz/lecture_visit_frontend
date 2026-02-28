'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SearchInput } from '@/components/search-input'
import { UniversityBadge } from '@/components/university-badge'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
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
}

export function ProgramSearch({ programs }: ProgramSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUniversity, setSelectedUniversity] = useState('__all__')
  const [selectedDegreeType, setSelectedDegreeType] = useState('__all__')
  const [selectedCategory, setSelectedCategory] = useState('__all__')

  const universities = [...new Set(programs.map((p) => p.university.name))]
  const degreeTypes = [...new Set(programs.map((p) => p.degree_type))]
  const categories = [...new Set(programs.map((p) => p.category).filter(Boolean))] as string[]

  const filtered = programs.filter((program) => {
    const matchesSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesUniversity =
      selectedUniversity === '__all__' || program.university.name === selectedUniversity
    const matchesDegreeType =
      selectedDegreeType === '__all__' || program.degree_type === selectedDegreeType
    const matchesCategory = selectedCategory === '__all__' || program.category === selectedCategory
    return matchesSearch && matchesUniversity && matchesDegreeType && matchesCategory
  })

  const count = filtered.length
  const countLabel = `${count} ${count === 1 ? 'program' : 'programs'}`

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-48">
          <SearchInput
            placeholder="Search programs..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>

        <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
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

        <Select value={selectedDegreeType} onValueChange={setSelectedDegreeType}>
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
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
      {filtered.length === 0 ? (
        <EmptyState
          title="No programs found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((program) => (
            <Link
              key={program.id}
              href={`/programs/${program.id}`}
              className="group block"
            >
              <div className="rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/50">
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
    </div>
  )
}
