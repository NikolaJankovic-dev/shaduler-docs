import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  Shaduler,
  ShadulerHeader,
  ShadulerContent,
  ShadulerGrid,
  ShadulerColumnsHeader,
  ShadulerColumnHeader,
  ShadulerCorner,
  ShadulerTimeColumn,
  ShadulerTimeSlot,
  ShadulerCell,
  ShadulerCells,
  ShadulerTask,
  ShadulerTasksOverlay,
  ShadulerAllDayStrip,
  ShadulerAllDayTask,
  calculateShadulerData,
  type ShadulerAllDayTaskData,
  type ShadulerColumn,
  type ShadulerTaskData,
  type TaskPosition,
  type AllDayPosition,
} from '@/components/ui/shaduler'

const cols: ShadulerColumn[] = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
]

const tasks: ShadulerTaskData[] = [
  { id: 1, column: 'a', name: 'Morning', startTime: '09:00', endTime: '10:00' },
  { id: 2, column: 'b', name: 'Lunch', startTime: '12:00', endTime: '13:00' },
]

describe('Shaduler primitives — render & data-slot', () => {
  it('Shaduler root renders with data-slot="shaduler"', () => {
    const { container } = render(<Shaduler />)
    expect(container.querySelector('[data-slot="shaduler"]')).toBeTruthy()
  })

  it('ShadulerHeader renders without forcing default content', () => {
    const { container } = render(<ShadulerHeader>custom</ShadulerHeader>)
    const header = container.querySelector('[data-slot="shaduler-header"]')!
    expect(header.textContent).toBe('custom')
  })

  it('ShadulerContent renders with scroll classes', () => {
    const { container } = render(<ShadulerContent />)
    const content = container.querySelector('[data-slot="shaduler-content"]')!
    expect(content.className).toContain('overflow-auto')
  })

  it('ShadulerGrid applies grid template inline styles', () => {
    const { container } = render(
      <ShadulerGrid
        gridTemplateColumns="96px repeat(2, 1fr)"
        gridTemplateRows="repeat(11, 60px)"
      />,
    )
    const grid = container.querySelector(
      '[data-slot="shaduler-grid"]',
    ) as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe('96px repeat(2, 1fr)')
    expect(grid.style.gridTemplateRows).toBe('repeat(11, 60px)')
    expect(grid.getAttribute('role')).toBe('grid')
  })

  it('ShadulerCorner is sticky and has both borders', () => {
    const { container } = render(<ShadulerCorner />)
    const corner = container.querySelector(
      '[data-slot="shaduler-corner"]',
    ) as HTMLElement
    expect(corner.className).toContain('sticky')
    expect(corner.className).toContain('border-b')
    expect(corner.className).toContain('border-r')
  })
})

describe('ShadulerColumnsHeader / ShadulerColumnHeader', () => {
  it('auto-renders one ColumnHeader per column when columns prop is set', () => {
    render(
      <ShadulerColumnsHeader
        columns={cols}
        gridTemplateColumns="96px repeat(2, 1fr)"
      />,
    )
    expect(screen.getByText('A')).toBeTruthy()
    expect(screen.getByText('B')).toBeTruthy()
  })

  it('places each header at the right gridColumn (index + 2)', () => {
    const { container } = render(
      <ShadulerColumnsHeader gridTemplateColumns="96px repeat(2, 1fr)">
        <ShadulerColumnHeader column={cols[0]} columnIndex={0}>
          A
        </ShadulerColumnHeader>
        <ShadulerColumnHeader column={cols[1]} columnIndex={1}>
          B
        </ShadulerColumnHeader>
      </ShadulerColumnsHeader>,
    )
    const headers = container.querySelectorAll(
      '[data-slot="shaduler-column-header"]',
    ) as NodeListOf<HTMLElement>
    expect(headers[0].style.gridColumn).toBe('2')
    expect(headers[1].style.gridColumn).toBe('3')
    expect(headers[0].getAttribute('role')).toBe('columnheader')
  })
})

