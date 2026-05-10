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
} from '@/components/ui/shaduler'
import { ShadulerFrame, sampleColumns, sampleTasks } from './_helpers'

const START_HOUR = 8
const END_HOUR = 19
const HOUR_HEIGHT_PX = 60

export function DemoDisplayOnly() {
  const calc = useMemo(
    () =>
      calculateShadulerData(
        sampleColumns,
        sampleTasks,
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
        />
      </ShadulerGrid>
    </ShadulerFrame>
  )
}
