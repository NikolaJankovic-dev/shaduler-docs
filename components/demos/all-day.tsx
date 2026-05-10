'use client'

import { useMemo } from 'react'
import {
  ShadulerAllDayStrip,
  ShadulerAllDayTask,
  ShadulerCells,
  ShadulerColumnHeader,
  ShadulerColumnsHeader,
  ShadulerCorner,
  ShadulerGrid,
  ShadulerTasksOverlay,
  ShadulerTimeColumn,
  calculateShadulerData,
  type ShadulerAllDayTaskData,
  type ShadulerColumn,
  type ShadulerTaskData,
} from '@/components/ui/shaduler'
import { cn } from '@/lib/utils'
import { ShadulerFrame } from './_helpers'

const allDayWeekColumns: ShadulerColumn[] = [
  { id: 'mon', label: 'Mon 9' },
  { id: 'tue', label: 'Tue 10' },
  { id: 'wed', label: 'Wed 11' },
  { id: 'thu', label: 'Thu 12' },
  { id: 'fri', label: 'Fri 13' },
  { id: 'sat', label: 'Sat 14' },
  { id: 'sun', label: 'Sun 15' },
]

type VacationTask = ShadulerAllDayTaskData & {
  category: 'vacation' | 'workshop' | 'holiday'
}

const allDayEvents: VacationTask[] = [
  { id: 'pto-ana', name: 'Ana — PTO', startColumn: 'mon', endColumn: 'wed', category: 'vacation' },
  { id: 'workshop', name: 'React workshop', startColumn: 'tue', endColumn: 'thu', category: 'workshop' },
  { id: 'holiday', name: 'Public holiday', startColumn: 'fri', endColumn: 'fri', category: 'holiday' },
  { id: 'pto-marko', name: 'Marko — PTO', startColumn: 'thu', endColumn: 'sun', category: 'vacation' },
]

const hourly: ShadulerTaskData[] = [
  { id: 'm1', column: 'mon', name: 'Standup', startTime: '09:00', endTime: '09:30' },
  { id: 't1', column: 'tue', name: 'Workshop kickoff', startTime: '10:00', endTime: '12:00' },
  { id: 'w1', column: 'wed', name: 'Pair session', startTime: '14:00', endTime: '16:00' },
  { id: 'fr1', column: 'fri', name: 'Demo day', startTime: '15:00', endTime: '17:00' },
  { id: 'sa1', column: 'sat', name: 'Long run', startTime: '08:00', endTime: '10:00' },
]

const categoryClass: Record<VacationTask['category'], string> = {
  vacation:
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
  workshop:
    'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/40',
  holiday:
    'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40',
}

const START_HOUR = 8
const END_HOUR = 18
const HOUR_HEIGHT_PX = 60
const TIME_COLUMN_WIDTH_PX = 72

export function DemoAllDay() {
  const calc = useMemo(
    () =>
      calculateShadulerData(
        allDayWeekColumns,
        hourly,
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
        {allDayWeekColumns.map((column, index) => (
          <ShadulerColumnHeader
            key={column.id}
            column={column}
            columnIndex={index}
          />
        ))}
      </ShadulerColumnsHeader>

      <ShadulerAllDayStrip<VacationTask>
        columns={allDayWeekColumns}
        tasks={allDayEvents}
        gridTemplateColumns={calc.gridTemplateColumns}
      >
        {(positions) =>
          positions.map((pos) => (
            <ShadulerAllDayTask
              key={pos.task.id}
              position={pos}
              className={cn(categoryClass[pos.task.category], 'border')}
            >
              <span className="truncate">{pos.task.name}</span>
            </ShadulerAllDayTask>
          ))
        }
      </ShadulerAllDayStrip>

      <ShadulerGrid
        gridTemplateColumns={calc.gridTemplateColumns}
        gridTemplateRows={calc.gridTemplateRows}
      >
        <ShadulerTimeColumn
          startTime={START_HOUR}
          endTime={END_HOUR}
          timeFormat="24h"
          rows={calc.rows}
          hourHeight={HOUR_HEIGHT_PX}
        />
        <ShadulerCells
          rows={calc.rows}
          columns={allDayWeekColumns}
          hourHeight={HOUR_HEIGHT_PX}
        />
        <ShadulerTasksOverlay
          taskPositions={calc.taskPositions}
          columns={allDayWeekColumns}
          startHour={START_HOUR}
          endHour={END_HOUR}
          hourHeight={HOUR_HEIGHT_PX}
          timeColumnWidth={TIME_COLUMN_WIDTH_PX}
        />
      </ShadulerGrid>
    </ShadulerFrame>
  )
}
