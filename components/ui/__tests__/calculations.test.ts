import { describe, it, expect } from 'vitest'
import {
  calculateShadulerData,
  calculateAllDayPositions,
  generateRows,
  groupTasksByColumn,
  type ShadulerAllDayTaskData,
  type ShadulerColumn,
  type ShadulerTaskData,
} from '@/components/ui/shaduler'

const cols: ShadulerColumn[] = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' },
]

describe('generateRows', () => {
  it('returns one full-hour row per hour for a clean range', () => {
    const rows = generateRows(8, 11, 0, 0)
    expect(rows).toHaveLength(3)
    rows.forEach((r) => {
      expect(r.durationMinutes).toBe(60)
      expect(r.isPartial).toBe(false)
      expect(r.showLabel).toBe(true)
    })
    expect(rows.map((r) => r.hour)).toEqual([8, 9, 10])
    expect(rows.map((r) => r.gridRow)).toEqual([1, 2, 3])
  })

  it('emits a partial first row when startMinute > 0', () => {
    const rows = generateRows(8, 10, 30, 0)
    // 8:30→9:00 (partial 30), 9:00→10:00 (full 60).
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      hour: 8,
      startMinuteOffset: 30,
      durationMinutes: 30,
      isPartial: true,
      showLabel: false,
    })
    expect(rows[1]).toMatchObject({
      hour: 9,
      startMinuteOffset: 0,
      durationMinutes: 60,
      isPartial: false,
      showLabel: true,
    })
  })

  it('emits a partial last row when endMinute > 0', () => {
    const rows = generateRows(8, 9, 0, 30)
    // Range 8:00-9:30: row 8:00-9:00 (full), row 9:00-9:30 (partial)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      hour: 8,
      durationMinutes: 60,
      isPartial: false,
    })
    expect(rows[1]).toMatchObject({
      hour: 9,
      durationMinutes: 30,
      isPartial: true,
      showLabel: true, // 9:00 IS an hour boundary
    })
  })

  it('emits both partial rows for salon-style hours (8:30 → 18:30)', () => {
    const rows = generateRows(8, 18, 30, 30)
    expect(rows).toHaveLength(11) // 30min + 9*60min + 30min
    expect(rows[0].durationMinutes).toBe(30)
    expect(rows[10].durationMinutes).toBe(30)
    rows.slice(1, 10).forEach((r) => {
      expect(r.durationMinutes).toBe(60)
    })
    const totalMin = rows.reduce((sum, r) => sum + r.durationMinutes, 0)
    expect(totalMin).toBe(600) // 10 hours
  })

  it('returns single partial row when range is sub-hour', () => {
    const rows = generateRows(8, 8, 30, 0)
    // 8:30 → 8:00? That's a degenerate range (start > end). Should be empty.
    expect(rows).toHaveLength(0)
  })

  it('handles 8:30 → 9:00 (single partial row)', () => {
    const rows = generateRows(8, 9, 30, 0)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      hour: 8,
      startMinuteOffset: 30,
      durationMinutes: 30,
      isPartial: true,
    })
  })

  it('startMinutes accumulates correctly across rows', () => {
    const rows = generateRows(8, 11, 30, 30)
    // 8:30, 9:00, 10:00, 11:00 = 4 rows: 30, 60, 60, 30
    expect(rows.map((r) => r.startMinutes)).toEqual([
      8 * 60 + 30, // 510
      9 * 60, // 540
      10 * 60, // 600
      11 * 60, // 660
    ])
  })
})

describe('groupTasksByColumn', () => {
  it('buckets tasks under their column id', () => {
    const tasks: ShadulerTaskData[] = [
      { id: 1, column: 'a', name: 'X', startTime: '09:00', endTime: '10:00' },
      { id: 2, column: 'b', name: 'Y', startTime: '09:00', endTime: '10:00' },
      { id: 3, column: 'a', name: 'Z', startTime: '11:00', endTime: '12:00' },
    ]
    const grouped = groupTasksByColumn(tasks, cols)
    expect(grouped.a).toHaveLength(2)
    expect(grouped.b).toHaveLength(1)
    expect(grouped.c).toHaveLength(0)
  })

  it('returns an entry for every column even with no tasks', () => {
    const grouped = groupTasksByColumn([], cols)
    expect(Object.keys(grouped)).toHaveLength(3)
    expect(grouped.a).toEqual([])
  })

  it('preserves the generic task type', () => {
    interface BookingTask extends ShadulerTaskData {
      customer: string
    }
    const tasks: BookingTask[] = [
      { id: 1, column: 'a', name: 'X', startTime: '09:00', endTime: '10:00', customer: 'Alice' },
    ]
    const grouped = groupTasksByColumn(tasks, cols)
    // Type-level: grouped.a[0].customer should be string. Runtime sanity check:
    expect(grouped.a[0].customer).toBe('Alice')
  })
})

