import Link from 'next/link'
import { GraduationCap, BookOpen } from 'lucide-react'
import { SemesterSelector } from '@/components/semester-selector'
import { Suspense } from 'react'

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-white/80 backdrop-blur-md shadow-[1px_0_0_0_rgba(0,0,0,0.06)] flex flex-col z-20">
      <div className="px-4 py-4 flex items-center gap-2.5">
        <img
          src="/logo.png"
          alt="Logo"
          className="w-8 h-8 object-contain"
        />
        <span className="font-semibold text-sm tracking-tight text-foreground">Lecture Visit Tool</span>
      </div>
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        <Link
          href="/programs"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-all duration-200"
        >
          <GraduationCap className="h-4 w-4" />
          Programs
        </Link>
        <Link
          href="/lectures"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-all duration-200"
        >
          <BookOpen className="h-4 w-4" />
          Lectures
        </Link>
      </nav>
      <div className="px-4 py-3 border-t border-black/[0.06]">
        <p className="text-xs text-muted-foreground mb-2">Semester</p>
        <Suspense>
          <SemesterSelector />
        </Suspense>
      </div>
    </aside>
  )
}
