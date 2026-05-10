'use client'

import { useMemo, useState } from 'react'
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
  timeToMinutes,
  type ShadulerColumn,
  type ShadulerTaskData,
} from '@/components/ui/shaduler'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShadulerFrame } from './_helpers'
import { TimePicker } from './time-picker'

const galaWeekColumns: ShadulerColumn[] = [
  { id: 'wed', label: 'Wed 31 Dec' },
  { id: 'thu', label: 'Thu 01 Jan' },
]

const START_HOUR = 0
const END_HOUR = 24
const HOUR_HEIGHT_PX = 24
const TIME_COLUMN_WIDTH_PX = 64

type CanonicalEvent = {
  id: string
  name: string
  startDay: string
  startTime: string
  endDay: string
  endTime: string
}

type SplitTask = ShadulerTaskData & { canonicalId: string }

function splitAcrossMidnight(event: CanonicalEvent): SplitTask[] {
  if (event.startDay === event.endDay) {
    return [
      {
        id: event.id,
        canonicalId: event.id,
        column: event.startDay,
        name: event.name,
        startTime: event.startTime,
        endTime: event.endTime,
      },
    ]
  }
  return [
    {
      id: `${event.id}__part-1`,
      canonicalId: event.id,
      column: event.startDay,
      name: `${event.name} →`,
      startTime: event.startTime,
      endTime: '23:59',
    },
    {
      id: `${event.id}__part-2`,
      canonicalId: event.id,
      column: event.endDay,
      name: `← ${event.name}`,
      startTime: '00:00',
      endTime: event.endTime,
    },
  ]
}

const canonicalEvents: CanonicalEvent[] = [
  { id: 'dinner', name: 'Pre-gala dinner', startDay: 'wed', startTime: '19:00', endDay: 'wed', endTime: '21:30' },
  { id: 'gala', name: 'New Year Gala', startDay: 'wed', startTime: '22:00', endDay: 'thu', endTime: '02:00' },
  { id: 'brunch', name: 'Recovery brunch', startDay: 'thu', startTime: '11:00', endDay: 'thu', endTime: '12:30' },
  { id: 'cinema', name: 'Movie night', startDay: 'thu', startTime: '20:00', endDay: 'thu', endTime: '22:00' },
]

function validateRange(
  startDay: string,
  startTime: string,
  endDay: string,
  endTime: string,
): string | null {
  const dayIndex: Record<string, number> = { wed: 0, thu: 1 }
  const startTotal =
    (dayIndex[startDay] ?? 0) * 1440 + timeToMinutes(startTime)
  const endTotal = (dayIndex[endDay] ?? 0) * 1440 + timeToMinutes(endTime)
  if (endTotal <= startTotal) return 'End must be after start.'
  if (endTotal - startTotal > 1440) return 'Event longer than 24 hours.'
  return null
}

