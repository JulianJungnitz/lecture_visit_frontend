'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Star, BookOpen } from 'lucide-react'
import { SearchInput } from '@/components/search-input'
import { UniversityBadge } from '@/components/university-badge'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toggleLectureStar } from '@/app/actions/programs'
import type { Lecture, University } from '@/types/database'

type LectureWithUniversity = Lecture & { university: University }

interface LectureSearchProps {
  lectures: LectureWithUniversity[]
  universities: string[]
  lectureTypes: string[]
  totalCount: number
  page: number
  totalPages: number
}

export function LectureSearch({
  lectures,
  universities,
  lectureTypes,
  totalCount,
  page,
  totalPages,
}: LectureSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [starredIds, setStarredIds] = useState<Set<string>>(
    () => new Set(lectures.filter(l => l.is_starred).map(l => l.id))
  )

  const currentSearch = searchParams.get('q') ?? ''
  const currentUniversity = searchParams.get('university') ?? '__all__'
  const currentType = searchParams.get('type') ?? '__all__'
  const isStarredFilter = searchParams.get('starred') === 'true'

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
      toggleLectureStar(id, nowStarred)
    })
  }

  const countLabel = `${totalCount} ${totalCount === 1 ? 'lecture' : 'lectures'}`

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-48">
          <SearchInput
            placeholder="Search lectures..."
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

        <Select value={currentType} onValueChange={(v) => updateParam('type', v)}>
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

        <Button
          variant={isStarredFilter ? 'default' : 'outline'}
          size="sm"
          className="h-9 px-3"
          onClick={() => updateParam('starred', isStarredFilter ? '' : 'true')}
          title={isStarredFilter ? 'Show all lectures' : 'Show starred only'}
        >
          <Star className={`h-4 w-4${isStarredFilter ? ' fill-current' : ''}`} />
        </Button>
      </div>

      {/* Result count */}
      <p className="text-sm text-muted-foreground">{countLabel}</p>

      {/* Lecture list */}
      {lectures.length === 0 ? (
        <EmptyState
          title="No lectures found"
          description="Try adjusting your search or filters"
          icon={BookOpen}
        />
      ) : (
        <div className="space-y-2">
          {lectures.map((lecture) => {
            const starred = starredIds.has(lecture.id)
            return (
              <Link
                key={lecture.id}
                href={`/lectures/${lecture.id}`}
                className="group block"
              >
                <div className="rounded-xl border border-black/[0.06] bg-white px-4 py-3 transition-all duration-200 hover:shadow-sm hover:border-black/[0.1]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={(e) => handleStar(e, lecture.id)}
                      className="shrink-0 rounded p-0.5 transition-colors hover:bg-yellow-50"
                      aria-label={starred ? 'Unstar lecture' : 'Star lecture'}
                    >
                      <Star className={`h-3.5 w-3.5 ${starred ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/40 hover:text-yellow-400'}`} />
                    </button>
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
            )
          })}
        </div>
      )}

      {/* Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  )
}
