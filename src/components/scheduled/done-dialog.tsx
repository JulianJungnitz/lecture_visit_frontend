'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  lectureTitle: string
  onConfirm: (estimatedAttendees: number | null) => void
}

export function DoneDialog({ open, onClose, lectureTitle, onConfirm }: Props) {
  const [value, setValue] = useState('')

  const handleConfirm = () => {
    const parsed = value.trim() ? parseInt(value, 10) : null
    onConfirm(parsed !== null && isNaN(parsed) ? null : parsed)
    setValue('')
  }

  const handleClose = () => {
    setValue('')
    onClose()
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/40 animate-fade-in" onClick={handleClose} aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-xl border w-full max-w-sm flex flex-col animate-fade-in-up">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <h2 className="text-base font-semibold">Mark as Done</h2>
            </div>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              How many people attended <span className="font-medium text-foreground">{lectureTitle}</span> roughly?
            </p>
            <div className="space-y-2">
              <Label htmlFor="attendees">Estimated attendees</Label>
              <Input
                id="attendees"
                type="number"
                min={0}
                placeholder="e.g. 120"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
