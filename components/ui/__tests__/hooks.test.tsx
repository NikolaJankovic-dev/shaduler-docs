import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, fireEvent } from '@testing-library/react'
import { useRef } from 'react'
import {
  useShadulerTaskResize,
  useShadulerTaskDrag,
  useShadulerRangeSelect,
  type ShadulerColumn,
  type ShadulerTaskData,
  type UseShadulerTaskResizeOptions,
  type UseShadulerTaskDragOptions,
  type UseShadulerRangeSelectOptions,
} from '@/components/ui/shaduler'

const cols: ShadulerColumn[] = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' },
]

const sampleTask: ShadulerTaskData = {
  id: 1,
  column: 'a',
  name: 'X',
  startTime: '09:00',
  endTime: '10:00',
}

// Patch jsdom: getBoundingClientRect returns zeros, so we mock specific
// elements to simulate a 720x600 grid for math.
const mockGridRect = (el: HTMLElement) => {
  el.getBoundingClientRect = () =>
    ({
      top: 0,
      left: 0,
      right: 720,
      bottom: 600,
      width: 720,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect
}

beforeEach(() => {
  vi.useRealTimers()
})

// ============================================================================
// useShadulerTaskResize
// ============================================================================

function ResizeHarness({
  options,
}: {
  options: Omit<UseShadulerTaskResizeOptions, never>
}) {
  const { resizingTaskId, getResizeProps } = useShadulerTaskResize(options)
  const props = getResizeProps(sampleTask)
  return (
    <div>
      <div
        data-testid="trigger"
        onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => props.onResizeStart!(e, sampleTask)}
      >
        trigger
      </div>
      <span data-testid="state">
        {resizingTaskId === null ? 'idle' : `resizing-${String(resizingTaskId)}`}
      </span>
    </div>
  )
}

describe('useShadulerTaskResize', () => {
  it('starts in idle state', () => {
    const { getByTestId } = render(
      <ResizeHarness
        options={{
          hourHeight: 60,
          timeInterval: 15,
          startHour: 8,
          endHour: 19,
        }}
      />,
    )
    expect(getByTestId('state').textContent).toBe('idle')
  })

  it('flips to resizing on pointerdown and back to idle on pointerup', () => {
    const { getByTestId } = render(
      <ResizeHarness
        options={{
          hourHeight: 60,
          timeInterval: 15,
          startHour: 8,
          endHour: 19,
          onResizeEnd: () => {},
        }}
      />,
    )
    const trigger = getByTestId('trigger')
    fireEvent.pointerDown(trigger, { clientY: 100 })
    expect(getByTestId('state').textContent).toBe('resizing-1')
    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointerup', { clientY: 100 }) as PointerEvent,
      )
    })
    expect(getByTestId('state').textContent).toBe('idle')
  })

  it('fires onResize on pointermove with snapped endTime', () => {
    const onResize = vi.fn()
    const { getByTestId } = render(
      <ResizeHarness
        options={{
          hourHeight: 60,
          timeInterval: 15,
          startHour: 8,
          endHour: 19,
          minDurationMinutes: 15,
          onResize,
        }}
      />,
    )
    const trigger = getByTestId('trigger')
    // Start at clientY=100, drag down by 30px → +30min → endTime 10:30
    fireEvent.pointerDown(trigger, { clientY: 100 })
    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointermove', { clientY: 130 }) as PointerEvent,
      )
    })
    expect(onResize).toHaveBeenCalledWith(1, { endTime: '10:30' })
    // Cleanup
    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointerup', { clientY: 130 }) as PointerEvent,
      )
    })
  })

  it('fires onResizeEnd on pointerup with final endTime', () => {
    const onResizeEnd = vi.fn()
    const { getByTestId } = render(
      <ResizeHarness
        options={{
          hourHeight: 60,
          timeInterval: 15,
          startHour: 8,
          endHour: 19,
          onResizeEnd,
        }}
      />,
    )
    fireEvent.pointerDown(getByTestId('trigger'), { clientY: 100 })
    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointerup', { clientY: 160 }) as PointerEvent,
      )
    })
    // 60px down at 60px/h = +60min → 11:00
    expect(onResizeEnd).toHaveBeenCalledWith(1, { endTime: '11:00' })
  })

  it('clamps endTime so duration never falls below minDurationMinutes', () => {
    const onResizeEnd = vi.fn()
    const { getByTestId } = render(
      <ResizeHarness
        options={{
          hourHeight: 60,
          timeInterval: 15,
          startHour: 8,
          endHour: 19,
          minDurationMinutes: 15,
          onResizeEnd,
        }}
      />,
    )
    // Drag way up — endTime should clamp to startTime + 15min = 09:15
    fireEvent.pointerDown(getByTestId('trigger'), { clientY: 100 })
    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointerup', { clientY: -200 }) as PointerEvent,
      )
    })
    expect(onResizeEnd).toHaveBeenCalledWith(1, { endTime: '09:15' })
  })

  it('clamps endTime to range endHour:endMinute', () => {
    const onResizeEnd = vi.fn()
    const { getByTestId } = render(
      <ResizeHarness
        options={{
          hourHeight: 60,
          timeInterval: 15,
          startHour: 8,
          endHour: 18,
          endMinute: 30, // range ends at 18:30
          onResizeEnd,
        }}
      />,
    )
    fireEvent.pointerDown(getByTestId('trigger'), { clientY: 100 })
    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointerup', { clientY: 9999 }) as PointerEvent,
      )
    })
    expect(onResizeEnd).toHaveBeenCalledWith(1, { endTime: '18:30' })
  })
})

