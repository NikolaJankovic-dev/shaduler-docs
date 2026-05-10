import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Standard wrapper for live component previews inside MDX.
 *
 * Re-points the shaduler `--background` and `--card` CSS variables to
 * fumadocs's neutral card tone so the demo blends with the docs page palette
 * instead of forcing pure white in light mode and pure black in dark mode.
 */
export function Preview({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'not-prose my-6 [--background:var(--color-fd-card)] [--card:var(--color-fd-card)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
