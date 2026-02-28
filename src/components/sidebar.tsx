import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import { SemesterSelector } from '@/components/semester-selector'
import { Suspense } from 'react'

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 border-r border-border bg-card flex flex-col z-20">
      <div className="px-4 py-5 border-b border-border">
        <span className="font-semibold text-sm tracking-tight">Lecture Visit</span>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-1">
        <Link
          href="/programs"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <GraduationCap className="h-4 w-4" />
          Programs
        </Link>
      </nav>
      <div className="px-3 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Semester</p>
        <Suspense>
          <SemesterSelector />
        </Suspense>
      </div>
    </aside>
  )
}
