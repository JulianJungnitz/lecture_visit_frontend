'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

type SidePanelProps = {
  open: boolean
  onClose: () => void
  title?: string
  headerActions?: React.ReactNode
  children: React.ReactNode
  width?: string
  className?: string
}

export function SidePanel({
  open,
  onClose,
  title,
  headerActions,
  children,
  width = 'w-[600px]',
  className
}: SidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  // Focus trap
  useEffect(() => {
    if (!open) return

    const panel = panelRef.current
    if (!panel) return

    // Focus the panel when it opens
    panel.focus()
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'side-panel-title' : undefined}
        tabIndex={-1}
        className={cn(
          'fixed right-0 top-0 h-full bg-background border-l shadow-xl',
          'animate-slide-in-from-right',
          'w-full sm:w-1/2',
          'flex flex-col',
          'focus:outline-none',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b">
          {title && (
            <h2 id="side-panel-title" className="text-lg font-semibold truncate min-w-0">
              {title}
            </h2>
          )}
          {!title && <div />}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-4">
            {children}
          </div>
        </ScrollArea>
      </div>
    </div>,
    document.body
  )
}