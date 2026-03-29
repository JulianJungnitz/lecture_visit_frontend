'use server'

import { createClient } from '@/lib/supabase/server'
import Mailjet from 'node-mailjet'

function getMailjet() {
  return new Mailjet({
    apiKey: process.env.MAILJET_API_KEY!,
    apiSecret: process.env.MAILJET_SECRET_KEY!,
  })
}

function buildIcs({
  uid,
  summary,
  location,
  dtStart,
  dtEnd,
}: {
  uid: string
  summary: string
  location?: string
  dtStart: string
  dtEnd: string
}): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LectureVisitTool//EN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
  ]
  if (location) lines.push(`LOCATION:${location}`)
  lines.push(
    `DTSTAMP:${formatIcsDate(new Date())}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  )
  return lines.join('\r\n')
}

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function parseGermanDate(dateStr: string, time: string): Date {
  // dateStr: "31.03.2026", time: "14:00"
  const [dd, mm, yyyy] = dateStr.split('.')
  const [hh, min] = time.split(':')
  return new Date(+yyyy, +mm - 1, +dd, +hh, +min)
}

export async function sendCalendarBlocker(
  lectureId: string,
  lectureTitle: string,
  selectedDateStr: string,
  startTime: string,
  endTime: string,
  location?: string | null,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) throw new Error('Not authenticated or no email')

  const uid = `${crypto.randomUUID()}@lecture-visit-tool`

  const dtStart = formatIcsDate(parseGermanDate(selectedDateStr, startTime))
  const dtEnd = formatIcsDate(parseGermanDate(selectedDateStr, endTime))

  const icsContent = buildIcs({
    uid,
    summary: `Lecture Visit: ${lectureTitle}`,
    location: location ?? undefined,
    dtStart,
    dtEnd,
  })

  const icsBase64 = Buffer.from(icsContent).toString('base64')

  await getMailjet().post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: {
          Email: 'contact@mm-reimburse-me.com',
          Name: 'Lecture Visit Tool',
        },
        To: [{ Email: user.email, Name: user.email }],
        Subject: `Calendar Blocker: ${lectureTitle}`,
        TextPart: `Calendar blocker for "${lectureTitle}" on ${selectedDateStr} from ${startTime} to ${endTime}.`,
        InlinedAttachments: [
          {
            ContentType: 'text/calendar; method=REQUEST',
            Filename: 'invite.ics',
            Base64Content: icsBase64,
          },
        ],
      },
    ],
  })

  const { error } = await supabase
    .from('lectures')
    .update({ ics_uid: uid })
    .eq('id', lectureId)

  if (error) throw error

  return { success: true }
}
