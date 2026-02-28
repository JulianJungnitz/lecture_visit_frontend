'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // When pathname changes, the navigation is complete
    setIsNavigating(false)
    setProgress(100)

    const timer = setTimeout(() => {
      setProgress(0)
    }, 300)

    return () => clearTimeout(timer)
  }, [pathname])

  useEffect(() => {
    // Intercept clicks on links to show the progress bar
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      if (
        anchor &&
        anchor.href &&
        anchor.href.startsWith(window.location.origin) &&
        !anchor.target &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        const url = new URL(anchor.href)
        if (url.pathname !== pathname) {
          setIsNavigating(true)
          setProgress(20)
        }
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [pathname])

  useEffect(() => {
    if (!isNavigating) return

    // Simulate progress
    const intervals = [
      setTimeout(() => setProgress(40), 100),
      setTimeout(() => setProgress(60), 300),
      setTimeout(() => setProgress(75), 600),
      setTimeout(() => setProgress(85), 1200),
      setTimeout(() => setProgress(90), 2000),
    ]

    return () => intervals.forEach(clearTimeout)
  }, [isNavigating])

  if (progress === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[2px]">
      <div
        className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
          transition: progress >= 100
            ? 'width 200ms ease-out, opacity 400ms ease-out 200ms'
            : 'width 300ms ease-out',
        }}
      />
    </div>
  )
}