describe('calculateShadulerData', () => {
  const tasks: ShadulerTaskData[] = [
    { id: 1, column: 'a', name: 'Morning', startTime: '09:00', endTime: '10:00' },
    { id: 2, column: 'a', name: 'Late', startTime: '11:00', endTime: '12:30' },
    { id: 3, column: 'b', name: 'Lunch', startTime: '12:00', endTime: '13:00' },
  ]

  it('produces expected gridTemplateColumns with default options', () => {
    const data = calculateShadulerData(cols, tasks, 8, 19, 60)
    expect(data.gridTemplateColumns).toBe(
      '96px repeat(3, minmax(140px, 1fr))',
    )
  })

  it('allows opting out of the minColumnWidth default for fluid columns', () => {
    const data = calculateShadulerData(cols, tasks, 8, 19, 60, {
      minColumnWidth: 0,
    })
    expect(data.gridTemplateColumns).toBe(
      '96px repeat(3, minmax(0px, 1fr))',
    )
  })

  it('honors timeColumnWidth and minColumnWidth options', () => {
    const data = calculateShadulerData(cols, tasks, 8, 19, 60, {
      timeColumnWidth: 64,
      minColumnWidth: 140,
    })
    expect(data.gridTemplateColumns).toBe(
      '64px repeat(3, minmax(140px, 1fr))',
    )
    expect(data.timeColumnWidth).toBe(64)
  })

  it('emits compact gridTemplateRows when all rows are full hours', () => {
    const data = calculateShadulerData(cols, tasks, 8, 11, 60)
    expect(data.gridTemplateRows).toBe('repeat(3, 60px)')
  })

  it('emits explicit row sizes when partial rows are present', () => {
    const data = calculateShadulerData(cols, tasks, 8, 18, 60, {
      startMinute: 30,
      endMinute: 30,
    })
    // 30px + 60px×9 + 30px
    expect(data.gridTemplateRows).toBe(
      '30px 60px 60px 60px 60px 60px 60px 60px 60px 60px 30px',
    )
  })

  it('reports startMinutes and endMinutes (totals from midnight)', () => {
    const data = calculateShadulerData(cols, tasks, 8, 18, 60, {
      startMinute: 30,
      endMinute: 30,
    })
    expect(data.startMinutes).toBe(8 * 60 + 30)
    expect(data.endMinutes).toBe(18 * 60 + 30)
  })

  it('places task at correct top/height (full-hour case)', () => {
    const data = calculateShadulerData(
      cols,
      [{ id: 1, column: 'a', name: 'T', startTime: '10:00', endTime: '11:00' }],
      8,
      19,
      60,
    )
    const pos = data.taskPositions.a[0]
    expect(pos.top).toBe(120) // (10 - 8) * 60
    expect(pos.height).toBe(60) // 1h
  })

  it('places task at correct top when startMinute shifts the origin', () => {
    const data = calculateShadulerData(
      cols,
      [{ id: 1, column: 'a', name: 'T', startTime: '10:00', endTime: '11:00' }],
      8,
      19,
      60,
      { startMinute: 30 },
    )
    const pos = data.taskPositions.a[0]
    // Task at 10:00, range starts at 8:30 → offset 90 minutes → 90px top.
    expect(pos.top).toBe(90)
    expect(pos.height).toBe(60)
  })

  it('clamps tasks that extend past the visible end', () => {
    const data = calculateShadulerData(
      cols,
      [{ id: 1, column: 'a', name: 'T', startTime: '17:00', endTime: '21:00' }],
      8,
      19,
      60,
    )
    const pos = data.taskPositions.a[0]
    // Task clamped to 17:00–19:00 (range end), height = 2h = 120px.
    expect(pos.height).toBe(120)
  })

  it('drops tasks fully outside the visible range', () => {
    const data = calculateShadulerData(
      cols,
      [
        { id: 1, column: 'a', name: 'Before', startTime: '06:00', endTime: '07:00' },
        { id: 2, column: 'a', name: 'After', startTime: '20:00', endTime: '21:00' },
      ],
      8,
      19,
      60,
    )
    expect(data.taskPositions.a).toHaveLength(0)
  })

  describe('overlap groups', () => {
    it('marks isolated tasks as groupCount=1, groupIndex=0', () => {
      const data = calculateShadulerData(
        cols,
        [{ id: 1, column: 'a', name: 'Solo', startTime: '09:00', endTime: '10:00' }],
        8,
        19,
        60,
      )
      const pos = data.taskPositions.a[0]
      expect(pos.groupCount).toBe(1)
      expect(pos.groupIndex).toBe(0)
    })

    it('groups two overlapping tasks side-by-side', () => {
      const data = calculateShadulerData(
        cols,
        [
          { id: 1, column: 'a', name: 'A', startTime: '09:00', endTime: '10:00' },
          { id: 2, column: 'a', name: 'B', startTime: '09:30', endTime: '10:30' },
        ],
        8,
        19,
        60,
      )
      expect(data.taskPositions.a).toHaveLength(2)
      data.taskPositions.a.forEach((p) => {
        expect(p.groupCount).toBe(2)
      })
      const indices = data.taskPositions.a.map((p) => p.groupIndex)
      expect(indices.sort()).toEqual([0, 1])
    })

    it('does not group non-overlapping tasks even when adjacent', () => {
      const data = calculateShadulerData(
        cols,
        [
          { id: 1, column: 'a', name: 'A', startTime: '09:00', endTime: '10:00' },
          { id: 2, column: 'a', name: 'B', startTime: '10:00', endTime: '11:00' },
        ],
        8,
        19,
        60,
      )
      data.taskPositions.a.forEach((p) => {
        expect(p.groupCount).toBe(1)
        expect(p.groupIndex).toBe(0)
      })
    })

    it('handles three overlapping tasks', () => {
      const data = calculateShadulerData(
        cols,
        [
          { id: 1, column: 'a', name: 'A', startTime: '09:00', endTime: '11:00' },
          { id: 2, column: 'a', name: 'B', startTime: '09:30', endTime: '10:30' },
          { id: 3, column: 'a', name: 'C', startTime: '10:00', endTime: '11:30' },
        ],
        8,
        19,
        60,
      )
      expect(data.taskPositions.a).toHaveLength(3)
      data.taskPositions.a.forEach((p) => {
        expect(p.groupCount).toBe(3)
      })
    })
  })

  it('returns rows array reflecting the same range', () => {
    const data = calculateShadulerData(cols, tasks, 8, 18, 60, {
      startMinute: 30,
      endMinute: 30,
    })
    expect(data.rows).toHaveLength(11)
    expect(data.rows[0].isPartial).toBe(true)
    expect(data.rows[10].isPartial).toBe(true)
  })

  it('hours array contains only label-bearing hours', () => {
    const data = calculateShadulerData(cols, tasks, 8, 18, 60, {
      startMinute: 30,
      endMinute: 30,
    })
    // Label-bearing rows are 9, 10, …, 18 (10 entries)
    expect(data.hours).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17, 18])
  })

  it('preserves the generic task type through taskPositions', () => {
    interface BookingTask extends ShadulerTaskData {
      customer: string
    }
    const data = calculateShadulerData<BookingTask>(
      cols,
      [
        {
          id: 1,
          column: 'a',
          name: 'X',
          startTime: '09:00',
          endTime: '10:00',
          customer: 'Alice',
        },
      ],
      8,
      19,
      60,
    )
    // The TS type should be BookingTask. Runtime sanity:
    expect(data.taskPositions.a[0].task.customer).toBe('Alice')
  })

  it('accepts a number as 6th arg (legacy timeColumnWidth)', () => {
    const data = calculateShadulerData(cols, tasks, 8, 19, 60, 64)
    expect(data.timeColumnWidth).toBe(64)
    expect(data.gridTemplateColumns).toBe(
      '64px repeat(3, minmax(140px, 1fr))',
    )
  })
})

