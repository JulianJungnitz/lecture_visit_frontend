'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiFilterSelectProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  className?: string
}

export function MultiFilterSelect({ label, options, selected, onChange, className }: MultiFilterSelectProps) {
  const [open, setOpen] = useState(false)
  const [localSelected, setLocalSelected] = useState(selected)
  const ref = useRef<HTMLDivElement>(null)

  // Sync from parent when closed
  useEffect(() => {
    if (!open) setLocalSelected(selected)
  }, [selected, open])

  // Flush local state to parent on close
  const close = useCallback(() => {
    setOpen(false)
    // Compare to avoid unnecessary URL updates
    const sorted = [...localSelected].sort()
    const sortedProp = [...selected].sort()
    if (sorted.join(',') !== sortedProp.join(',')) {
      onChange(localSelected)
    }
  }, [localSelected, selected, onChange])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close()
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, close])

  function toggle(value: string) {
    setLocalSelected(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const displayLabel = localSelected.length === 0
    ? label
    : localSelected.length === 1
      ? localSelected[0]
      : `${localSelected.length} selected`

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-1 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring',
          localSelected.length > 0 ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          {options.map(option => {
            const isSelected = localSelected.includes(option)
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggle(option)}
                className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              >
                <span className="truncate">{option}</span>
                {isSelected && (
                  <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
