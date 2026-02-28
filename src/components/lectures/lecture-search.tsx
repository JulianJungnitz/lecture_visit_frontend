'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, BookOpen } from 'lucide-react'
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
import type { Lecture, University } from '@/types/database'

type LectureWithUniversity = Lecture & { university: University }

interface LectureSearchProps {
  lectures: LectureWithUniversity[]
}

export function LectureSearch({ lectures }: LectureSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUniversity, setSelectedUniversity] = useState('__all__')
  const [selectedType, setSelectedType] = useState('__all__')
  const [starredOnly, setStarredOnly] = useState('__all__')

  const universities = [...new Set(lectures.map((l) => l.university.name))].sort()
  const lectureTypes = [...new Set(lectures.map((l) => l.lecture_type).filter(Boolean))].sort() as string[]

  const filtered = lectures.filter((lecture) => {
    const matchesSearch = lecture.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesUniversity =
      selectedUniversity === '__all__' || lecture.university.name === selectedUniversity
    const matchesType =
      selectedType === '__all__' || lecture.lecture_type === selectedType
    const matchesStarred =
      starredOnly === '__all__' || lecture.is_starred === true
    return matchesSearch && matchesUniversity && matchesType && matchesStarred
  })

  const count = filtered.length
  const countLabel = `${count} ${count === 1 ? 'lecture' : 'lectures'}`

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-48">
          <SearchInput
            placeholder="Search lectures..."
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

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="Lecture type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All types</SelectItem>
            {lectureTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={starredOnly} onValueChange={setStarredOnly}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="Starred" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All lectures</SelectItem>
            <SelectItem value="starred">Starred only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Result count */}
      <p className="text-sm text-muted-foreground">{countLabel}</p>

      {/* Lecture list */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No lectures found"
          description="Try adjusting your search or filters"
          icon={BookOpen}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((lecture) => (
            <Link
              key={lecture.id}
              href={`/lectures/${lecture.id}`}
              className="group block"
            >
              <div className="rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/50">
                <div className="flex items-center gap-2 flex-wrap">
                  {lecture.is_starred && (
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                  )}
                  <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
                    {lecture.title}
                  </span>
                  <UniversityBadge universityName={lecture.university.name} />
                  {lecture.lecture_type && (
                    <Badge variant="secondary" className="text-xs">
                      {lecture.lecture_type}
                    </Badge>
                  )}
                  {lecture.semester && (
                    <Badge variant="outline" className="text-xs ml-auto">
                      {lecture.semester}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