describe("calculateAllDayPositions", () => {
  const weekCols: ShadulerColumn[] = [
    { id: "mon", label: "Mon" },
    { id: "tue", label: "Tue" },
    { id: "wed", label: "Wed" },
    { id: "thu", label: "Thu" },
    { id: "fri", label: "Fri" },
  ]

  it("returns empty when there are no tasks", () => {
    const out = calculateAllDayPositions(weekCols, [])
    expect(out.positions).toEqual([])
    expect(out.laneCount).toBe(0)
  })

  it("places a single-day task on lane 0", () => {
    const tasks: ShadulerAllDayTaskData[] = [
      { id: 1, name: "Holiday", startColumn: "mon", endColumn: "mon" },
    ]
    const { positions, laneCount } = calculateAllDayPositions(weekCols, tasks)
    expect(laneCount).toBe(1)
    expect(positions[0]).toMatchObject({
      lane: 0,
      startColumnIndex: 0,
      endColumnIndex: 0,
    })
  })

  it("places a multi-day task spanning the right column range", () => {
    const tasks: ShadulerAllDayTaskData[] = [
      { id: 1, name: "Workshop", startColumn: "mon", endColumn: "wed" },
    ]
    const { positions } = calculateAllDayPositions(weekCols, tasks)
    expect(positions[0].startColumnIndex).toBe(0)
    expect(positions[0].endColumnIndex).toBe(2)
  })

  it("shares a lane between non-overlapping tasks", () => {
    const tasks: ShadulerAllDayTaskData[] = [
      { id: 1, name: "A", startColumn: "mon", endColumn: "tue" },
      { id: 2, name: "B", startColumn: "thu", endColumn: "fri" },
    ]
    const { positions, laneCount } = calculateAllDayPositions(weekCols, tasks)
    expect(laneCount).toBe(1)
    positions.forEach((p) => expect(p.lane).toBe(0))
  })

  it("stacks overlapping tasks into separate lanes", () => {
    const tasks: ShadulerAllDayTaskData[] = [
      { id: 1, name: "A", startColumn: "mon", endColumn: "wed" },
      { id: 2, name: "B", startColumn: "tue", endColumn: "thu" },
      { id: 3, name: "C", startColumn: "wed", endColumn: "fri" },
    ]
    const { positions, laneCount } = calculateAllDayPositions(weekCols, tasks)
    expect(laneCount).toBe(3)
    const lanes = positions.map((p) => p.lane).sort()
    expect(lanes).toEqual([0, 1, 2])
  })

  it("reuses an earlier lane when a later task fits", () => {
    const tasks: ShadulerAllDayTaskData[] = [
      { id: 1, name: "A", startColumn: "mon", endColumn: "tue" },
      { id: 2, name: "B", startColumn: "mon", endColumn: "fri" },
      { id: 3, name: "C", startColumn: "wed", endColumn: "thu" },
    ]
    const { positions, laneCount } = calculateAllDayPositions(weekCols, tasks)
    // A in lane 0; B overlaps A so goes to lane 1; C starts after A ends, fits lane 0.
    expect(laneCount).toBe(2)
    const byId = Object.fromEntries(positions.map((p) => [p.task.id, p]))
    expect(byId[1].lane).toBe(0)
    expect(byId[2].lane).toBe(1)
    expect(byId[3].lane).toBe(0)
  })

  it("drops tasks whose columns do not resolve", () => {
    const tasks: ShadulerAllDayTaskData[] = [
      { id: 1, name: "Real", startColumn: "mon", endColumn: "tue" },
      { id: 2, name: "Bad", startColumn: "sat" as never, endColumn: "sun" as never },
    ]
    const { positions } = calculateAllDayPositions(weekCols, tasks)
    expect(positions).toHaveLength(1)
    expect(positions[0].task.id).toBe(1)
  })

  it("drops tasks whose start is after end", () => {
    const tasks: ShadulerAllDayTaskData[] = [
      { id: 1, name: "Inverted", startColumn: "wed", endColumn: "mon" },
    ]
    const { positions } = calculateAllDayPositions(weekCols, tasks)
    expect(positions).toHaveLength(0)
  })

  it("preserves the generic task type", () => {
    interface VacationTask extends ShadulerAllDayTaskData {
      employee: string
    }
    const tasks: VacationTask[] = [
      {
        id: 1,
        name: "PTO",
        startColumn: "mon",
        endColumn: "wed",
        employee: "Ana",
      },
    ]
    const { positions } = calculateAllDayPositions(weekCols, tasks)
    // Type-level: positions[0].task.employee should be string. Runtime sanity:
    expect(positions[0].task.employee).toBe("Ana")
  })
})

