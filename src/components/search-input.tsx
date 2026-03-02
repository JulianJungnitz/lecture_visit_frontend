'use client'

import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchInputProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
  debounceMs?: number
}

export function SearchInput({ placeholder, value, onChange, debounceMs = 300 }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Sync from parent when the external value changes (e.g. back button)
  // Skip if a debounce timer is pending — the user is actively typing
  useEffect(() => {
    if (!timerRef.current) {
      setLocalValue(value)
    }
  }, [value])

  function handleChange(next: string) {
    setLocalValue(next)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      onChangeRef.current(next)
    }, debounceMs)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-9"
      />
    </div>
  )
}
