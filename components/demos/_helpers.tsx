'use client'

import * as React from 'react'
import {
  Shaduler,
  ShadulerContent,
  minutesToTime,
  type ShadulerColumn,
} from '@/components/ui/shaduler'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/** Shared frame around every recipe demo so heights stay consistent. */
export function ShadulerFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[520px]">
      <Shaduler>
        <ShadulerContent>{children}</ShadulerContent>
      </Shaduler>
    </div>
  )
}

export function Toggle({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean
  onCheckedChange: (next: boolean) => void
  label: string
}) {
  const id = React.useId()
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="h-4 w-7 [&>span]:size-3 [&>span]:data-[state=checked]:translate-x-3"
      />
      <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
        {label}
      </Label>
    </div>
  )
}

export function RangePreview({
  range,
  columns,
  hourHeight,
  startHour,
  startMinute = 0,
}: {
  range: {
    columnId: string | number
    startMinutes: number
    endMinutes: number
  }
  columns: ShadulerColumn[]
  hourHeight: number
  startHour: number
  startMinute?: number
}) {
  const colIndex = columns.findIndex((c) => c.id === range.columnId)
  if (colIndex === -1) return null
  const top =
    ((range.startMinutes - (startHour * 60 + startMinute)) / 60) * hourHeight
  const height = ((range.endMinutes - range.startMinutes) / 60) * hourHeight
  const colWidthPercent = 100 / columns.length
  return (
    <div
      data-slot="shaduler-range-preview"
      className={cn(
        'pointer-events-none absolute z-20 rounded-md border-2 border-primary bg-primary/15',
      )}
      style={{
        left: `${colIndex * colWidthPercent}%`,
        width: `${colWidthPercent}%`,
        top,
        height,
        boxSizing: 'border-box',
      }}
    >
      <span className="absolute left-1 top-1 text-xs font-medium text-primary">
        {minutesToTime(range.startMinutes)} → {minutesToTime(range.endMinutes)}
      </span>
    </div>
  )
}

export const sampleColumns: ShadulerColumn[] = [
  { id: 'a', label: 'Resource A' },
  { id: 'b', label: 'Resource B' },
  { id: 'c', label: 'Resource C' },
]

export const sampleTasks = [
  { id: 1, column: 'a', name: 'Morning sync', startTime: '09:00', endTime: '10:00' },
  { id: 2, column: 'a', name: 'Workout', startTime: '11:00', endTime: '12:30' },
  { id: 3, column: 'b', name: 'Design review', startTime: '10:00', endTime: '11:30' },
  { id: 4, column: 'b', name: 'Lunch', startTime: '13:00', endTime: '14:00' },
  { id: 5, column: 'c', name: 'Deep work', startTime: '14:00', endTime: '17:00' },
]
