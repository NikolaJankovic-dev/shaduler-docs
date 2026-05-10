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
  minutesToTime,
  type ShadulerColumn,
  type ShadulerTaskData,
} from '@/components/ui/shaduler'
import { ShadulerFrame } from './_helpers'

const START_HOUR = 8
const END_HOUR = 19
const HOUR_HEIGHT_PX = 60
const TIME_COLUMN_WIDTH_PX = 72
const MIN_COLUMN_WIDTH_PX = 140
const COLUMN_COUNT = 100
const SNAP_MIN = 15

const TASK_NAMES = [
  'Service call',
  'Inspection',
  'Diagnostics',
  'Oil change',
  'Tire rotation',
  'Brake repair',
  'Battery check',
  'Wheel balance',
  'Alignment',
  'AC service',
] as const

/**
 * Tiny seeded PRNG (mulberry32). We need deterministic output so SSR and
 * client hydration produce the same task list — Math.random() would mismatch.
 */
function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const cols: ShadulerColumn[] = Array.from({ length: COLUMN_COUNT }, (_, i) => ({
  id: `r${i + 1}`,
  label: `Tech ${i + 1}`,
}))

const rng = makeRng(42)
const END_MIN = END_HOUR * 60

/**
 * Sequential cursor-based generation: each task starts after the previous
 * one + a random gap, so they don't overlap inside a column. Stops early if
 * we'd run past END_HOUR.
 */
const tasks: ShadulerTaskData[] = cols.flatMap((col) => {
  const count = 2 + Math.floor(rng() * 4) // up to 2–5 tasks per column
  const out: ShadulerTaskData[] = []
  let cursorMin = START_HOUR * 60
  for (let j = 0; j < count; j++) {
    const gapMin = Math.floor(rng() * 7) * SNAP_MIN // 0–90 min gap before
    const durationMin = (2 + Math.floor(rng() * 5)) * SNAP_MIN // 30–90 min
    cursorMin += gapMin
    if (cursorMin + durationMin > END_MIN) break
    out.push({
      id: `${col.id}-t${j}`,
      column: col.id,
      name: TASK_NAMES[Math.floor(rng() * TASK_NAMES.length)],
      startTime: minutesToTime(cursorMin),
      endTime: minutesToTime(cursorMin + durationMin),
    })
    cursorMin += durationMin
  }
  return out
})

export function DemoManyResources() {
  const calc = useMemo(
    () =>
      calculateShadulerData(
        cols,
        tasks,
        START_HOUR,
        END_HOUR,
        HOUR_HEIGHT_PX,
        {
          timeColumnWidth: TIME_COLUMN_WIDTH_PX,
          minColumnWidth: MIN_COLUMN_WIDTH_PX,
        },
      ),
    [],
  )
  return (
    <ShadulerFrame>
      <ShadulerColumnsHeader gridTemplateColumns={calc.gridTemplateColumns}>
        <ShadulerCorner />
        {cols.map((column, index) => (
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
        <ShadulerTimeColumn
          startTime={START_HOUR}
          endTime={END_HOUR}
          timeFormat="24h"
        />
        {calc.hours.flatMap((hour, hourIndex) =>
          cols.map((column, colIndex) => (
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
          columns={cols}
          startHour={START_HOUR}
          endHour={END_HOUR}
          hourHeight={HOUR_HEIGHT_PX}
          timeColumnWidth={TIME_COLUMN_WIDTH_PX}
        />
      </ShadulerGrid>
    </ShadulerFrame>
  )
}
