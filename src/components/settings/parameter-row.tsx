'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Edit2, Check, X } from 'lucide-react'
import { updateParameter } from '@/app/actions/settings'
import type { Parameter } from '@/types/database'

interface ParameterRowProps {
  parameter: Parameter
  onEdit?: () => void
}

export function ParameterRow({ parameter, onEdit }: ParameterRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(parameter.value ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await updateParameter(parameter.key, value)
      setIsEditing(false)
    })
  }

  function handleCancel() {
    setValue(parameter.value ?? '')
    setIsEditing(false)
  }

  // Format key for display
  const displayName = parameter.key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{displayName}</span>

        {onEdit ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
          >
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>
        ) : isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-8 w-64"
              disabled={isPending}
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground max-w-md truncate">
              {parameter.value || '(empty)'}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {parameter.key === 'email_template' && parameter.value && !isEditing && (
        <div className="mt-2 p-3 bg-muted/50 rounded-md">
          <pre className="text-xs whitespace-pre-wrap font-mono">
            {parameter.value.substring(0, 200)}
            {parameter.value.length > 200 && '...'}
          </pre>
        </div>
      )}
    </div>
  )
}
