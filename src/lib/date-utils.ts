import type { LectureSchedule } from '@/types/database'

export type ExtrapolatedDate = {
  date: Date
  label: string // e.g. "Di. 31.03.2026, 14:00 - 16:00"
  weekDay: string // e.g. "Dienstag"
  dateStr: string // e.g. "31.03.2026"
  startTime: string // e.g. "14:00"
  endTime: string // e.g. "16:00"
  location?: string | null
}

export const DAY_MAP: Record<string, number> = {
  'Mo': 1, 'Di': 2, 'Mi': 3, 'Do': 4, 'Fr': 5, 'Sa': 6, 'So': 0,
}

export const DAY_FULL_NAME: Record<string, string> = {
  'Mo': 'Montag', 'Di': 'Dienstag', 'Mi': 'Mittwoch', 'Do': 'Donnerstag',
  'Fr': 'Freitag', 'Sa': 'Samstag', 'So': 'Sonntag',
}

export function parseDayTime(dayTime: string): { dayOfWeek: number; startTime: string; endTime: string; dayAbbr: string } | null {
  const match = dayTime.match(/^(Mo|Di|Mi|Do|Fr|Sa|So)\.?\s+(\d{1,2}:\d{2})\s+bis\s+(\d{1,2}:\d{2})/)
  if (!match) return null
  const dayOfWeek = DAY_MAP[match[1]]
  if (dayOfWeek === undefined) return null
  return { dayOfWeek, startTime: match[2], endTime: match[3], dayAbbr: match[1] }
}

export function parseDateRange(dateRange: string): { start: Date; end: Date } | null {
  const match = dateRange.match(/(\d{2})\.(\d{2})\.(\d{4})\s*-\s*(\d{2})\.(\d{2})\.(\d{4})/)
  if (!match) return null
  return {
    start: new Date(+match[3], +match[2] - 1, +match[1]),
    end: new Date(+match[6], +match[5] - 1, +match[4]),
  }
}

export const WEEKS_PER_PAGE = 2

export function extrapolateDates(schedules: LectureSchedule[], weeksOffset: number): ExtrapolatedDate[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const pageStart = new Date(today)
  pageStart.setDate(pageStart.getDate() + weeksOffset * 7)
  const pageEnd = new Date(pageStart)
  pageEnd.setDate(pageEnd.getDate() + WEEKS_PER_PAGE * 7)

  const results: ExtrapolatedDate[] = []

  for (const schedule of schedules) {
    if (!schedule.day_time) continue
    const parsed = parseDayTime(schedule.day_time)
    if (!parsed) continue

    const range = schedule.date_range ? parseDateRange(schedule.date_range) : null
    const windowStart = new Date(Math.max(pageStart.getTime(), today.getTime(), range?.start.getTime() ?? 0))
    const windowEnd = new Date(Math.min(pageEnd.getTime(), range?.end.getTime() ?? pageEnd.getTime()))

    if (windowStart > windowEnd) continue

    const cursor = new Date(windowStart)
    const diff = (parsed.dayOfWeek - cursor.getDay() + 7) % 7
    cursor.setDate(cursor.getDate() + diff)

    while (cursor <= windowEnd) {
      const dd = String(cursor.getDate()).padStart(2, '0')
      const mm = String(cursor.getMonth() + 1).padStart(2, '0')
      const yyyy = cursor.getFullYear()
      const dateStr = `${dd}.${mm}.${yyyy}`
      results.push({
        date: new Date(cursor),
        label: `${parsed.dayAbbr}. ${dateStr}, ${parsed.startTime} - ${parsed.endTime}`,
        weekDay: DAY_FULL_NAME[parsed.dayAbbr] ?? parsed.dayAbbr,
        dateStr,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        location: schedule.location,
      })
      cursor.setDate(cursor.getDate() + 7)
    }
  }

  results.sort((a, b) => a.date.getTime() - b.date.getTime())
  return results
}

export function hasMoreDates(schedules: LectureSchedule[], weeksOffset: number): boolean {
  return extrapolateDates(schedules, weeksOffset + WEEKS_PER_PAGE).length > 0
}
