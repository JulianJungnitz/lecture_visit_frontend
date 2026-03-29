'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { OutreachStatus } from '@/types/database'

export async function addLectureToBoard(lectureId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Set owner and initial status on lecture
  const { error } = await supabase
    .from('lectures')
    .update({
      owner: user.id,
      outreach_status: 'not_contacted'
    })
    .eq('id', lectureId)

  if (error) throw error

  revalidatePath('/scheduled')
}

export async function updateLectureStatus(
  lectureId: string,
  status: OutreachStatus,
  estimatedAttendees?: number | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const updateData: Record<string, unknown> = { outreach_status: status }
  if (estimatedAttendees !== undefined) {
    updateData.estimated_attendees = estimatedAttendees
  }

  const { error } = await supabase
    .from('lectures')
    .update(updateData)
    .eq('id', lectureId)
    .eq('owner', user.id)

  if (error) throw error

  revalidatePath('/scheduled')
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