import { createClient } from '@/lib/supabase/server'
import { SettingsTable } from '@/components/settings/settings-table'
import { ProfileSettings } from '@/components/settings/profile-settings'
import { ensureEmailTemplate, getCurrentUserProfile } from '@/app/actions/settings'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Ensure email_template exists
  await ensureEmailTemplate()

  // Get current user profile
  const profile = await getCurrentUserProfile().catch(() => null)

  const { data: parameters } = await supabase
    .from('parameters')
    .select('*')
    .order('key')

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your profile and system parameters
        </p>
      </div>

      <div className="space-y-6">
        <ProfileSettings profile={profile} />
        <SettingsTable parameters={parameters ?? []} />
      </div>
    </div>
  )
}
