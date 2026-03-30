'use server'

import { createClient } from '@/lib/supabase/server'
import Mailjet from 'node-mailjet'

function getMailjet() {
  return new Mailjet({
    apiKey: process.env.MAILJET_API_KEY!,
    apiSecret: process.env.MAILJET_SECRET_KEY!,
  })
}

function getOrganizerDetails() {
  return {
    email: process.env.CALENDAR_ORGANIZER_EMAIL || 'contact@mm-reimburse-me.com',
    name: process.env.CALENDAR_ORGANIZER_NAME || 'Lecture Visit Tool',
  }
}

function buildIcs({
  uid,
  summary,
  location,
  dtStart,
  dtEnd,
  method = 'REQUEST',
  status = 'CONFIRMED',
  organizerEmail,
  organizerName,
  attendeeEmail,
  attendeeName,
  partstat,
}: {
  uid: string
  summary: string
  location?: string
  dtStart: string
  dtEnd: string
  method?: 'REQUEST' | 'CANCEL'
  status?: 'CONFIRMED' | 'CANCELLED'
  organizerEmail: string
  organizerName: string
  attendeeEmail: string
  attendeeName?: string
  partstat?: 'NEEDS-ACTION' | 'ACCEPTED' | 'DECLINED'
}): string {
  const defaultPartstat = method === 'CANCEL' ? 'DECLINED' : 'NEEDS-ACTION'
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LectureVisitTool//EN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `ORGANIZER;CN=${organizerName}:MAILTO:${organizerEmail}`,
    `ATTENDEE;CN=${attendeeName || attendeeEmail};RSVP=TRUE;PARTSTAT=${partstat || defaultPartstat}:MAILTO:${attendeeEmail}`,
  ]
  if (location) lines.push(`LOCATION:${location}`)
  lines.push(
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `STATUS:${status}`,
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

  const organizer = getOrganizerDetails()
  const icsContent = buildIcs({
    uid,
    summary: `Lecture Visit: ${lectureTitle}`,
    location: location ?? undefined,
    dtStart,
    dtEnd,
    method: 'REQUEST',
    status: 'CONFIRMED',
    organizerEmail: organizer.email,
    organizerName: organizer.name,
    attendeeEmail: user.email,
    attendeeName: user.email,
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
        Attachments: [
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

export async function sendAutomaticCalendarBlocker(
  lectureId: string,
  visitAssignedToId: string,
  lectureTitle: string,
  visitScheduledFor: Date,
  location?: string | null,
  durationMinutes?: number,
): Promise<{ success: boolean; ics_uid?: string }> {
  const supabase = await createClient()

  // Get assignee's email from profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', visitAssignedToId)
    .single()

  if (profileError || !profile?.email) {
    throw new Error('Assignee email not found. Please ensure the assignee has an email in their profile.')
  }

  const uid = `${crypto.randomUUID()}@lecture-visit-tool`

  // Calculate end time using provided duration or default to 30 minutes
  const duration = durationMinutes ?? 30
  const endTime = new Date(visitScheduledFor.getTime() + duration * 60 * 1000)

  const dtStart = formatIcsDate(visitScheduledFor)
  const dtEnd = formatIcsDate(endTime)

  const organizer = getOrganizerDetails()
  const icsContent = buildIcs({
    uid,
    summary: `Lecture Visit ${lectureTitle} - Confirmation pending`,
    location: location ?? undefined,
    dtStart,
    dtEnd,
    method: 'REQUEST',
    status: 'CONFIRMED',
    organizerEmail: organizer.email,
    organizerName: organizer.name,
    attendeeEmail: profile.email,
    attendeeName: profile.email,
  })

  const icsBase64 = Buffer.from(icsContent).toString('base64')

  try {
    await getMailjet().post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: 'contact@mm-reimburse-me.com',
            Name: 'Lecture Visit Tool',
          },
          To: [{ Email: profile.email, Name: profile.email }],
          Subject: `Calendar Blocker: ${lectureTitle}`,
          TextPart: `Calendar blocker for "${lectureTitle}" - Confirmation pending.`,
          Attachments: [
            {
              ContentType: 'text/calendar; method=REQUEST',
              Filename: 'invite.ics',
              Base64Content: icsBase64,
            },
          ],
        },
      ],
    })

    return { success: true, ics_uid: uid }
  } catch (error) {
    console.error('Failed to send calendar blocker via Mailjet:', error)
    return { success: false }
  }
}