export function DemoCrossMidnight() {
  const [events, setEvents] = useState<CanonicalEvent[]>(canonicalEvents)
  const [lastClicked, setLastClicked] = useState<{
    canonicalId: string
    name: string
  } | null>(null)
  const [formStartDay, setFormStartDay] = useState('wed')
  const [formStartTime, setFormStartTime] = useState('20:00')
  const [formEndDay, setFormEndDay] = useState('thu')
  const [formEndTime, setFormEndTime] = useState('01:00')
  const [formName, setFormName] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const tasks = useMemo(() => events.flatMap(splitAcrossMidnight), [events])
  const calc = useMemo(
    () =>
      calculateShadulerData<SplitTask>(
        galaWeekColumns,
        tasks,
        START_HOUR,
        END_HOUR,
        HOUR_HEIGHT_PX,
        { timeColumnWidth: TIME_COLUMN_WIDTH_PX },
      ),
    [tasks],
  )

  const addEvent = () => {
    const trimmed = formName.trim()
    if (!trimmed) return setFormError('Name is required.')
    const err = validateRange(formStartDay, formStartTime, formEndDay, formEndTime)
    if (err) return setFormError(err)
    setEvents((prev) => [
      ...prev,
      {
        id: `event-${Date.now()}`,
        name: trimmed,
        startDay: formStartDay,
        startTime: formStartTime,
        endDay: formEndDay,
        endTime: formEndTime,
      },
    ])
    setFormName('')
    setFormError(null)
  }

  const deleteClicked = () => {
    if (!lastClicked) return
    setEvents((prev) => prev.filter((e) => e.id !== lastClicked.canonicalId))
    setLastClicked(null)
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-end gap-3 rounded-md border bg-muted/40 px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Start
          </Label>
          <div className="flex gap-1">
            <Select value={formStartDay} onValueChange={setFormStartDay}>
              <SelectTrigger className="h-8 w-[80px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wed">Wed</SelectItem>
                <SelectItem value="thu">Thu</SelectItem>
              </SelectContent>
            </Select>
            <TimePicker
              value={formStartTime}
              onChange={setFormStartTime}
              className="w-[80px]"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            End
          </Label>
          <div className="flex gap-1">
            <Select value={formEndDay} onValueChange={setFormEndDay}>
              <SelectTrigger className="h-8 w-[80px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wed">Wed</SelectItem>
                <SelectItem value="thu">Thu</SelectItem>
              </SelectContent>
            </Select>
            <TimePicker
              value={formEndTime}
              onChange={setFormEndTime}
              className="w-[80px]"
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Name
          </Label>
          <Input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. After-party"
            className="h-8 min-w-[160px] text-xs"
            onKeyDown={(e) => e.key === 'Enter' && addEvent()}
          />
        </div>
        <Button size="sm" className="h-8 text-xs" onClick={addEvent}>
          Add event
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          disabled={!lastClicked}
          onClick={deleteClicked}
        >
          {lastClicked ? `Delete "${lastClicked.name}"` : 'Delete clicked'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-xs"
          onClick={() => {
            setEvents(canonicalEvents)
            setLastClicked(null)
            setFormError(null)
          }}
        >
          Reset
        </Button>
      </div>
      {formError && (
        <div className="mb-2 text-xs text-destructive">{formError}</div>
      )}
      <ShadulerFrame>
        <ShadulerColumnsHeader gridTemplateColumns={calc.gridTemplateColumns}>
          <ShadulerCorner />
          {galaWeekColumns.map((column, index) => (
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
            rows={calc.rows}
            hourHeight={HOUR_HEIGHT_PX}
          />
          <ShadulerCells
            rows={calc.rows}
            columns={galaWeekColumns}
            hourHeight={HOUR_HEIGHT_PX}
          />
          <ShadulerTasksOverlay
            taskPositions={calc.taskPositions}
            columns={galaWeekColumns}
            startHour={START_HOUR}
            endHour={END_HOUR}
            hourHeight={HOUR_HEIGHT_PX}
            timeColumnWidth={TIME_COLUMN_WIDTH_PX}
          >
            {(positions, cols) =>
              (cols ?? []).map((column, colIndex) => {
                const list = positions[column.id] ?? []
                return list.map((pos) => {
                  const task = pos.task
                  const isSplit = task.id !== task.canonicalId
                  return (
                    <ShadulerTask
                      key={task.id}
                      task={task}
                      position={pos}
                      columnIndex={colIndex}
                      totalColumns={(cols ?? []).length}
                      variant={isSplit ? 'secondary' : 'default'}
                      onClick={() =>
                        setLastClicked({
                          canonicalId: task.canonicalId,
                          name: task.name
                            .replace(/ →$/, '')
                            .replace(/^← /, ''),
                        })
                      }
                    />
                  )
                })
              })
            }
          </ShadulerTasksOverlay>
        </ShadulerGrid>
      </ShadulerFrame>
    </>
  )
}
