'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, CalendarDays, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { extrapolateDates, hasMoreDates, WEEKS_PER_PAGE } from '@/lib/date-utils'
import type { ExtrapolatedDate } from '@/lib/date-utils'
import type { LectureSchedule } from '@/types/database'
import { sendCalendarBlocker } from '@/app/actions/calendar'

type Props = {
  open: boolean
  onClose: () => void
  lectureId: string
  lectureTitle: string
}

export function CalendarBlockerDialog({ open, onClose, lectureId, lectureTitle }: Props) {
  const [schedules, setSchedules] = useState<LectureSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weeksOffset, setWeeksOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<ExtrapolatedDate | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('lecture_schedules')
      .select('*')
      .eq('lecture_id', lectureId)
    setSchedules((data ?? []) as LectureSchedule[])
    setLoading(false)
  }, [lectureId])

  useEffect(() => {
    if (open) {
      fetchData()
      setSent(false)
      setError(null)
      setSelectedDate(null)
      setWeeksOffset(0)
    } else {
      setSchedules([])
    }
  }, [open, fetchData])

  const availableDates = extrapolateDates(schedules, weeksOffset)
  const canShowMore = hasMoreDates(schedules, weeksOffset)

  const handleSend = async () => {
    if (!selectedDate) return
    setSending(true)
    setError(null)
    try {
      await sendCalendarBlocker(
        lectureId,
        lectureTitle,
        selectedDate.dateStr,
        selectedDate.startTime,
        selectedDate.endTime,
        selectedDate.location,
      )
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send calendar invite')
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/40 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          className="bg-background rounded-lg shadow-xl border w-full max-w-md max-h-[85vh] flex flex-col animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b">
            <h2 className="text-lg font-semibold">Add Calendar Blocker</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sent ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-sm text-muted-foreground">Calendar invite sent to your email!</p>
            </div>
          ) : (
            <ScrollArea className="flex-1 overflow-auto">
              <div className="px-5 py-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-1 block">Lecture</Label>
                  <p className="text-sm text-muted-foreground">{lectureTitle}</p>
                </div>

                {/* Date selection */}
                {schedules.length > 0 ? (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Select Date</Label>
                    <div className="space-y-1.5">
                      {availableDates.map((d, i) => (
                        <label
                          key={i}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors',
                            selectedDate?.label === d.label
                              ? 'border-foreground bg-muted'
                              : 'border-transparent hover:bg-muted/50'
                          )}
                        >
                          <input
                            type="radio"
                            name="select-date"
                            checked={selectedDate?.label === d.label}
                            onChange={() => setSelectedDate(d)}
                            className="accent-foreground"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm">{d.label}</span>
                            {d.location && (
                              <span className="text-xs text-muted-foreground">{d.location}</span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {weeksOffset > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => setWeeksOffset(prev => Math.max(0, prev - WEEKS_PER_PAGE))}
                        >
                          Earlier dates
                        </Button>
                      )}
                      {canShowMore && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs ml-auto"
                          onClick={() => setWeeksOffset(prev => prev + WEEKS_PER_PAGE)}
                        >
                          Later dates
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No schedules found for this lecture.</p>
                )}

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Footer */}
          <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {sent ? 'Close' : 'Cancel'}
            </Button>
            {!sent && (
              <Button
                className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={handleSend}
                disabled={!selectedDate || sending}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarDays className="h-4 w-4" />
                )}
                {sending ? 'Sending...' : 'Send Calendar Invite'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