export async function updateCalendarEvent(
  icsUid: string,
  assigneeEmail: string,
  newTitle: string,
  visitScheduledFor: Date,
  location?: string | null,
  durationMinutes?: number,
): Promise<{ success: boolean }> {
  // Calculate end time using provided duration or default to 30 minutes
  const duration = durationMinutes ?? 30
  const endTime = new Date(visitScheduledFor.getTime() + duration * 60 * 1000)

  const dtStart = formatIcsDate(visitScheduledFor)
  const dtEnd = formatIcsDate(endTime)

  const organizer = getOrganizerDetails()
  const icsContent = buildIcs({
    uid: icsUid,
    summary: newTitle,
    location: location ?? undefined,
    dtStart,
    dtEnd,
    method: 'REQUEST',
    status: 'CONFIRMED',
    organizerEmail: organizer.email,
    organizerName: organizer.name,
    attendeeEmail: assigneeEmail,
    attendeeName: assigneeEmail,
    partstat: 'ACCEPTED',
  })

  const icsBase64 = Buffer.from(icsContent).toString('base64')

  try {
    await getMailjet().post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: 'contact@mm-reimburse-me.com',
            Name: 'Lecture Visit Tool',
          },
          To: [{ Email: assigneeEmail, Name: assigneeEmail }],
          Subject: `Calendar Update: ${newTitle}`,
          TextPart: `Calendar event updated: "${newTitle}"`,
          Attachments: [
            {
              ContentType: 'text/calendar; method=REQUEST',
              Filename: 'invite.ics',
              Base64Content: icsBase64,
            },
          ],
        },
      ],
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to update calendar event via Mailjet:', error)
    return { success: false }
  }
}

export async function cancelCalendarEvent(
  icsUid: string,
  assigneeEmail: string,
  lectureTitle: string,
  visitScheduledFor: Date,
  durationMinutes?: number,
): Promise<{ success: boolean }> {
  // Calculate end time using provided duration or default to 30 minutes
  const duration = durationMinutes ?? 30
  const endTime = new Date(visitScheduledFor.getTime() + duration * 60 * 1000)

  const dtStart = formatIcsDate(visitScheduledFor)
  const dtEnd = formatIcsDate(endTime)

  const organizer = getOrganizerDetails()
  const icsContent = buildIcs({
    uid: icsUid,
    summary: `Lecture Visit ${lectureTitle}`,
    dtStart,
    dtEnd,
    method: 'CANCEL',
    status: 'CANCELLED',
    organizerEmail: organizer.email,
    organizerName: organizer.name,
    attendeeEmail: assigneeEmail,
    attendeeName: assigneeEmail,
  })

  const icsBase64 = Buffer.from(icsContent).toString('base64')

  try {
    await getMailjet().post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: 'contact@mm-reimburse-me.com',
            Name: 'Lecture Visit Tool',
          },
          To: [{ Email: assigneeEmail, Name: assigneeEmail }],
          Subject: `Calendar Cancellation: ${lectureTitle}`,
          TextPart: `Calendar event cancelled: "${lectureTitle}"`,
          Attachments: [
            {
              ContentType: 'text/calendar; method=CANCEL',
              Filename: 'invite.ics',
              Base64Content: icsBase64,
            },
          ],
        },
      ],
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to cancel calendar event via Mailjet:', error)
    return { success: false }
  }
}