describe('ShadulerTimeColumn', () => {
  it('renders one slot per hour for a clean range', () => {
    const { container } = render(
      <ShadulerTimeColumn startTime={8} endTime={11} timeFormat="24h" />,
    )
    const slots = container.querySelectorAll(
      '[data-slot="shaduler-time-slot"]',
    )
    expect(slots).toHaveLength(3)
  })

  it('renders partial first/last slots with the right pixel heights', () => {
    const { container } = render(
      <ShadulerTimeColumn
        startTime={8}
        endTime={18}
        startMinute={30}
        endMinute={30}
        hourHeight={60}
      />,
    )
    const slots = container.querySelectorAll(
      '[data-slot="shaduler-time-slot"]',
    ) as NodeListOf<HTMLElement>
    expect(slots).toHaveLength(11)
    expect(slots[0].style.height).toBe('30px') // 8:30-9:00 partial
    expect(slots[10].style.height).toBe('30px') // 18:00-18:30 partial
    // Middle 9 are full
    for (let i = 1; i <= 9; i++) {
      expect(slots[i].style.height).toBe('60px')
    }
  })

  it('shows label only on label-bearing rows', () => {
    const { container } = render(
      <ShadulerTimeColumn
        startTime={8}
        endTime={10}
        startMinute={30}
        endMinute={0}
        hourHeight={60}
      />,
    )
    // 8:30→9:00 (no label), 9:00→10:00 (label)
    const labels = container.querySelectorAll('span')
    expect(labels.length).toBeGreaterThanOrEqual(1)
  })
})

describe('ShadulerTimeSlot', () => {
  it('honors durationMinutes for partial slots', () => {
    const { container } = render(
      <ShadulerTimeSlot
        hour={8}
        durationMinutes={30}
        hourHeight={60}
        hourIndex={0}
      />,
    )
    const slot = container.querySelector(
      '[data-slot="shaduler-time-slot"]',
    ) as HTMLElement
    expect(slot.style.height).toBe('30px')
  })

  it('hides label when showLabel=false', () => {
    const { container } = render(
      <ShadulerTimeSlot
        hour={8}
        showLabel={false}
        hourIndex={0}
      />,
    )
    expect(container.querySelector('span')).toBeNull()
  })
})

