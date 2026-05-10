'use client'

import * as React from 'react'
import {
  Shaduler,
  ShadulerCells,
  ShadulerColumnHeader,
  ShadulerColumnsHeader,
  ShadulerContent,
  ShadulerCorner,
  ShadulerGrid,
  ShadulerTask,
  ShadulerTasksOverlay,
  ShadulerTimeColumn,
  calculateShadulerData,
  type ShadulerTaskData,
} from '@/components/ui/shaduler'

type Variant = 'default' | 'secondary' | 'outline' | 'destructive'
type DemoTask = ShadulerTaskData & { variant?: Variant }

const START_HOUR = 8
const END_HOUR = 19
const HOUR_HEIGHT_PX = 56

const columns = [
  { id: 'a', label: 'Anna' },
  { id: 'b', label: 'Ben' },
  { id: 'c', label: 'Clara' },
]

const tasks: DemoTask[] = [
  { id: 1, column: 'a', name: 'Standup', startTime: '09:00', endTime: '09:30', variant: 'secondary' },
  { id: 2, column: 'a', name: 'Design review', startTime: '10:00', endTime: '11:30' },
  { id: 3, column: 'a', name: 'Lunch', startTime: '12:00', endTime: '13:00', variant: 'outline' },
  { id: 4, column: 'b', name: 'Onboarding', startTime: '09:00', endTime: '11:00' },
  { id: 5, column: 'b', name: 'Pair session', startTime: '13:30', endTime: '15:00', variant: 'secondary' },
  { id: 6, column: 'b', name: 'Incident', startTime: '16:00', endTime: '17:00', variant: 'destructive' },
  { id: 7, column: 'c', name: 'Focus block', startTime: '08:30', endTime: '11:00', variant: 'outline' },
  { id: 8, column: 'c', name: 'Demo', startTime: '14:00', endTime: '15:30' },
  { id: 9, column: 'c', name: 'Retro', startTime: '17:00', endTime: '18:00', variant: 'secondary' },
]

export function PreviewCanvas() {
  const calc = React.useMemo(
    () =>
      calculateShadulerData<DemoTask>(
        columns,
        tasks,
        START_HOUR,
        END_HOUR,
        HOUR_HEIGHT_PX,
      ),
    [],
  )

  return (
    <div className="h-[640px] overflow-hidden rounded-lg border bg-background text-foreground">
      <Shaduler className="h-full">
        <ShadulerContent>
          <ShadulerColumnsHeader gridTemplateColumns={calc.gridTemplateColumns}>
            <ShadulerCorner />
            {columns.map((c, i) => (
              <ShadulerColumnHeader key={c.id} column={c} columnIndex={i} />
            ))}
          </ShadulerColumnsHeader>
          <ShadulerGrid
            gridTemplateColumns={calc.gridTemplateColumns}
            gridTemplateRows={calc.gridTemplateRows}
          >
            <ShadulerTimeColumn startTime={START_HOUR} endTime={END_HOUR} />
            <ShadulerCells
              rows={calc.rows}
              columns={columns}
              hourHeight={HOUR_HEIGHT_PX}
            />
            <ShadulerTasksOverlay
              taskPositions={calc.taskPositions}
              columns={columns}
              startHour={START_HOUR}
              endHour={END_HOUR}
              hourHeight={HOUR_HEIGHT_PX}
            >
              {(taskPositions) =>
                columns.map((column, colIndex) =>
                  (taskPositions[column.id] ?? []).map((pos) => (
                    <ShadulerTask
                      key={pos.task.id}
                      task={pos.task}
                      position={pos}
                      columnIndex={colIndex}
                      totalColumns={columns.length}
                      variant={pos.task.variant ?? 'default'}
                    />
                  )),
                )
              }
            </ShadulerTasksOverlay>
          </ShadulerGrid>
        </ShadulerContent>
      </Shaduler>
    </div>
  )
}
