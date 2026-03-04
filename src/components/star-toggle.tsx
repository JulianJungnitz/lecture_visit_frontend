'use client'

import { useState, useTransition } from 'react'
import { Star } from 'lucide-react'
import { toggleLectureStar, toggleProgramStar } from '@/app/actions/programs'

interface StarToggleProps {
  id: string
  type: 'lecture' | 'program'
  initialStarred: boolean
  size?: 'sm' | 'md'
}

export function StarToggle({ id, type, initialStarred, size = 'md' }: StarToggleProps) {
  const [starred, setStarred] = useState(initialStarred)
  const [, startTransition] = useTransition()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const next = !starred
    setStarred(next)
    startTransition(() => {
      if (type === 'lecture') toggleLectureStar(id, next)
      else toggleProgramStar(id, next)
    })
  }

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group shrink-0 rounded p-1 transition-colors hover:bg-yellow-50"
      aria-label={starred ? `Unstar ${type}` : `Star ${type}`}
    >
      <Star
        className={`${iconSize} transition-colors ${
          starred
            ? 'text-yellow-500 fill-yellow-500'
            : 'text-muted-foreground/30 group-hover:text-yellow-400'
        }`}
      />
    </button>
  )
}