describe('ShadulerCell', () => {
  it('places at gridColumn and gridRow, default 60px height', () => {
    const { container } = render(
      <ShadulerCell
        hour={9}
        column={cols[0]}
        columnIndex={0}
        hourIndex={1}
      />,
    )
    const cell = container.querySelector(
      '[data-slot="shaduler-cell"]',
    ) as HTMLElement
    expect(cell.style.gridColumn).toBe('2')
    expect(cell.style.gridRow).toBe('2')
    expect(cell.style.height).toBe('60px')
    expect(cell.getAttribute('role')).toBe('gridcell')
  })

  it('uses durationMinutes for partial cell heights', () => {
    const { container } = render(
      <ShadulerCell
        hour={8}
        column={cols[0]}
        columnIndex={0}
        hourIndex={0}
        startMinuteOffset={30}
        durationMinutes={30}
        hourHeight={60}
      />,
    )
    const cell = container.querySelector(
      '[data-slot="shaduler-cell"]',
    ) as HTMLElement
    expect(cell.style.height).toBe('30px') // durationMinutes/60 * hourHeight = 30/60 * 60 = 30
  })

  it('partial first cell has aria-label including the offset minute', () => {
    render(
      <ShadulerCell
        hour={8}
        column={cols[0]}
        columnIndex={0}
        hourIndex={0}
        startMinuteOffset={30}
        durationMinutes={30}
      />,
    )
    expect(screen.getByLabelText(/A at 08:30/)).toBeTruthy()
  })

  it('full cell has aria-label with :00 minute', () => {
    render(
      <ShadulerCell
        hour={9}
        column={cols[0]}
        columnIndex={0}
        hourIndex={1}
      />,
    )
    expect(screen.getByLabelText(/A at 09:00/)).toBeTruthy()
  })

  it('is non-interactive by default (no onPointerDown bound)', () => {
    const { container } = render(
      <ShadulerCell
        hour={9}
        column={cols[0]}
        columnIndex={0}
        hourIndex={1}
      />,
    )
    const cell = container.querySelector(
      '[data-slot="shaduler-cell"]',
    ) as HTMLElement
    expect(cell.getAttribute('data-interactive')).toBeNull()
  })

  it('becomes interactive when onCellPointerDown is provided', () => {
    const handler = vi.fn()
    const { container } = render(
      <ShadulerCell
        hour={9}
        column={cols[0]}
        columnIndex={0}
        hourIndex={1}
        onCellPointerDown={handler}
      />,
    )
    const cell = container.querySelector(
      '[data-slot="shaduler-cell"]',
    ) as HTMLElement
    expect(cell.getAttribute('data-interactive')).toBe('true')
  })

  it('calls onCellPointerDown with snapped (hour, minute) info', () => {
    const handler = vi.fn()
    const { container } = render(
      <ShadulerCell
        hour={9}
        column={cols[0]}
        columnIndex={0}
        hourIndex={1}
        timeInterval={15}
        hourHeight={60}
        onCellPointerDown={handler}
      />,
    )
    const cell = container.querySelector(
      '[data-slot="shaduler-cell"]',
    ) as HTMLElement
    // jsdom can't compute layout, so getBoundingClientRect returns zeros.
    // Mock it to simulate a click 30px down from the top of a 60px cell:
    cell.getBoundingClientRect = () =>
      ({ top: 0, left: 0, width: 200, height: 60, right: 200, bottom: 60, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
    fireEvent.pointerDown(cell, { clientY: 30, clientX: 0 })
    expect(handler).toHaveBeenCalledTimes(1)
    const [, info] = handler.mock.calls[0]
    expect(info.hour).toBe(9)
    expect(info.minute).toBe(30)
    expect(info.column).toBe(cols[0])
  })
})

describe('ShadulerCells', () => {
  it('renders one cell per (row, column) using rows', () => {
    const data = calculateShadulerData(cols, [], 8, 11, 60)
    const { container } = render(
      <ShadulerCells rows={data.rows} columns={cols} hourHeight={60} />,
    )
    expect(
      container.querySelectorAll('[data-slot="shaduler-cell"]'),
    ).toHaveLength(3 * 2) // 3 hours × 2 columns
  })

  it('legacy hours: number[] still works', () => {
    const { container } = render(
      <ShadulerCells hours={[8, 9, 10]} columns={cols} hourHeight={60} />,
    )
    expect(
      container.querySelectorAll('[data-slot="shaduler-cell"]'),
    ).toHaveLength(6)
  })

  it('partial rows produce shorter cells', () => {
    const data = calculateShadulerData(cols, [], 8, 18, 60, {
      startMinute: 30,
      endMinute: 30,
    })
    const { container } = render(
      <ShadulerCells rows={data.rows} columns={cols} hourHeight={60} />,
    )
    const heights = Array.from(
      container.querySelectorAll('[data-slot="shaduler-cell"]'),
    ).map((c) => (c as HTMLElement).style.height)
    // First two cells (column 1 and 2 of partial first row) are 30px
    expect(heights[0]).toBe('30px')
    expect(heights[1]).toBe('30px')
    // Last two cells (partial last row) are 30px
    expect(heights[heights.length - 1]).toBe('30px')
    expect(heights[heights.length - 2]).toBe('30px')
  })

  it('spreads cellProps to every generated cell', () => {
    const handler = vi.fn()
    const { container } = render(
      <ShadulerCells
        hours={[8]}
        columns={cols}
        hourHeight={60}
        cellProps={{ onCellPointerDown: handler }}
      />,
    )
    const cells = container.querySelectorAll('[data-slot="shaduler-cell"]')
    cells.forEach((cell) => {
      expect((cell as HTMLElement).getAttribute('data-interactive')).toBe(
        'true',
      )
    })
  })
})

describe('ShadulerTask', () => {
  const position: TaskPosition = {
    task: tasks[0],
    top: 60,
    height: 60,
    columnIndex: 0,
    groupIndex: 0,
    groupCount: 1,
  }

  it('renders default pill with task name', () => {
    render(
      <ShadulerTask
        task={tasks[0]}
        position={position}
        columnIndex={0}
        totalColumns={2}
      />,
    )
    expect(screen.getByText('Morning')).toBeTruthy()
  })

  it('positions absolutely with top/height/left/width', () => {
    const { container } = render(
      <ShadulerTask
        task={tasks[0]}
        position={position}
        columnIndex={0}
        totalColumns={2}
      />,
    )
    const el = container.querySelector(
      '[data-slot="shaduler-task"]',
    ) as HTMLElement
    expect(el.style.top).toBe('60px')
    expect(el.style.height).toBe('60px')
    // Width with totalColumns=2, default 90% of 50% column = 45%
    expect(el.style.width).toBe('45%')
  })

  it('does NOT render resize handle when onResizeStart is absent', () => {
    const { container } = render(
      <ShadulerTask
        task={tasks[0]}
        position={position}
        columnIndex={0}
        totalColumns={2}
      />,
    )
    expect(
      container.querySelector('[data-shaduler-resize-handle]'),
    ).toBeNull()
  })

  it('renders resize handle when onResizeStart is provided', () => {
    const { container } = render(
      <ShadulerTask
        task={tasks[0]}
        position={position}
        columnIndex={0}
        totalColumns={2}
        onResizeStart={() => {}}
      />,
    )
    expect(
      container.querySelector('[data-shaduler-resize-handle]'),
    ).not.toBeNull()
  })

  it('exposes role="button" + tabIndex=0 when onClick is provided', () => {
    const { container } = render(
      <ShadulerTask
        task={tasks[0]}
        position={position}
        columnIndex={0}
        totalColumns={2}
        onClick={() => {}}
      />,
    )
    const el = container.querySelector(
      '[data-slot="shaduler-task"]',
    ) as HTMLElement
    expect(el.getAttribute('role')).toBe('button')
    expect(el.tabIndex).toBe(0)
  })

  it('aria-label includes task name and time range', () => {
    render(
      <ShadulerTask
        task={tasks[0]}
        position={position}
        columnIndex={0}
        totalColumns={2}
      />,
    )
    expect(screen.getByLabelText(/Morning, 09:00 – 10:00/)).toBeTruthy()
  })

  it('Enter on focused task fires onClick', () => {
    const onClick = vi.fn()
    const { container } = render(
      <ShadulerTask
        task={tasks[0]}
        position={position}
        columnIndex={0}
        totalColumns={2}
        onClick={onClick}
      />,
    )
    const el = container.querySelector(
      '[data-slot="shaduler-task"]',
    ) as HTMLElement
    fireEvent.keyDown(el, { key: 'Enter' })
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('Space on focused task fires onClick', () => {
    const onClick = vi.fn()
    const { container } = render(
      <ShadulerTask
        task={tasks[0]}
        position={position}
        columnIndex={0}
        totalColumns={2}
        onClick={onClick}
      />,
    )
    const el = container.querySelector(
      '[data-slot="shaduler-task"]',
    ) as HTMLElement
    fireEvent.keyDown(el, { key: ' ' })
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('overlap groups produce side-by-side widths', () => {
    const { container } = render(
      <>
        <ShadulerTask
          task={tasks[0]}
          position={{ ...position, groupCount: 2, groupIndex: 0 }}
          columnIndex={0}
          totalColumns={2}
        />
        <ShadulerTask
          task={tasks[1]}
          position={{ ...position, task: tasks[1], groupCount: 2, groupIndex: 1 }}
          columnIndex={0}
          totalColumns={2}
        />
      </>,
    )
    const elements = container.querySelectorAll(
      '[data-slot="shaduler-task"]',
    ) as NodeListOf<HTMLElement>
    // With totalColumns=2, column width = 50%. With 2 in group, each takes 90/2=45% of column = 22.5% of overlay
    expect(elements[0].style.width).toBe('22.5%')
    expect(elements[1].style.width).toBe('22.5%')
  })
})

describe('ShadulerTasksOverlay', () => {
  it('spans column 2 → end of the grid via grid placement', () => {
    const data = calculateShadulerData(cols, [], 8, 11, 60)
    const { container } = render(
      <ShadulerTasksOverlay
        taskPositions={data.taskPositions}
        columns={cols}
        startHour={8}
        endHour={11}
        hourHeight={60}
      />,
    )
    const overlay = container.querySelector(
      '[data-slot="shaduler-tasks-overlay"]',
    ) as HTMLElement
    // Overlay is now a grid item, not absolutely positioned — its width
    // comes from the grid track sum so it stays correct when columns
    // overflow horizontally.
    expect(overlay.style.gridColumn).toBe('2 / -1')
    expect(overlay.style.gridRow).toBe('1 / -1')
    expect(overlay.style.height).toBe('180px') // 3h × 60px
  })

  it('honors startMinute/endMinute for height', () => {
    const data = calculateShadulerData(cols, [], 8, 18, 60, {
      startMinute: 30,
      endMinute: 30,
    })
    const { container } = render(
      <ShadulerTasksOverlay
        taskPositions={data.taskPositions}
        columns={cols}
        startHour={8}
        endHour={18}
        startMinute={30}
        endMinute={30}
        hourHeight={60}
      />,
    )
    const overlay = container.querySelector(
      '[data-slot="shaduler-tasks-overlay"]',
    ) as HTMLElement
    // 10h range × 60px = 600px
    expect(overlay.style.height).toBe('600px')
  })

  it('renders one ShadulerTask per position when no children', () => {
    const data = calculateShadulerData(cols, tasks, 8, 19, 60)
    const { container } = render(
      <ShadulerTasksOverlay
        taskPositions={data.taskPositions}
        columns={cols}
        startHour={8}
        endHour={19}
        hourHeight={60}
      />,
    )
    expect(
      container.querySelectorAll('[data-slot="shaduler-task"]'),
    ).toHaveLength(2)
  })

  it('passes typed positions and columns to function children', () => {
    const data = calculateShadulerData(cols, tasks, 8, 19, 60)
    let received:
      | { positions: typeof data.taskPositions; cols: typeof cols }
      | null = null
    render(
      <ShadulerTasksOverlay
        taskPositions={data.taskPositions}
        columns={cols}
        startHour={8}
        endHour={19}
        hourHeight={60}
      >
        {(positions, columns) => {
          received = { positions, cols: columns ?? [] }
          return null
        }}
      </ShadulerTasksOverlay>,
    )
    expect(received).not.toBeNull()
    expect(received!.positions.a).toHaveLength(1)
    expect(received!.cols).toHaveLength(2)
  })
})

describe('ShadulerAllDayStrip', () => {
  const weekCols: ShadulerColumn[] = [
    { id: 'mon', label: 'Mon' },
    { id: 'tue', label: 'Tue' },
    { id: 'wed', label: 'Wed' },
    { id: 'thu', label: 'Thu' },
    { id: 'fri', label: 'Fri' },
  ]

  it('renders zero-height container with no tasks', () => {
    const { container } = render(
      <ShadulerAllDayStrip
        columns={weekCols}
        tasks={[]}
        gridTemplateColumns="96px repeat(5, 1fr)"
      />,
    )
    const strip = container.querySelector(
      '[data-slot="shaduler-all-day-strip"]',
    ) as HTMLElement
    expect(strip).toBeTruthy()
    expect(strip.style.gridTemplateRows).toBe('0px')
    // No corner / no tasks rendered
    expect(
      container.querySelector('[data-slot="shaduler-all-day-corner"]'),
    ).toBeNull()
    expect(
      container.querySelectorAll('[data-slot="shaduler-all-day-task"]'),
    ).toHaveLength(0)
  })

  it('renders a single-day all-day task on lane 0', () => {
    const tasks: ShadulerAllDayTaskData[] = [
      { id: 1, name: 'Public holiday', startColumn: 'mon', endColumn: 'mon' },
    ]
    const { container } = render(
      <ShadulerAllDayStrip
        columns={weekCols}
        tasks={tasks}
        gridTemplateColumns="96px repeat(5, 1fr)"
      />,
    )
    const taskEl = container.querySelector(
      '[data-slot="shaduler-all-day-task"]',
    ) as HTMLElement
    expect(taskEl).toBeTruthy()
    expect(taskEl.textContent).toContain('Public holiday')
    expect(taskEl.style.gridColumn).toBe('2 / 3')
    expect(taskEl.style.gridRow).toBe('1')
  })

  it('renders a multi-day task spanning the right grid columns', () => {
    const tasks: ShadulerAllDayTaskData[] = [
      { id: 1, name: 'Workshop', startColumn: 'mon', endColumn: 'wed' },
    ]
    const { container } = render(
      <ShadulerAllDayStrip
        columns={weekCols}
        tasks={tasks}
        gridTemplateColumns="96px repeat(5, 1fr)"
      />,
    )
    const taskEl = container.querySelector(
      '[data-slot="shaduler-all-day-task"]',
    ) as HTMLElement
    expect(taskEl.style.gridColumn).toBe('2 / 5') // tracks 2..4 (cols 0,1,2 → +2)
  })

  it('stacks overlapping tasks into separate lanes', () => {
    const tasks: ShadulerAllDayTaskData[] = [
      { id: 1, name: 'A', startColumn: 'mon', endColumn: 'wed' },
      { id: 2, name: 'B', startColumn: 'tue', endColumn: 'thu' },
    ]
    const { container } = render(
      <ShadulerAllDayStrip
        columns={weekCols}
        tasks={tasks}
        gridTemplateColumns="96px repeat(5, 1fr)"
      />,
    )
    const taskEls = container.querySelectorAll(
      '[data-slot="shaduler-all-day-task"]',
    ) as NodeListOf<HTMLElement>
    expect(taskEls).toHaveLength(2)
    const rows = Array.from(taskEls).map((el) => el.style.gridRow).sort()
    expect(rows).toEqual(['1', '2'])
  })

  it('uses laneHeight to size grid template rows', () => {
    const tasks: ShadulerAllDayTaskData[] = [
      { id: 1, name: 'A', startColumn: 'mon', endColumn: 'mon' },
    ]
    const { container } = render(
      <ShadulerAllDayStrip
        columns={weekCols}
        tasks={tasks}
        gridTemplateColumns="96px repeat(5, 1fr)"
        laneHeight={40}
      />,
    )
    const strip = container.querySelector(
      '[data-slot="shaduler-all-day-strip"]',
    ) as HTMLElement
    expect(strip.style.gridTemplateRows).toBe('repeat(1, 40px)')
  })

  it('always renders the All-day corner when there is at least one lane', () => {
    const tasks: ShadulerAllDayTaskData[] = [
      { id: 1, name: 'A', startColumn: 'mon', endColumn: 'mon' },
    ]
    const { container } = render(
      <ShadulerAllDayStrip
        columns={weekCols}
        tasks={tasks}
        gridTemplateColumns="96px repeat(5, 1fr)"
      />,
    )
    expect(
      container.querySelector('[data-slot="shaduler-all-day-corner"]'),
    ).not.toBeNull()
  })

  it('passes positions and laneCount to function children', () => {
    const tasks: ShadulerAllDayTaskData[] = [
      { id: 1, name: 'A', startColumn: 'mon', endColumn: 'tue' },
      { id: 2, name: 'B', startColumn: 'wed', endColumn: 'fri' },
    ]
    let received: { positions: AllDayPosition[]; laneCount: number } | null = null
    render(
      <ShadulerAllDayStrip
        columns={weekCols}
        tasks={tasks}
        gridTemplateColumns="96px repeat(5, 1fr)"
      >
        {(positions, laneCount) => {
          received = { positions, laneCount }
          return null
        }}
      </ShadulerAllDayStrip>,
    )
    expect(received).not.toBeNull()
    expect(received!.positions).toHaveLength(2)
    expect(received!.laneCount).toBe(1)
  })
})

describe('ShadulerAllDayTask', () => {
  const position: AllDayPosition = {
    task: { id: 1, name: 'PTO', startColumn: 'mon', endColumn: 'wed' },
    lane: 0,
    startColumnIndex: 0,
    endColumnIndex: 2,
  }

  it('renders task name in default content', () => {
    render(<ShadulerAllDayTask position={position} />)
    expect(screen.getByText('PTO')).toBeTruthy()
  })

  it('uses gridColumn span and gridRow from position', () => {
    const { container } = render(<ShadulerAllDayTask position={position} />)
    const el = container.querySelector(
      '[data-slot="shaduler-all-day-task"]',
    ) as HTMLElement
    expect(el.style.gridColumn).toBe('2 / 5')
    expect(el.style.gridRow).toBe('1')
  })

  it('becomes a button (role + tabIndex) when onClick is provided', () => {
    const { container } = render(
      <ShadulerAllDayTask position={position} onClick={() => {}} />,
    )
    const el = container.querySelector(
      '[data-slot="shaduler-all-day-task"]',
    ) as HTMLElement
    expect(el.getAttribute('role')).toBe('button')
    expect(el.tabIndex).toBe(0)
  })

  it('Enter on focused task fires onClick', () => {
    const onClick = vi.fn()
    const { container } = render(
      <ShadulerAllDayTask position={position} onClick={onClick} />,
    )
    const el = container.querySelector(
      '[data-slot="shaduler-all-day-task"]',
    ) as HTMLElement
    fireEvent.keyDown(el, { key: 'Enter' })
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('aria-label uses task name', () => {
    render(<ShadulerAllDayTask position={position} />)
    expect(screen.getByLabelText('PTO')).toBeTruthy()
  })

  it('respects custom children rendering', () => {
    render(
      <ShadulerAllDayTask position={position}>
        <span data-testid="custom">★ {position.task.name}</span>
      </ShadulerAllDayTask>,
    )
    expect(screen.getByTestId('custom').textContent).toBe('★ PTO')
  })
})
