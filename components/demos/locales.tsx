'use client'

import { useMemo } from 'react'
import {
  Shaduler,
  ShadulerCell,
  ShadulerColumnHeader,
  ShadulerColumnsHeader,
  ShadulerContent,
  ShadulerCorner,
  ShadulerGrid,
  ShadulerTasksOverlay,
  ShadulerTimeColumn,
  calculateShadulerData,
  type ShadulerColumn,
  type ShadulerTaskData,
} from '@/components/ui/shaduler'

const cols: ShadulerColumn[] = [
  { id: '1', label: 'A' },
  { id: '2', label: 'B' },
]

const tasks: ShadulerTaskData[] = [
  { id: 't1', column: '1', name: 'Meeting', startTime: '09:00', endTime: '10:00' },
  { id: 't2', column: '2', name: 'Lunch', startTime: '12:00', endTime: '13:00' },
  { id: 't3', column: '1', name: 'Focus', startTime: '14:00', endTime: '15:30' },
]

const START_HOUR = 8
const END_HOUR = 17
const HOUR_HEIGHT_PX = 48
const TIME_COLUMN_WIDTH_PX = 64

function LocaleScheduler({
  locale,
  format,
}: {
  locale: string
  format: '12h' | '24h'
}) {
  const calc = useMemo(
    () =>
      calculateShadulerData(cols, tasks, START_HOUR, END_HOUR, HOUR_HEIGHT_PX, {
        timeColumnWidth: TIME_COLUMN_WIDTH_PX,
      }),
    [],
  )
  return (
    <div className="h-[420px]">
      <Shaduler>
        <ShadulerContent>
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
              timeFormat={format}
              locale={locale}
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
        </ShadulerContent>
      </Shaduler>
    </div>
  )
}

export function DemoLocales() {
  const localeOptions = [
    { locale: 'en-US', label: 'en-US (12h)', format: '12h' as const },
    { locale: 'de-DE', label: 'de-DE (24h)', format: '24h' as const },
    { locale: 'ja-JP', label: 'ja-JP (24h)', format: '24h' as const },
  ]
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {localeOptions.map(({ locale, label, format }) => (
        <div key={locale}>
          <div className="mb-3 rounded-md border bg-muted/40 px-4 py-3 text-xs font-medium text-fd-muted-foreground">
            {label}
          </div>
          <LocaleScheduler locale={locale} format={format} />
        </div>
      ))}
    </div>
  )
}
