'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Mail, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Professor, LectureSchedule } from '@/types/database'
import { extrapolateDates, hasMoreDates, WEEKS_PER_PAGE } from '@/lib/date-utils'
import type { ExtrapolatedDate } from '@/lib/date-utils'

function getSalutation(gender: string | null): string | null {
  if (gender === 'male') return 'Herr'
  if (gender === 'female') return 'Frau'
  return null
}

type Props = {
  open: boolean
  onClose: () => void
  lectureId: string
  lectureTitle: string
  onSent: (selectedDate: ExtrapolatedDate) => void
}

export function GenerateEmailDialog({ open, onClose, lectureId, lectureTitle, onSent }: Props) {
  const [professors, setProfessors] = useState<Professor[]>([])
  const [loading, setLoading] = useState(false)
  const [emailTemplate, setEmailTemplate] = useState('')
  const [selectedToId, setSelectedToId] = useState<string | null>(null)
  const [ccIds, setCcIds] = useState<Set<string>>(new Set())
  const [schedules, setSchedules] = useState<LectureSchedule[]>([])
  const [weeksOffset, setWeeksOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<ExtrapolatedDate | null>(null)
  const [scholarName, setScholarName] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const [profsRes, templateRes, schedulesRes, profileRes] = await Promise.all([
        supabase
          .from('lecture_professors')
          .select('professor:professors(*)')
          .eq('lecture_id', lectureId),
        supabase
          .from('parameters')
          .select('value')
          .eq('key', 'email_template')
          .single(),
        supabase
          .from('lecture_schedules')
          .select('*')
          .eq('lecture_id', lectureId),
        user ? supabase.from('profiles').select('display_name').eq('id', user.id).single() : null,
      ])

      const profs = (profsRes.data?.map(r => (r as Record<string, unknown>).professor).filter(Boolean) ?? []) as unknown as Professor[]
      setProfessors(profs)

      if (profs.length === 1) {
        setSelectedToId(profs[0].id)
        setCcIds(new Set())
      } else if (profs.length > 1) {
        setSelectedToId(profs[0].id)
        setCcIds(new Set())
      }

      setEmailTemplate(templateRes.data?.value ?? '')
      setScholarName(profileRes?.data?.display_name ?? '')

      const fetchedSchedules = (schedulesRes.data ?? []) as LectureSchedule[]
      setSchedules(fetchedSchedules)
      setWeeksOffset(0)
      setSelectedDate(null)
    } catch (error) {
      console.error('Error fetching email data:', error)
    } finally {
      setLoading(false)
    }
  }, [lectureId])

  useEffect(() => {
    if (open) {
      fetchData()
    } else {
      setProfessors([])
      setSelectedToId(null)
      setCcIds(new Set())
      setEmailTemplate('')
      setSchedules([])
      setWeeksOffset(0)
      setSelectedDate(null)
      setScholarName('')
    }
  }, [open, fetchData])

  const availableDates = extrapolateDates(schedules, weeksOffset)
  const canShowMore = hasMoreDates(schedules, weeksOffset)

  const selectedProf = professors.find(p => p.id === selectedToId)

  const hasUnfilledPlaceholders = (text: string) => /\{[^}]+\}/.test(text)

  const renderHighlighted = (text: string) => {
    const parts = text.split(/(\{[^}]+\})/)
    return parts.map((part, i) =>
      /^\{[^}]+\}$/.test(part)
        ? <span key={i} className="bg-amber-200 text-amber-900 rounded px-0.5">{part}</span>
        : part
    )
  }

  const resolvedBody = (() => {
    let body = emailTemplate
    if (selectedProf) {
      const salutation = getSalutation(selectedProf.gender)
      if (salutation) body = body.replace(/\{salutation\}/g, salutation)
      if (selectedProf.last_name) body = body.replace(/\{prof_name\}/g, selectedProf.last_name)
    }
    if (scholarName) {
      body = body.replace(/\{scholar_name\}/g, scholarName)
      body = body.replace(/\{full_name_scholare\}/g, scholarName)
    }
    body = body.replace(/\{lecture_name\}/g, lectureTitle)
    if (selectedDate) {
      body = body.replace(/\{week_day\}/g, selectedDate.weekDay)
      body = body.replace(/\{date\}/g, selectedDate.dateStr)
    }
    return body
  })()

  const toEmail = selectedProf?.email ?? ''
  const ccEmails = professors.filter(p => ccIds.has(p.id) && p.email).map(p => p.email!)

  const mailtoHref = (() => {
    const params: string[] = []
    if (ccEmails.length > 0) params.push(`cc=${encodeURIComponent(ccEmails.join(','))}`)
    params.push(`subject=${encodeURIComponent(lectureTitle)}`)
    params.push(`body=${encodeURIComponent(resolvedBody)}`)
    const qs = params.join('&')
    return `mailto:${encodeURIComponent(toEmail)}?${qs}`
  })()

  const handleOpenMail = () => {
    if (!selectedDate) return
    window.location.href = mailtoHref
    onSent(selectedDate)
    onClose()
  }

  const toggleCc = (id: string) => {
    setCcIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/40 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          className="bg-background rounded-lg shadow-xl border w-full max-w-lg max-h-[85vh] flex flex-col animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b">
            <h2 className="text-lg font-semibold">Generate Email</h2>
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
          ) : (
            <ScrollArea className="flex-1 overflow-auto">
              <div className="px-5 py-4 space-y-4">
                {/* To selection - only show if multiple professors */}
                {professors.length > 1 && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">To</Label>
                    <div className="space-y-1.5">
                      {professors.map(prof => (
                        <label
                          key={prof.id}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors',
                            selectedToId === prof.id
                              ? 'border-foreground bg-muted'
                              : 'border-transparent hover:bg-muted/50'
                          )}
                        >
                          <input
                            type="radio"
                            name="to-professor"
                            checked={selectedToId === prof.id}
                            onChange={() => {
                              setSelectedToId(prof.id)
                              setCcIds(prev => {
                                const next = new Set(prev)
                                next.delete(prof.id)
                                return next
                              })
                            }}
                            className="accent-foreground"
                          />
                          <span className="text-sm">
                            {prof.title} {prof.first_name} {prof.last_name}
                          </span>
                          {prof.email && (
                            <span className="text-xs text-muted-foreground ml-auto">{prof.email}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* CC selection - only show if multiple professors */}
                {professors.length > 1 && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">CC</Label>
                    <div className="space-y-1.5">
                      {professors
                        .filter(p => p.id !== selectedToId)
                        .map(prof => (
                          <label
                            key={prof.id}
                            className={cn(
                              'flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors',
                              ccIds.has(prof.id)
                                ? 'border-foreground bg-muted'
                                : 'border-transparent hover:bg-muted/50'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={ccIds.has(prof.id)}
                              onChange={() => toggleCc(prof.id)}
                              className="accent-foreground"
                            />
                            <span className="text-sm">
                              {prof.title} {prof.first_name} {prof.last_name}
                            </span>
                            {prof.email && (
                              <span className="text-xs text-muted-foreground ml-auto">{prof.email}</span>
                            )}
                          </label>
                        ))}
                    </div>
                  </div>
                )}

                {/* Single professor display */}
                {professors.length === 1 && selectedProf && (
                  <div>
                    <Label className="text-sm font-medium mb-1 block">To</Label>
                    <p className="text-sm">
                      {selectedProf.title} {selectedProf.first_name} {selectedProf.last_name}
                      {selectedProf.email && (
                        <span className="text-muted-foreground ml-1">({selectedProf.email})</span>
                      )}
                    </p>
                  </div>
                )}

                {professors.length === 0 && (
                  <p className="text-sm text-muted-foreground">No professors found for this lecture.</p>
                )}

                {/* Date selection */}
                {schedules.length > 0 && (
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
                          <span className="text-sm">{d.label}</span>
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
                )}

                {/* Email preview */}
                {resolvedBody && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Email Preview
                      {hasUnfilledPlaceholders(resolvedBody) && (
                        <span className="text-amber-600 font-normal ml-2 text-xs">— unfilled placeholders</span>
                      )}
                    </Label>
                    <div className="p-3 bg-muted/50 rounded-md border">
                      <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                        {renderHighlighted(resolvedBody)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Footer */}
          <div className="px-5 py-4 border-t flex items-center gap-2">
            <p className="text-xs text-amber-600 flex-1">Use your study email @manageandmore often goes to spam.</p>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleOpenMail}
              disabled={!selectedProf?.email || !selectedDate || loading}
            >
              <Mail className="h-4 w-4" />
              Open in Mail
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
