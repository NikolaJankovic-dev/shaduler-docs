'use client'

import { useMemo, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { ShadulerFrame, sampleColumns, sampleTasks } from './_helpers'

const START_HOUR = 8
const END_HOUR = 19
const HOUR_HEIGHT_PX = 60
const NEW_EVENT_DURATION_MIN = 60

export function DemoClickToCreate() {
  const [tasks, setTasks] = useState<ShadulerTaskData[]>(sampleTasks)
  const calc = useMemo(
    () =>
      calculateShadulerData(
        sampleColumns,
        tasks,
        START_HOUR,
        END_HOUR,
        HOUR_HEIGHT_PX,
      ),
    [tasks],
  )

  const handleCellDown = (
    _e: React.PointerEvent<HTMLDivElement>,
    info: { hour: number; minute: number; column?: ShadulerColumn },
  ) => {
    if (!info.column) return
    const start = info.hour * 60 + info.minute
    const end = Math.min(start + NEW_EVENT_DURATION_MIN, END_HOUR * 60)
    setTasks((prev) => [
      ...prev,
      {
        id: `created-${Date.now()}`,
        column: info.column!.id,
        name: 'New event',
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
      },
    ])
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/40 px-4 py-3 text-xs text-fd-muted-foreground">
        <span>Click any empty cell to create a 1-hour event.</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTasks(sampleTasks)}
        >
          Reset
        </Button>
      </div>
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
                onCellPointerDown={handleCellDown}
              />
            )),
          )}
          <ShadulerTasksOverlay
            taskPositions={calc.taskPositions}
            columns={sampleColumns}
            startHour={START_HOUR}
            endHour={END_HOUR}
            hourHeight={HOUR_HEIGHT_PX}
          />
        </ShadulerGrid>
      </ShadulerFrame>
    </>
  )
}
