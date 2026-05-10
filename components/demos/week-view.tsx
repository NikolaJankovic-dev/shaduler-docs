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

const weekColumns: ShadulerColumn[] = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
]

const weekTasks: ShadulerTaskData[] = [
  { id: 'w1', column: 'mon', name: 'Standup', startTime: '09:00', endTime: '09:30' },
  { id: 'w2', column: 'mon', name: 'Sprint planning', startTime: '10:00', endTime: '12:00' },
  { id: 'w3', column: 'tue', name: 'Customer call', startTime: '11:00', endTime: '12:00' },
  { id: 'w4', column: 'tue', name: 'Code review', startTime: '15:00', endTime: '16:30' },
  { id: 'w5', column: 'wed', name: 'Workshop', startTime: '13:00', endTime: '17:00' },
  { id: 'w6', column: 'thu', name: '1:1', startTime: '10:30', endTime: '11:00' },
  { id: 'w7', column: 'thu', name: 'Design crit', startTime: '14:00', endTime: '15:30' },
  { id: 'w8', column: 'fri', name: 'Demo day', startTime: '15:00', endTime: '17:00' },
  { id: 'w9', column: 'sat', name: 'Long run', startTime: '08:00', endTime: '10:00' },
  { id: 'w10', column: 'sun', name: 'Reading', startTime: '17:00', endTime: '19:00' },
]

const START_HOUR = 8
const END_HOUR = 19
const HOUR_HEIGHT_PX = 60
const TIME_COLUMN_WIDTH_PX = 64

export function DemoWeekView() {
  const calc = useMemo(
    () =>
      calculateShadulerData(
        weekColumns,
        weekTasks,
        START_HOUR,
        END_HOUR,
        HOUR_HEIGHT_PX,
        { timeColumnWidth: TIME_COLUMN_WIDTH_PX },
      ),
    [],
  )
  return (
    <ShadulerFrame>
      <ShadulerColumnsHeader gridTemplateColumns={calc.gridTemplateColumns}>
        <ShadulerCorner />
        {weekColumns.map((column, index) => (
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
          weekColumns.map((column, colIndex) => (
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
          columns={weekColumns}
          startHour={START_HOUR}
          endHour={END_HOUR}
          hourHeight={HOUR_HEIGHT_PX}
          timeColumnWidth={TIME_COLUMN_WIDTH_PX}
        />
      </ShadulerGrid>
    </ShadulerFrame>
  )
}
