'use client'

import * as React from 'react'
import { motion } from 'motion/react'
import useMeasure from 'react-use-measure'
import { cn } from '@/lib/utils'

/**
 * SmoothDropdown — a settings-style popover that springs from an icon button
 * into a width/height-animated panel and back. Built on Motion (Framer) plus
 * `react-use-measure` so the panel sizes to its content. Ported from the
 * autokonekt-partner CalendarSettings pattern.
 *
 * Closes on outside click and on Escape.
 */
type SmoothDropdownContextValue = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  contentRef: (node: HTMLDivElement | null) => void
}

const SmoothDropdownContext = React.createContext<
  SmoothDropdownContextValue | undefined
>(undefined)

function useSmoothDropdownContext() {
  const ctx = React.useContext(SmoothDropdownContext)
  if (!ctx) {
    throw new Error(
      'SmoothDropdown components must be used within <SmoothDropdown>',
    )
  }
  return ctx
}

interface SmoothDropdownRootProps {
  className?: string
  children?: React.ReactNode
  /** Pixel width when open. Default 260. */
  openWidth?: number
  /** Pixel size when closed (square). Default 40. */
  closedSize?: number
}

function SmoothDropdownRoot({
  children,
  className,
  openWidth = 260,
  closedSize = 40,
}: SmoothDropdownRootProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [contentRef, contentBounds] = useMeasure()

  React.useEffect(() => {
    if (!isOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  const openHeight = Math.max(closedSize, Math.ceil(contentBounds.height ?? 0))

  const contextValue = React.useMemo(
    () => ({ isOpen, setIsOpen, contentRef }),
    [isOpen, contentRef],
  )

  return (
    <SmoothDropdownContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className="not-prose relative"
        style={{ width: closedSize, height: closedSize }}
      >
        <motion.div
          initial={false}
          animate={{
            width: isOpen ? openWidth : closedSize,
            height: isOpen ? openHeight : closedSize,
            borderRadius: isOpen ? 14 : 12,
          }}
          transition={{
            type: 'spring',
            damping: 34,
            stiffness: 380,
            mass: 0.8,
          }}
          className="absolute right-0 top-0 z-70 origin-top-right overflow-hidden"
          onClick={() => !isOpen && setIsOpen(true)}
        >
          {/*
            Visual chrome (bg/border/shadow/backdrop-filter) lives on a
            child layer so the animated transform on `motion.div` doesn't
            interfere with `backdrop-filter` rendering on some engines.
          */}
          <div
            className={cn(
              'h-full w-full rounded-[inherit] border bg-popover text-popover-foreground shadow-md',
              className,
            )}
          >
            {children}
          </div>
        </motion.div>
      </div>
    </SmoothDropdownContext.Provider>
  )
}

interface SmoothDropdownTriggerProps {
  children?: React.ReactNode
}

function SmoothDropdownTrigger({ children }: SmoothDropdownTriggerProps) {
  const { isOpen } = useSmoothDropdownContext()
  return (
    <motion.div
      initial={false}
      animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0.8 : 1 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 flex cursor-pointer items-center justify-center"
      style={{
        pointerEvents: isOpen ? 'none' : 'auto',
        willChange: 'transform',
      }}
    >
      {children}
    </motion.div>
  )
}

interface SmoothDropdownContentProps {
  children?: React.ReactNode
  className?: string
}

function SmoothDropdownContent({
  children,
  className,
}: SmoothDropdownContentProps) {
  const { isOpen, contentRef } = useSmoothDropdownContext()
  return (
    <div ref={contentRef}>
      <motion.div
        initial={false}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2, delay: isOpen ? 0.08 : 0 }}
        className={cn('p-3', className)}
        style={{
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}

const SmoothDropdown = Object.assign(SmoothDropdownRoot, {
  Trigger: SmoothDropdownTrigger,
  Content: SmoothDropdownContent,
})

export {
  SmoothDropdown,
  SmoothDropdownTrigger,
  SmoothDropdownContent,
  SmoothDropdownRoot,
}
export default SmoothDropdown
