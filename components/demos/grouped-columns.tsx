'use client'

import { useMemo } from 'react'
import {
  ShadulerCell,
  ShadulerColumnHeader,
  ShadulerColumnsHeader,
  ShadulerCorner,
  ShadulerGrid,
  ShadulerTasksOverlay,
  ShadulerTimeColumn,
  calculateShadulerData,
  type ShadulerColumn,
  type ShadulerTaskData,
} from '@/components/ui/shaduler'
import { ShadulerFrame } from './_helpers'

const START_HOUR = 8
const END_HOUR = 19
const HOUR_HEIGHT_PX = 60
const TIME_COLUMN_WIDTH_PX = 72

/**
 * Two-level header: outer = days, inner = resources per day. Each leaf
 * column has a compound id (`mon-a`, `mon-b`, …) so the shaduler grid
 * still treats them as independent columns — the grouping is purely a
 * visual layer rendered as a second row inside `ShadulerColumnsHeader`.
 */
const dayGroups = [
  { id: 'mon', label: 'Mon 9 Dec' },
  { id: 'tue', label: 'Tue 10 Dec' },
  { id: 'wed', label: 'Wed 11 Dec' },
]
const resourcesPerDay = ['A', 'B', 'C']

const columns: ShadulerColumn[] = dayGroups.flatMap((day) =>
  resourcesPerDay.map((r) => ({
    id: `${day.id}-${r.toLowerCase()}`,
    label: r,
  })),
)

const tasks: ShadulerTaskData[] = [
  // Monday
  { id: 1, column: 'mon-a', name: 'Standup', startTime: '09:00', endTime: '09:30' },
  { id: 2, column: 'mon-a', name: 'Pair session', startTime: '10:00', endTime: '12:00' },
  { id: 3, column: 'mon-b', name: 'Customer call', startTime: '11:00', endTime: '12:00' },
  { id: 4, column: 'mon-c', name: 'Deep work', startTime: '14:00', endTime: '17:00' },
  // Tuesday
  { id: 5, column: 'tue-a', name: 'Design crit', startTime: '10:30', endTime: '11:30' },
  { id: 6, column: 'tue-b', name: 'Lunch & learn', startTime: '12:00', endTime: '13:00' },
  { id: 7, column: 'tue-c', name: 'Sprint review', startTime: '15:00', endTime: '16:00' },
  // Wednesday
  { id: 8, column: 'wed-a', name: 'Onboarding', startTime: '09:00', endTime: '11:00' },
  { id: 9, column: 'wed-b', name: 'Pair session', startTime: '13:30', endTime: '15:00' },
  { id: 10, column: 'wed-c', name: '1:1', startTime: '16:00', endTime: '16:30' },
]

export function DemoGroupedColumns() {
  const calc = useMemo(
    () =>
      calculateShadulerData(
        columns,
        tasks,
        START_HOUR,
        END_HOUR,
        HOUR_HEIGHT_PX,
        { timeColumnWidth: TIME_COLUMN_WIDTH_PX },
      ),
    [],
  )
  return (
    <ShadulerFrame>
      <ShadulerColumnsHeader
        gridTemplateColumns={calc.gridTemplateColumns}
        style={{ gridTemplateRows: 'auto auto' }}
      >
        {/* Corner spans both header rows so it lines up with the time
            column body below. */}
        <ShadulerCorner
          style={{ gridRow: '1 / 3' }}
          className="flex items-center justify-center"
        />

        {/* Top row — one cell per day group, spanning all its child columns. */}
        {dayGroups.map((day, i) => (
          <div
            key={day.id}
            className="flex items-center justify-center border-b border-r px-4 py-2 text-sm font-semibold"
            style={{
              gridColumn: `${i * resourcesPerDay.length + 2} / span ${resourcesPerDay.length}`,
              gridRow: 1,
            }}
          >
            {day.label}
          </div>
        ))}

        {/* Bottom row — individual resource columns. */}
        {columns.map((column, index) => (
          <ShadulerColumnHeader
            key={column.id}
            column={column}
            columnIndex={index}
            className="text-xs font-medium"
            style={{ gridRow: 2 }}
          />
        ))}
      </ShadulerColumnsHeader>
      <ShadulerGrid
        gridTemplateColumns={calc.gridTemplateColumns}
        gridTemplateRows={calc.gridTemplateRows}
      >
        <ShadulerTimeColumn
          startTime={START_HOUR}
          endTime={END_HOUR}
          timeFormat="24h"
        />
        {calc.hours.flatMap((hour, hourIndex) =>
          columns.map((column, colIndex) => (
            <ShadulerCell
              key={`${column.id}-${hour}`}
              hour={hour}
              column={column}
              columnIndex={colIndex}
              hourIndex={hourIndex}
              hourHeight={HOUR_HEIGHT_PX}
            />
          )),
        )}
        <ShadulerTasksOverlay
          taskPositions={calc.taskPositions}
          columns={columns}
          startHour={START_HOUR}
          endHour={END_HOUR}
          hourHeight={HOUR_HEIGHT_PX}
          timeColumnWidth={TIME_COLUMN_WIDTH_PX}
        />
      </ShadulerGrid>
    </ShadulerFrame>
  )
}
