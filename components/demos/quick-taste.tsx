'use client'

import {
  Shaduler,
  ShadulerCells,
  ShadulerColumnHeader,
  ShadulerColumnsHeader,
  ShadulerContent,
  ShadulerCorner,
  ShadulerGrid,
  ShadulerTasksOverlay,
  ShadulerTimeColumn,
  calculateShadulerData,
} from '@/components/ui/shaduler'

/**
 * The exact code from the Introduction "Quick taste" section, rendered as a
 * live React tree. Kept in lockstep with the MDX snippet so what you see is
 * what you copy.
 */

const START_HOUR = 8
const END_HOUR = 19
const HOUR_HEIGHT_PX = 60

const columns = [
  { id: 'a', label: 'Resource A' },
  { id: 'b', label: 'Resource B' },
]

const tasks = [
  {
    id: 1,
    column: 'a',
    name: 'Morning sync',
    startTime: '09:00',
    endTime: '10:00',
  },
  {
    id: 2,
    column: 'b',
    name: 'Lunch',
    startTime: '12:00',
    endTime: '13:00',
  },
]

export function QuickTastePreview() {
  const calc = calculateShadulerData(
    columns,
    tasks,
    START_HOUR,
    END_HOUR,
    HOUR_HEIGHT_PX,
  )
  return (
    <div className="h-[420px]">
      <Shaduler>
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
            />
          </ShadulerGrid>
        </ShadulerContent>
      </Shaduler>
    </div>
  )
}
