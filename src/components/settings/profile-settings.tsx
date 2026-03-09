'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateUserProfile } from '@/app/actions/settings'
import { useToast } from '@/hooks/use-toast'
import type { Profile } from '@/types/database'

interface ProfileSettingsProps {
  profile: Profile | null
}

export function ProfileSettings({ profile }: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      try {
        await updateUserProfile(displayName)
        toast({
          title: 'Profile updated',
          description: 'Your display name has been updated successfully.',
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update profile. Please try again.',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Manage your personal profile information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              disabled={isPending}
            />
            <p className="text-sm text-muted-foreground">
              This is how your name will appear throughout the application.
            </p>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}