// ============================================================================
// useShadulerTaskDrag
// ============================================================================

function DragHarness({
  options,
  onClickReport,
}: {
  options: Omit<UseShadulerTaskDragOptions, 'gridRef' | 'columns'>
  onClickReport?: (task: ShadulerTaskData) => void
}) {
  const gridRef = useRef<HTMLDivElement>(null)
  const { draggingTaskId, getTaskDragProps } = useShadulerTaskDrag({
    gridRef,
    columns: cols,
    ...options,
  })
  const props = getTaskDragProps(sampleTask)
  return (
    <div>
      <div
        ref={(el) => {
          gridRef.current = el
          if (el) mockGridRect(el)
        }}
        data-testid="grid"
        style={{ width: 720, height: 600 }}
      />
      <div
        data-testid="trigger"
        onPointerDown={(e) => props.onTaskDragStart!(e, sampleTask)}
        onClick={() => onClickReport?.(sampleTask)}
      >
        task
      </div>
      <span data-testid="state">
        {draggingTaskId === null ? 'idle' : `dragging-${String(draggingTaskId)}`}
      </span>
    </div>
  )
}

describe('useShadulerTaskDrag', () => {
  it('does NOT enter dragging state for tiny pointer movement (click)', () => {
    const onDragEnd = vi.fn()
    const { getByTestId } = render(
      <DragHarness
        options={{
          hourHeight: 60,
          timeInterval: 15,
          startHour: 8,
          endHour: 19,
          clickThresholdPx: 4,
          onDragEnd,
        }}
      />,
    )
    fireEvent.pointerDown(getByTestId('trigger'), { clientX: 200, clientY: 100 })
    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 201, clientY: 101 }) as PointerEvent,
      )
      document.dispatchEvent(
        new PointerEvent('pointerup', { clientX: 201, clientY: 101 }) as PointerEvent,
      )
    })
    expect(onDragEnd).not.toHaveBeenCalled()
  })

  it('enters dragging state once movement exceeds clickThresholdPx', () => {
    const { getByTestId } = render(
      <DragHarness
        options={{
          hourHeight: 60,
          timeInterval: 15,
          startHour: 8,
          endHour: 19,
          clickThresholdPx: 4,
        }}
      />,
    )
    fireEvent.pointerDown(getByTestId('trigger'), { clientX: 200, clientY: 100 })
    expect(getByTestId('state').textContent).toBe('idle')
    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 220, clientY: 100 }) as PointerEvent,
      )
    })
    expect(getByTestId('state').textContent).toBe('dragging-1')
    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointerup', { clientX: 220, clientY: 100 }) as PointerEvent,
      )
    })
  })

  it('preserves task duration when dragging vertically', () => {
    const onDragEnd = vi.fn()
    // Task is 09:00-10:00 (60min), grid 8-19, so 09:00 starts at y=60.
    // Drag from clientY=120 (middle of task) to clientY=180 (60px down).
    // grabOffsetY = 120 - 60 = 60. New top = 180 - 60 = 120. New start = 120/60*60 + 8*60 = 120+480 = 600 = 10:00
    const { getByTestId } = render(
      <DragHarness
        options={{
          hourHeight: 60,
          timeInterval: 15,
          startHour: 8,
          endHour: 19,
          clickThresholdPx: 4,
          onDragEnd,
        }}
      />,
    )
    fireEvent.pointerDown(getByTestId('trigger'), { clientX: 200, clientY: 120 })
    act(() => {
      // First move past threshold to enter drag
      document.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 200, clientY: 180 }) as PointerEvent,
      )
      document.dispatchEvent(
        new PointerEvent('pointerup', { clientX: 200, clientY: 180 }) as PointerEvent,
      )
    })
    expect(onDragEnd).toHaveBeenCalledTimes(1)
    const update = onDragEnd.mock.calls[0][1]
    expect(update.startTime).toBe('10:00')
    expect(update.endTime).toBe('11:00')
  })

  it('updates column based on x position', () => {
    const onDragEnd = vi.fn()
    // grid 720px wide, timeColumnWidth=96, so data area = 624 / 3 cols ≈ 208/col.
    // x=400 falls in col 1 (b). x=200 falls in col 0 (a).
    const { getByTestId } = render(
      <DragHarness
        options={{
          hourHeight: 60,
          timeInterval: 15,
          startHour: 8,
          endHour: 19,
          timeColumnWidth: 96,
          clickThresholdPx: 4,
          onDragEnd,
        }}
      />,
    )
    fireEvent.pointerDown(getByTestId('trigger'), { clientX: 200, clientY: 120 })
    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 400, clientY: 120 }) as PointerEvent,
      )
      document.dispatchEvent(
        new PointerEvent('pointerup', { clientX: 400, clientY: 120 }) as PointerEvent,
      )
    })
    expect(onDragEnd).toHaveBeenCalledTimes(1)
    const update = onDragEnd.mock.calls[0][1]
    expect(update.column).toBe('b')
  })

  it('clamps newStart so newEnd never exceeds endHour:endMinute', () => {
    const onDragEnd = vi.fn()
    const { getByTestId } = render(
      <DragHarness
        options={{
          hourHeight: 60,
          timeInterval: 15,
          startHour: 8,
          endHour: 19,
          clickThresholdPx: 4,
          onDragEnd,
        }}
      />,
    )
    // Drag down by huge amount — should clamp so endTime <= 19:00
    fireEvent.pointerDown(getByTestId('trigger'), { clientX: 200, clientY: 120 })
    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 200, clientY: 9999 }) as PointerEvent,
      )
      document.dispatchEvent(
        new PointerEvent('pointerup', { clientX: 200, clientY: 9999 }) as PointerEvent,
      )
    })
    const update = onDragEnd.mock.calls[0][1]
    expect(update.endTime).toBe('19:00')
    expect(update.startTime).toBe('18:00')
  })
})

