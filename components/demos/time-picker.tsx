'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Minimal time picker — a Popover trigger that shows `HH:MM` and opens two
 * scrollable columns of buttons (hours 00–23, minutes in 15-min steps). Built
 * on shadcn Popover + Button so it inherits the rest of the project theme.
 */
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 15, 30, 45]

const pad = (n: number) => n.toString().padStart(2, '0')

export interface TimePickerProps {
  value: string
  onChange: (next: string) => void
  className?: string
  /** Override on the popover content (e.g. for a forced dark/glass variant). */
  contentClassName?: string
}

export function TimePicker({
  value,
  onChange,
  className,
  contentClassName,
}: TimePickerProps) {
  const [hour, minute] = value.split(':').map(Number)
  const safeHour = Number.isFinite(hour) ? hour : 0
  const safeMinute = Number.isFinite(minute) ? minute : 0

  const setHour = (h: number) => onChange(`${pad(h)}:${pad(safeMinute)}`)
  const setMinute = (m: number) => onChange(`${pad(safeHour)}:${pad(m)}`)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 justify-between gap-1 px-2 font-mono text-xs tabular-nums',
            className,
          )}
        >
          {pad(safeHour)}:{pad(safeMinute)}
          <ChevronDown className="size-3 text-fd-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn('w-auto p-0', contentClassName)}
      >
        <div className="flex">
          <Column>
            {HOURS.map((h) => (
              <Cell
                key={h}
                active={h === safeHour}
                onClick={() => setHour(h)}
              >
                {pad(h)}
              </Cell>
            ))}
          </Column>
          <Column>
            {MINUTES.map((m) => (
              <Cell
                key={m}
                active={m === safeMinute}
                onClick={() => setMinute(m)}
              >
                {pad(m)}
              </Cell>
            ))}
          </Column>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function Column({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'flex max-h-56 w-16 flex-col overflow-y-auto p-1',
        '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        'border-r last:border-r-0',
      )}
    >
      {children}
    </div>
  )
}

function Cell({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-sm py-1 text-center font-mono text-xs tabular-nums transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}
