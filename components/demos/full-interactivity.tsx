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
  Toggle,
  sampleColumns,
  sampleTasks,
} from './_helpers'

const START_HOUR = 8
const END_HOUR = 19
const HOUR_HEIGHT_PX = 60
const TIME_INTERVAL_MIN = 15

export function DemoFullInteractivity() {
  const [tasks, setTasks] = useState<ShadulerTaskData[]>(sampleTasks)
  const [resizeOn, setResizeOn] = useState(true)
  const [dragOn, setDragOn] = useState(true)
  const [rangeOn, setRangeOn] = useState(true)
  const gridRef = useRef<HTMLDivElement>(null)

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

  const updateTask = (id: string | number, patch: Partial<ShadulerTaskData>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))

  const { getResizeProps } = useShadulerTaskResize({
    hourHeight: HOUR_HEIGHT_PX,
    timeInterval: TIME_INTERVAL_MIN,
    startHour: START_HOUR,
    endHour: END_HOUR,
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
    onDrag: updateTask,
    onDragEnd: updateTask,
  })

  const { activeRange, isSelecting, getCellProps } = useShadulerRangeSelect({
    gridRef,
    hourHeight: HOUR_HEIGHT_PX,
    timeInterval: TIME_INTERVAL_MIN,
    startHour: START_HOUR,
    endHour: END_HOUR,
    onSelect: (range) => {
      setTasks((prev) => [
        ...prev,
        {
          id: `range-${Date.now()}`,
          column: range.columnId,
          name: 'New range',
          startTime: minutesToTime(range.startMinutes),
          endTime: minutesToTime(range.endMinutes),
        },
      ])
    },
  })

  const cellInteraction = rangeOn ? getCellProps() : {}

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-md border bg-muted/40 px-4 py-3">
        <Toggle checked={resizeOn} onCheckedChange={setResizeOn} label="Resize" />
        <Toggle checked={dragOn} onCheckedChange={setDragOn} label="Drag" />
        <Toggle
          checked={rangeOn}
          onCheckedChange={setRangeOn}
          label="Drag-to-create"
        />
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
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
          ref={gridRef}
          gridTemplateColumns={calc.gridTemplateColumns}
          gridTemplateRows={calc.gridTemplateRows}
        >
          <ShadulerTimeColumn
            startTime={START_HOUR}
            endTime={END_HOUR}
            timeFormat="24h"
          />
          <ShadulerCells
            hours={calc.hours}
            columns={sampleColumns}
            hourHeight={HOUR_HEIGHT_PX}
            cellProps={{ timeInterval: TIME_INTERVAL_MIN, ...cellInteraction }}
          />
          <ShadulerTasksOverlay
            taskPositions={calc.taskPositions}
            columns={sampleColumns}
            startHour={START_HOUR}
            endHour={END_HOUR}
            hourHeight={HOUR_HEIGHT_PX}
          >
            {(positions, cols) => (
              <>
                {(cols ?? []).map((column, colIndex) => {
                  const taskPositions = positions[column.id] ?? []
                  return taskPositions.map((pos) => {
                    const interactionProps = composeShadulerTaskProps(
                      resizeOn && getResizeProps(pos.task),
                      dragOn && getTaskDragProps(pos.task),
                      { isSelecting },
                    )
                    return (
                      <ShadulerTask
                        key={pos.task.id}
                        task={pos.task}
                        position={pos}
                        columnIndex={colIndex}
                        totalColumns={(cols ?? []).length}
                        {...interactionProps}
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