// ============================================================================
// useShadulerRangeSelect
// ============================================================================

function RangeHarness({
  options,
}: {
  options: Omit<UseShadulerRangeSelectOptions, 'gridRef'>
}) {
  const gridRef = useRef<HTMLDivElement>(null)
  const { activeRange, isSelecting, getCellProps } = useShadulerRangeSelect({
    gridRef,
    ...options,
  })
  const cellProps = getCellProps()
  return (
    <div>
      <div
        ref={(el) => {
          gridRef.current = el
          if (el) mockGridRect(el)
        }}
        data-testid="grid"
        style={{ width: 720, height: 600 }}
      />
      <div
        data-testid="cell"
        onPointerDown={(e) =>
          cellProps.onCellPointerDown!(e, {
            hour: 9,
            minute: 0,
            column: cols[0],
          })
        }
      >
        cell
      </div>
      <span data-testid="state">
        {isSelecting && activeRange
          ? `selecting:${activeRange.startMinutes}-${activeRange.endMinutes}@${String(activeRange.columnId)}`
          : 'idle'}
      </span>
    </div>
  )
}

describe('useShadulerRangeSelect', () => {
  it('starts idle, becomes "selecting" on cell pointerdown', () => {
    const { getByTestId } = render(
      <RangeHarness
        options={{
          hourHeight: 60,
          timeInterval: 15,
          startHour: 8,
          endHour: 19,
        }}
      />,
    )
    expect(getByTestId('state').textContent).toBe('idle')
    fireEvent.pointerDown(getByTestId('cell'))
    expect(getByTestId('state').textContent).toContain('selecting:540-555@a')
    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointerup', { clientY: 60 }) as PointerEvent,
      )
    })
  })

  it('extends the range on pointermove', () => {
    const onSelectChange = vi.fn()
    const { getByTestId } = render(
      <RangeHarness
        options={{
          hourHeight: 60,
          timeInterval: 15,
          startHour: 8,
          endHour: 19,
          onSelectChange,
        }}
      />,
    )
    fireEvent.pointerDown(getByTestId('cell'))
    // pointermove to clientY=120 → grid local y=120 → minutes from start (8:00) = 120 → absolute 600 = 10:00
    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointermove', { clientY: 120 }) as PointerEvent,
      )
    })
    const lastCall =
      onSelectChange.mock.calls[onSelectChange.mock.calls.length - 1][0]
    expect(lastCall.startMinutes).toBe(540) // 09:00
    expect(lastCall.endMinutes).toBe(600) // 10:00
    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointerup', { clientY: 120 }) as PointerEvent,
      )
    })
  })

  it('fires onSelect with the final range on pointerup', () => {
    const onSelect = vi.fn()
    const { getByTestId } = render(
      <RangeHarness
        options={{
          hourHeight: 60,
          timeInterval: 15,
          startHour: 8,
          endHour: 19,
          onSelect,
        }}
      />,
    )
    fireEvent.pointerDown(getByTestId('cell'))
    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointermove', { clientY: 180 }) as PointerEvent,
      )
      document.dispatchEvent(
        new PointerEvent('pointerup', { clientY: 180 }) as PointerEvent,
      )
    })
    expect(onSelect).toHaveBeenCalledTimes(1)
    const range = onSelect.mock.calls[0][0]
    expect(range.columnId).toBe('a')
    expect(range.startMinutes).toBe(540) // 09:00
    expect(range.endMinutes).toBe(660) // 11:00 (180px / 60 = 3h offset from 08:00 = 11:00)
  })

  it('resets to idle after pointerup', () => {
    const { getByTestId } = render(
      <RangeHarness
        options={{
          hourHeight: 60,
          timeInterval: 15,
          startHour: 8,
          endHour: 19,
        }}
      />,
    )
    fireEvent.pointerDown(getByTestId('cell'))
    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointerup', { clientY: 60 }) as PointerEvent,
      )
    })
    expect(getByTestId('state').textContent).toBe('idle')
  })
})
