'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog'
import { updateParameter } from '@/app/actions/settings'
import type { Parameter } from '@/types/database'

interface ParameterEditDialogProps {
  parameter: Parameter
  open: boolean
  onClose: () => void
}

export function ParameterEditDialog({ parameter, open, onClose }: ParameterEditDialogProps) {
  const [value, setValue] = useState(parameter.value ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await updateParameter(parameter.key, value)
      onClose()
    })
  }

  const displayName = parameter.key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit {displayName}</AlertDialogTitle>
        </AlertDialogHeader>

        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-h-[300px] font-mono text-sm"
          placeholder={parameter.key === 'email_template'
            ? 'Enter your email template here...'
            : 'Enter value...'}
          disabled={isPending}
        />

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
          >
            Save Changes
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
