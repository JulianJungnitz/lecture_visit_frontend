'use client'

import { LogOut } from 'lucide-react'

export function SignOutButton() {
  return (
    <form action="/auth/signout" method="POST">
      <button
        type="submit"
        className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-all duration-200"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </form>
  )
}
