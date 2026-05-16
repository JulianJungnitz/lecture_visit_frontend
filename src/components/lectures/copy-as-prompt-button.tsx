'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface CopyAsPromptButtonProps {
  markdown: string
}

export function CopyAsPromptButton({ markdown }: CopyAsPromptButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (e.g. non-secure context); silently ignore.
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Copy lecture as prompt"
      className="inline-flex items-center gap-1.5 rounded-md border border-black/[0.08] px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-black/[0.15] transition-colors"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy as prompt
        </>
      )}
    </button>
  )
}
