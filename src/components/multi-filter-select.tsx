'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiFilterSelectProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  className?: string
}

const DROPDOWN_WIDTH = 352 // w-[22rem]

export function MultiFilterSelect({ label, options, selected, onChange, className }: MultiFilterSelectProps) {
  const [open, setOpen] = useState(false)
  const [localSelected, setLocalSelected] = useState(selected)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  // Sync from parent when closed
  useEffect(() => {
    if (!open) setLocalSelected(selected)
  }, [selected, open])

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    let left = rect.left
    if (left + DROPDOWN_WIDTH > window.innerWidth - 16) {
      left = window.innerWidth - DROPDOWN_WIDTH - 16
    }
    if (left < 16) left = 16
    setPos({ top: rect.bottom + 4, left })
  }, [])

  useEffect(() => {
    if (!open) return
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  // Flush local state to parent on close
  const close = useCallback(() => {
    setOpen(false)
    setPos(null)
    const sorted = [...localSelected].sort()
    const sortedProp = [...selected].sort()
    if (sorted.join(',') !== sortedProp.join(',')) {
      onChange(localSelected)
    }
  }, [localSelected, selected, onChange])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
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

  function handleToggle() {
    if (!open) {
      updatePosition()
      setOpen(true)
    } else {
      close()
    }
  }

  const displayLabel = localSelected.length === 0
    ? label
    : localSelected.length === 1
      ? localSelected[0]
      : `${localSelected.length} selected`

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-1 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring',
          localSelected.length > 0 ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>

      {open && pos && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: DROPDOWN_WIDTH }}
          className="z-[100] max-h-60 overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
        >
          {options.map(option => {
            const isSelected = localSelected.includes(option)
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggle(option)}
                className="relative flex w-full cursor-default select-none items-start rounded-sm py-1.5 pl-2 pr-8 text-sm text-left outline-none hover:bg-accent hover:text-accent-foreground"
              >
                <span className="break-words min-w-0 flex-1 pr-1">{option}</span>
                {isSelected && (
                  <span className="absolute right-2 top-1.5 flex h-3.5 w-3.5 items-center justify-center shrink-0">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}
