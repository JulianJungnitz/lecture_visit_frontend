'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ParameterRow } from './parameter-row'
import { ParameterEditDialog } from './parameter-edit-dialog'
import type { Parameter } from '@/types/database'

interface SettingsTableProps {
  parameters: Parameter[]
}

export function SettingsTable({ parameters }: SettingsTableProps) {
  const [editingParam, setEditingParam] = useState<Parameter | null>(null)

  // Determine which parameters should use dialog editing
  const longTextParams = ['email_template']

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>System Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {parameters.map(param => (
            <ParameterRow
              key={param.key}
              parameter={param}
              onEdit={longTextParams.includes(param.key)
                ? () => setEditingParam(param)
                : undefined
              }
            />
          ))}
        </CardContent>
      </Card>

      {editingParam && (
        <ParameterEditDialog
          parameter={editingParam}
          open={!!editingParam}
          onClose={() => setEditingParam(null)}
        />
      )}
    </>
  )
}
