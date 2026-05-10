'use client'

import { useMemo } from 'react'
import {
  ShadulerCells,
  ShadulerColumnHeader,
  ShadulerColumnsHeader,
  ShadulerCorner,
  ShadulerGrid,
  ShadulerTasksOverlay,
  ShadulerTimeColumn,
  ShadulerTimeSlot,
  calculateShadulerData,
  type ShadulerTaskData,
} from '@/components/ui/shaduler'
import { cn } from '@/lib/utils'
import { ShadulerFrame, sampleColumns } from './_helpers'

const shiftTasks: ShadulerTaskData[] = [
  { id: 'sh1', column: 'a', name: 'Stand-up', startTime: '08:00', endTime: '08:30' },
  { id: 'sh2', column: 'a', name: 'Pair session', startTime: '10:00', endTime: '12:00' },
  { id: 'sh3', column: 'b', name: 'Customer call', startTime: '09:30', endTime: '10:30' },
  { id: 'sh4', column: 'b', name: 'Lunch & learn', startTime: '12:00', endTime: '13:00' },
  { id: 'sh5', column: 'c', name: 'Deep work', startTime: '14:00', endTime: '17:00' },
  { id: 'sh6', column: 'c', name: 'Closing review', startTime: '17:30', endTime: '18:00' },
]

const shiftFor = (hour: number) => {
  if (hour < 9) return { label: 'Pre-shift', tone: 'text-emerald-600 dark:text-emerald-400' }
  if (hour < 12) return { label: 'Morning', tone: 'text-fd-foreground' }
  if (hour < 13) return { label: 'Lunch', tone: 'text-amber-600 dark:text-amber-400' }
  if (hour < 17) return { label: 'Afternoon', tone: 'text-fd-foreground' }
  return { label: 'Closing', tone: 'text-fd-muted-foreground' }
}

const START_HOUR = 8
const END_HOUR = 18
const HOUR_HEIGHT_PX = 60

export function DemoCustomLabels() {
  const calc = useMemo(
    () =>
      calculateShadulerData(
        sampleColumns,
        shiftTasks,
        START_HOUR,
        END_HOUR,
        HOUR_HEIGHT_PX,
      ),
    [],
  )
  return (
    <ShadulerFrame>
      <ShadulerColumnsHeader gridTemplateColumns={calc.gridTemplateColumns}>
        <ShadulerCorner />
        {sampleColumns.map((column, index) => (
          <ShadulerColumnHeader
            key={column.id}
            column={column}
            columnIndex={index}
          />
        ))}
      </ShadulerColumnsHeader>
      <ShadulerGrid
        gridTemplateColumns={calc.gridTemplateColumns}
        gridTemplateRows={calc.gridTemplateRows}
      >
        <ShadulerTimeColumn rows={calc.rows}>
          {calc.rows.map((row, i) => {
            const { label, tone } = shiftFor(row.hour)
            return (
              <ShadulerTimeSlot
                key={row.startMinutes}
                hour={row.hour}
                durationMinutes={row.durationMinutes}
                hourIndex={i}
                hourHeight={HOUR_HEIGHT_PX}
              >
                <div
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2 bg-background px-1.5 text-center leading-tight',
                    i === 0 ? 'top-2' : '-top-3',
                    tone,
                  )}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wide">
                    {label}
                  </div>
                </div>
              </ShadulerTimeSlot>
            )
          })}
        </ShadulerTimeColumn>
        <ShadulerCells
          rows={calc.rows}
          columns={sampleColumns}
          hourHeight={HOUR_HEIGHT_PX}
        />
        <ShadulerTasksOverlay
          taskPositions={calc.taskPositions}
          columns={sampleColumns}
          startHour={START_HOUR}
          endHour={END_HOUR}
          hourHeight={HOUR_HEIGHT_PX}
        />
      </ShadulerGrid>
    </ShadulerFrame>
  )
}
