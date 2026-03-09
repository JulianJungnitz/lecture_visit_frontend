'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Parameter, Profile } from '@/types/database'

export async function getParameters(): Promise<Parameter[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('parameters')
    .select('*')
    .order('key')

  if (error) throw error
  return data ?? []
}

export async function updateParameter(key: string, value: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('parameters')
    .update({ value })
    .eq('key', key)

  if (error) throw error
  revalidatePath('/settings')
}

export async function ensureEmailTemplate(): Promise<void> {
  const supabase = await createClient()

  // Check if email_template exists
  const { data } = await supabase
    .from('parameters')
    .select('key')
    .eq('key', 'email_template')
    .single()

  if (!data) {
    // Insert email_template if it doesn't exist
    await supabase
      .from('parameters')
      .insert({
        key: 'email_template',
        value: 'Dear Professor {name},\n\n[Your email template here]'
      })
  }
}

export async function getCurrentUserProfile() {
  const supabase = await createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Not authenticated')

  // Get the profile
  let { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If profile doesn't exist, create it
  if (error?.code === 'PGRST116') {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        display_name: user.email?.split('@')[0] || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) throw insertError
    return newProfile
  }

  if (error) throw error
  return data
}

export async function updateUserProfile(displayName: string) {
  const supabase = await createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Not authenticated')

  // Update the profile
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) throw error
  revalidatePath('/settings')
}
