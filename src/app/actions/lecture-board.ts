'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { OutreachStatus } from '@/types/database'
import { sendAutomaticCalendarBlocker, updateCalendarEvent, cancelCalendarEvent } from './calendar'

export async function addLectureToBoard(lectureId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Set owner, assignee, and initial status on lecture
  const { error } = await supabase
    .from('lectures')
    .update({
      owner: user.id,
      visit_assigned_to: user.id,
      outreach_status: 'not_contacted'
    })
    .eq('id', lectureId)

  if (error) throw error

  revalidatePath('/scheduled')
}

export async function updateLectureStatus(
  lectureId: string,
  status: OutreachStatus,
  estimatedAttendees?: number | null,
  visitScheduledFor?: string | null,
  durationMinutes?: number
): Promise<{ warning?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const updateData: Record<string, unknown> = { outreach_status: status }
  if (estimatedAttendees !== undefined) {
    updateData.estimated_attendees = estimatedAttendees
  }
  if (visitScheduledFor !== undefined) {
    updateData.visit_scheduled_for = visitScheduledFor
  }

  // Set contacted_at when moving to emailed status
  if (status === 'emailed') {
    updateData.contacted_at = new Date().toISOString()
  }

  // For declined status, clear visit_scheduled_for but keep ics_uid for cancellation matching
  if (status === 'declined') {
    // Keep ics_uid so calendar clients can match the cancellation to the original event
    updateData.visit_scheduled_for = null
  }

  const { error, data } = await supabase
    .from('lectures')
    .update(updateData)
    .eq('id', lectureId)
    .eq('owner', user.id)
    .select('title, visit_assigned_to, visit_scheduled_for, ics_uid')
    .single()

  if (error) throw error

  let calendarWarning: string | undefined

  // Automatic calendar operations based on status change
  if (status === 'emailed') {
    // Validate requirements for sending calendar blocker
    if (!data.visit_assigned_to) {
      calendarWarning = 'Calendar invite not sent: No assignee set for this lecture'
    } else if (!data.visit_scheduled_for) {
      calendarWarning = 'Calendar invite not sent: No visit date selected'
    } else {
      try {
        // Get assignee email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', data.visit_assigned_to)
          .single()

        if (profileError || !profile?.email) {
          calendarWarning = `Calendar invite not sent: Assignee has no email in profile`
        } else {
          // Send automatic calendar blocker
          const result = await sendAutomaticCalendarBlocker(
            lectureId,
            data.visit_assigned_to,
            data.title,
            new Date(data.visit_scheduled_for),
            null,
            durationMinutes
          )

          if (!result.success) {
            calendarWarning = 'Calendar invite failed to send (email service error)'
          } else if (result.ics_uid) {
            // Store the ics_uid in the database
            await supabase
              .from('lectures')
              .update({ ics_uid: result.ics_uid })
              .eq('id', lectureId)
          }
        }
      } catch (calendarError) {
        console.error('Calendar operation failed:', calendarError)
        calendarWarning = `Calendar invite failed: ${calendarError instanceof Error ? calendarError.message : 'Unknown error'}`
      }
    }
  } else if (status === 'confirmed' && data.ics_uid && data.visit_scheduled_for && data.visit_assigned_to) {
    try {
      // Update calendar event when moving to confirmed
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', data.visit_assigned_to)
        .single()

      if (!profile?.email) {
        calendarWarning = 'Calendar update failed: Assignee has no email'
      } else {
        const result = await updateCalendarEvent(
          data.ics_uid,
          profile.email,
          `Lecture Visit ${data.title} - Confirmed`,
          new Date(data.visit_scheduled_for),
          null,
          durationMinutes
        )

        if (!result.success) {
          calendarWarning = 'Calendar update failed (email service error)'
        }
      }
    } catch (calendarError) {
      console.error('Calendar update failed:', calendarError)
      calendarWarning = `Calendar update failed: ${calendarError instanceof Error ? calendarError.message : 'Unknown error'}`
    }
  } else if (status === 'declined' && data.ics_uid && data.visit_scheduled_for && data.visit_assigned_to) {
    try {
      // Cancel calendar event when moving to declined
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', data.visit_assigned_to)
        .single()

      if (!profile?.email) {
        calendarWarning = 'Calendar cancellation failed: Assignee has no email'
      } else {
        const result = await cancelCalendarEvent(
          data.ics_uid,
          profile.email,
          data.title,
          new Date(data.visit_scheduled_for),
          durationMinutes
        )

        if (!result.success) {
          calendarWarning = 'Calendar cancellation failed (email service error)'
        }
      }
    } catch (calendarError) {
      console.error('Calendar cancellation failed:', calendarError)
      calendarWarning = `Calendar cancellation failed: ${calendarError instanceof Error ? calendarError.message : 'Unknown error'}`
    }
  }

  revalidatePath('/scheduled')

  return { warning: calendarWarning }
}

export async function removeLectureFromBoard(lectureId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Remove owner and status from lecture
  const { error } = await supabase
    .from('lectures')
    .update({
      owner: null,
      outreach_status: null
    })
    .eq('id', lectureId)
    .eq('owner', user.id)  // Only allow removing if current user is owner

  if (error) throw error

  revalidatePath('/scheduled')
}