'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SEMESTERS = [
  'SoSe 2026', 'WiSe 2026/27', 'SoSe 2027', 'WiSe 2027/28',
  'SoSe 2028', 'WiSe 2028/29', 'SoSe 2029', 'WiSe 2029/30',
  'SoSe 2030', 'WiSe 2030/31'
]

export function SemesterSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('semester') ?? 'SoSe 2026'

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('semester', value)
    router.push(`?${params.toString()}`)
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-full text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SEMESTERS.map(s => (
          <SelectItem key={s} value={s}>{s}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
