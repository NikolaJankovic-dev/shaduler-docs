'use client'

import { useMemo, useRef, useState } from 'react'
import {
  ShadulerCells,
  ShadulerColumnHeader,
  ShadulerColumnsHeader,
  ShadulerCorner,
  ShadulerGrid,
  ShadulerTask,
  ShadulerTasksOverlay,
  ShadulerTimeColumn,
  calculateShadulerData,
  composeShadulerTaskProps,
  minutesToTime,
  useShadulerRangeSelect,
  useShadulerTaskDrag,
  useShadulerTaskResize,
  type ShadulerTaskData,
} from '@/components/ui/shaduler'
import { Button } from '@/components/ui/button'
import {
  RangePreview,
  ShadulerFrame,
  sampleColumns,
} from './_helpers'

const salonTasks: ShadulerTaskData[] = [
  { id: 'p1', column: 'a', name: 'Haircut', startTime: '08:45', endTime: '09:30' },
  { id: 'p2', column: 'a', name: 'Color treatment', startTime: '10:00', endTime: '12:00' },
  { id: 'p3', column: 'b', name: 'Manicure', startTime: '09:00', endTime: '09:45' },
  { id: 'p4', column: 'b', name: 'Pedicure', startTime: '14:30', endTime: '15:30' },
  { id: 'p5', column: 'c', name: 'Massage', startTime: '13:00', endTime: '14:00' },
  { id: 'p6', column: 'c', name: 'Late slot', startTime: '17:45', endTime: '18:30' },
]

const START_HOUR = 8
const END_HOUR = 18
const START_MINUTE = 30
const END_MINUTE = 30
const HOUR_HEIGHT_PX = 60
const TIME_INTERVAL_MIN = 15

export function DemoPartialHours() {
  const [tasks, setTasks] = useState<ShadulerTaskData[]>(salonTasks)
  const gridRef = useRef<HTMLDivElement>(null)

  const calc = useMemo(
    () =>
      calculateShadulerData(
        sampleColumns,
        tasks,
        START_HOUR,
        END_HOUR,
        HOUR_HEIGHT_PX,
        { startMinute: START_MINUTE, endMinute: END_MINUTE },
      ),
    [tasks],
  )

  const updateTask = (id: string | number, patch: Partial<ShadulerTaskData>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))

  const { getResizeProps } = useShadulerTaskResize({
    hourHeight: HOUR_HEIGHT_PX,
    timeInterval: TIME_INTERVAL_MIN,
    startHour: START_HOUR,
    endHour: END_HOUR,
    startMinute: START_MINUTE,
    endMinute: END_MINUTE,
    onResize: updateTask,
    onResizeEnd: updateTask,
  })

  const { getTaskDragProps } = useShadulerTaskDrag({
    gridRef,
    columns: sampleColumns,
    hourHeight: HOUR_HEIGHT_PX,
    timeInterval: TIME_INTERVAL_MIN,
    startHour: START_HOUR,
    endHour: END_HOUR,
    startMinute: START_MINUTE,
    endMinute: END_MINUTE,
    onDrag: updateTask,
    onDragEnd: updateTask,
  })

  const { activeRange, isSelecting, getCellProps } = useShadulerRangeSelect({
    gridRef,
    hourHeight: HOUR_HEIGHT_PX,
    timeInterval: TIME_INTERVAL_MIN,
    startHour: START_HOUR,
    endHour: END_HOUR,
    startMinute: START_MINUTE,
    endMinute: END_MINUTE,
    onSelect: (range) => {
      setTasks((prev) => [
        ...prev,
        {
          id: `salon-${Date.now()}`,
          column: range.columnId,
          name: 'New appointment',
          startTime: minutesToTime(range.startMinutes),
          endTime: minutesToTime(range.endMinutes),
        },
      ])
    },
  })

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border bg-muted/40 px-4 py-3 text-xs text-fd-muted-foreground">
        <span>
          Hours <strong>08:30 – 18:30</strong>
        </span>
        <span>·</span>
        <span>
          {calc.rows.length} rows (first / last 30 min, middle 60 min)
        </span>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => setTasks(salonTasks)}
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
          ref={gridRef}
          gridTemplateColumns={calc.gridTemplateColumns}
          gridTemplateRows={calc.gridTemplateRows}
        >
          <ShadulerTimeColumn
            startTime={START_HOUR}
            endTime={END_HOUR}
            startMinute={START_MINUTE}
            endMinute={END_MINUTE}
            rows={calc.rows}
            timeFormat="24h"
          />
          <ShadulerCells
            rows={calc.rows}
            columns={sampleColumns}
            hourHeight={HOUR_HEIGHT_PX}
            cellProps={{ timeInterval: TIME_INTERVAL_MIN, ...getCellProps() }}
          />
          <ShadulerTasksOverlay
            taskPositions={calc.taskPositions}
            columns={sampleColumns}
            startHour={START_HOUR}
            endHour={END_HOUR}
            startMinute={START_MINUTE}
            endMinute={END_MINUTE}
            hourHeight={HOUR_HEIGHT_PX}
          >
            {(positions, cols) => (
              <>
                {(cols ?? []).map((column, colIndex) => {
                  const list = positions[column.id] ?? []
                  return list.map((pos) => {
                    const props = composeShadulerTaskProps(
                      getResizeProps(pos.task),
                      getTaskDragProps(pos.task),
                      { isSelecting },
                    )
                    return (
                      <ShadulerTask
                        key={pos.task.id}
                        task={pos.task}
                        position={pos}
                        columnIndex={colIndex}
                        totalColumns={(cols ?? []).length}
                        {...props}
                      />
                    )
                  })
                })}
                {activeRange && (
                  <RangePreview
                    range={activeRange}
                    columns={sampleColumns}
                    hourHeight={HOUR_HEIGHT_PX}
                    startHour={START_HOUR}
                    startMinute={START_MINUTE}
                  />
                )}
              </>
            )}
          </ShadulerTasksOverlay>
        </ShadulerGrid>
      </ShadulerFrame>
    </>
  )
}
