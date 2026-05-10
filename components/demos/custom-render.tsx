'use client'

import { useMemo } from 'react'
import { CheckCircle2, Clock3, XCircle } from 'lucide-react'
import {
  ShadulerCell,
  ShadulerColumnHeader,
  ShadulerColumnsHeader,
  ShadulerCorner,
  ShadulerGrid,
  ShadulerTask,
  ShadulerTasksOverlay,
  ShadulerTimeColumn,
  calculateShadulerData,
  type ShadulerTaskData,
} from '@/components/ui/shaduler'
import { cn } from '@/lib/utils'
import { ShadulerFrame, sampleColumns } from './_helpers'

type StatusTask = ShadulerTaskData & {
  status: 'approved' | 'pending' | 'rejected'
}

const statusTasks: StatusTask[] = [
  { id: 's1', column: 'a', name: 'Tire change', startTime: '09:00', endTime: '10:00', status: 'approved' },
  { id: 's2', column: 'a', name: 'Diagnostics', startTime: '11:00', endTime: '12:30', status: 'pending' },
  { id: 's3', column: 'b', name: 'Oil service', startTime: '10:00', endTime: '11:00', status: 'approved' },
  { id: 's4', column: 'b', name: 'Brake repair', startTime: '13:00', endTime: '15:30', status: 'rejected' },
  { id: 's5', column: 'c', name: 'Inspection', startTime: '14:00', endTime: '15:00', status: 'pending' },
  { id: 's6', column: 'c', name: 'Wheel balance', startTime: '16:00', endTime: '17:30', status: 'approved' },
]

const statusStyles: Record<
  StatusTask['status'],
  { wrapper: string; icon: React.ComponentType<{ className?: string }> }
> = {
  approved: {
    wrapper:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2,
  },
  pending: {
    wrapper:
      'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    icon: Clock3,
  },
  rejected: {
    wrapper:
      'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
    icon: XCircle,
  },
}

const START_HOUR = 8
const END_HOUR = 19
const HOUR_HEIGHT_PX = 60

export function DemoCustomRender() {
  const calc = useMemo(
    () =>
      calculateShadulerData<StatusTask>(
        sampleColumns,
        statusTasks,
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
        <ShadulerTimeColumn
          startTime={START_HOUR}
          endTime={END_HOUR}
          timeFormat="24h"
        />
        {calc.hours.flatMap((hour, hourIndex) =>
          sampleColumns.map((column, colIndex) => (
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
          columns={sampleColumns}
          startHour={START_HOUR}
          endHour={END_HOUR}
          hourHeight={HOUR_HEIGHT_PX}
        >
          {(positions, cols) =>
            (cols ?? []).map((column, colIndex) => {
              const list = positions[column.id] ?? []
              return list.map((pos) => {
                const task = pos.task
                const style = statusStyles[task.status]
                const Icon = style.icon
                return (
                  <ShadulerTask
                    key={task.id}
                    task={task}
                    position={pos}
                    columnIndex={colIndex}
                    totalColumns={(cols ?? []).length}
                  >
                    <div
                      className={cn(
                        'flex h-full flex-col gap-1 overflow-hidden rounded-md border px-2 py-1.5',
                        style.wrapper,
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className="size-3 shrink-0" />
                        <span className="truncate text-xs font-semibold">
                          {task.name}
                        </span>
                      </div>
                      <span className="text-[10px] tabular-nums opacity-80">
                        {task.startTime} – {task.endTime}
                      </span>
                    </div>
                  </ShadulerTask>
                )
              })
            })
          }
        </ShadulerTasksOverlay>
      </ShadulerGrid>
    </ShadulerFrame>
  )
}
