import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Minimal shape of a task placed on the Shaduler grid.
 * Extend this interface to attach custom fields.
 */
export interface ShadulerTaskData {
  id: string | number
  /** Must match the `id` of one ShadulerColumn */
  column: string | number
  name: string
  /** Format: "HH:MM" (24h) */
  startTime: string
  /** Format: "HH:MM" (24h) */
  endTime: string
}

/**
 * A vertical column on the grid (resource, day, employee, etc.).
 */
export interface ShadulerColumn {
  id: string | number
  label: string
}

export type TimeFormat = '24h' | '12h'

/**
 * Computed pixel position of a task within its column. Generic on the task
 * shape so user-extended types (e.g. `interface BookingTask extends
 * ShadulerTaskData { customer: string }`) flow through to render-prop closures
 * without casts.
 */
export interface TaskPosition<T extends ShadulerTaskData = ShadulerTaskData> {
  task: T
  /** Top offset in pixels relative to the start of the time grid */
  top: number
  /** Height in pixels */
  height: number
  /** Index of the column the task belongs to */
  columnIndex: number
  /** Sibling index within the overlap group. `0` when the task has no overlaps. */
  groupIndex: number
  /** Number of overlapping tasks in the same group. `1` when the task has no overlaps. */
  groupCount: number
}

/**
 * Description of one row in the time grid. Most rows are full hours
 * (`durationMinutes: 60`), but partial first/last rows appear when
 * `startMinute`/`endMinute` are non-zero (e.g. a salon that opens at 8:30).
 */
export interface ShadulerRowInfo {
  /** Absolute minutes from midnight at the row's top edge. */
  startMinutes: number
  /** Duration of this row in minutes (typically 60, less for partial rows). */
  durationMinutes: number
  /** The integer hour that contains the row's start (e.g. 8 for an 8:30 row). */
  hour: number
  /** Minute offset within `hour` where this row starts. 0 for full rows. */
  startMinuteOffset: number
  /** 1-indexed CSS grid row this row maps to. */
  gridRow: number
  /** True when `durationMinutes < 60`. */
  isPartial: boolean
  /** True when the row's top is exactly on an hour boundary (label-bearing). */
  showLabel: boolean
}

/**
 * Result of `calculateShadulerData()`. Pass these values into the grid.
 * Generic on the task shape so user-extended types are preserved.
 */
export interface ShadulerCalculations<
  T extends ShadulerTaskData = ShadulerTaskData,
> {
  /** Integer hours that have a label-bearing row (for the time column). */
  hours: number[]
  /**
   * Row layout (one per cell row). Use this for `ShadulerCells` and
   * `ShadulerTimeColumn` when you want partial-hour support — and pass it
   * even when all rows are full hours, so changing the range works without
   * touching consumer code.
   */
  rows: ShadulerRowInfo[]
  /** Absolute minutes from midnight where the visible range begins. */
  startMinutes: number
  /** Absolute minutes from midnight where the visible range ends (exclusive). */
  endMinutes: number
  tasksByColumn: Record<string | number, T[]>
  taskPositions: Record<string | number, TaskPosition<T>[]>
  gridTemplateColumns: string
  gridTemplateRows: string
  timeColumnWidth: number
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format an hour value (0-23) as a time string.
 *
 * Pass a `locale` to delegate formatting to `Intl.DateTimeFormat`, which gives
 * you region-correct output (`9 AM` in en-US, `09:00` in de-DE, `오전 9시` in ko).
 * Without a locale, falls back to a small hand-rolled 24h / 12h formatter.
 */
export const formatTime = (
  hour: number,
  format: TimeFormat = '24h',
  locale?: string,
): string => {
  if (locale) {
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      hour12: format === '12h',
    }).format(new Date(2000, 0, 1, hour, 0, 0))
  }
  if (format === '12h') {
    if (hour === 0) return '12 AM'
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return '12 PM'
    return `${hour - 12} PM`
  }
  return `${hour.toString().padStart(2, '0')}:00`
}

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/** Reverse of `timeToMinutes`. Always pads to "HH:MM". */
export const minutesToTime = (totalMinutes: number): string => {
  const safe = Math.max(0, Math.round(totalMinutes))
  const h = Math.floor(safe / 60)
  const m = safe % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export const generateHours = (startHour: number, endHour: number): number[] => {
  return Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
}

/**
 * Walks the visible range and emits one `ShadulerRowInfo` per cell row.
 * Hour boundaries inside the range produce row breaks, so a range like
 * 8:30 → 18:30 yields a 30-min partial row, nine 60-min rows, then another
 * 30-min partial row.
 */
export const generateRows = (
  startHour: number,
  endHour: number,
  startMinute: number = 0,
  endMinute: number = 0,
  hourHeight: number = 60,
): ShadulerRowInfo[] => {
  const startTotal = startHour * 60 + startMinute
  const endTotal = endHour * 60 + endMinute
  const rows: ShadulerRowInfo[] = []
  let cursor = startTotal
  let gridRow = 1
  while (cursor < endTotal) {
    const nextHourBoundary = Math.floor(cursor / 60 + 1) * 60
    const rowEnd = Math.min(nextHourBoundary, endTotal)
    const hour = Math.floor(cursor / 60)
    const startMinuteOffset = cursor - hour * 60
    const durationMinutes = rowEnd - cursor
    rows.push({
      startMinutes: cursor,
      durationMinutes,
      hour,
      startMinuteOffset,
      gridRow: gridRow++,
      isPartial: durationMinutes < 60,
      showLabel: startMinuteOffset === 0,
    })
    cursor = rowEnd
  }
  // hourHeight is accepted for API symmetry / future use but not consumed here;
  // pixel sizes live on the consumer side (it makes generateRows a pure
  // time-domain function regardless of pixels-per-hour).
  void hourHeight
  return rows
}

export const groupTasksByColumn = <T extends ShadulerTaskData>(
  tasks: T[],
  columns: ShadulerColumn[],
): Record<string | number, T[]> => {
  const grouped: Record<string | number, T[]> = {}
  columns.forEach((col) => {
    grouped[col.id] = tasks.filter((task) => task.column === col.id)
  })
  return grouped
}

const calculateTaskPositions = <T extends ShadulerTaskData>(
  tasks: T[],
  columnIndex: number,
  startMinutes: number,
  endMinutes: number,
  hourHeight: number,
): TaskPosition<T>[] => {
  // Drop tasks fully outside the visible range; clamp the rest to the range.
  const taskData = tasks
    .map((task) => ({
      task,
      start: timeToMinutes(task.startTime),
      end: timeToMinutes(task.endTime),
    }))
    .filter((td) => !(td.end <= startMinutes || td.start >= endMinutes))
    .map((td) => ({
      ...td,
      start: Math.max(td.start, startMinutes),
      end: Math.min(td.end, endMinutes),
    }))

  taskData.sort((a, b) => a.start - b.start)

  // Bucket overlapping tasks together so they can be rendered side-by-side.
  const groups: (typeof taskData)[] = []
  let currentGroup: typeof taskData = []

  for (const td of taskData) {
    if (currentGroup.length === 0) {
      currentGroup.push(td)
      continue
    }
    const overlaps = currentGroup.some(
      (cg) => !(td.end <= cg.start || td.start >= cg.end),
    )
    if (overlaps) {
      currentGroup.push(td)
    } else {
      groups.push(currentGroup)
      currentGroup = [td]
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup)

  const positions: TaskPosition<T>[] = []

  for (const group of groups) {
    group.forEach((td, index) => {
      const startOffset = td.start - startMinutes
      const endOffset = td.end - startMinutes
      positions.push({
        task: td.task,
        top: (startOffset / 60) * hourHeight,
        height: ((endOffset - startOffset) / 60) * hourHeight,
        columnIndex,
        groupIndex: index,
        groupCount: group.length,
      })
    })
  }

  return positions
}

const calculateAllTaskPositions = <T extends ShadulerTaskData>(
  columns: ShadulerColumn[],
  tasksByColumn: Record<string | number, T[]>,
  startMinutes: number,
  endMinutes: number,
  hourHeight: number,
): Record<string | number, TaskPosition<T>[]> => {
  const positions: Record<string | number, TaskPosition<T>[]> = {}
  columns.forEach((col, colIndex) => {
    positions[col.id] = calculateTaskPositions(
      tasksByColumn[col.id] ?? [],
      colIndex,
      startMinutes,
      endMinutes,
      hourHeight,
    )
  })
  return positions
}

export interface CalculateShadulerDataOptions {
  /** Width of the leading time column in pixels. Default 96. */
  timeColumnWidth?: number
  /**
   * Minimum width per data column in pixels. When the container is narrower,
   * horizontal scrolling kicks in instead of squishing columns. Default 140.
   * Set to 0 if you want columns to shrink to fit narrow viewports.
   */
  minColumnWidth?: number
  /**
   * Minute offset within `startHour` where the visible range begins. Default 0.
   * For a salon that opens at 8:30, pass `startHour: 8, startMinute: 30`.
   * Produces a partial first row whose duration is `60 - startMinute` minutes.
   */
  startMinute?: number
  /**
   * Minute offset within `endHour` where the visible range ends. Default 0.
   * For a range that ends at 18:30, pass `endHour: 18, endMinute: 30`.
   * Produces a partial last row whose duration is `endMinute` minutes.
   */
  endMinute?: number
}

/**
 * Pre-compute everything the grid needs from columns and tasks.
 * Memoize the result in your component for best performance.
 *
 * Generic on the task shape — pass an extended type to preserve custom fields
 * through `tasksByColumn` and `taskPositions[colId][i].task`:
 *
 * @example
 * interface BookingTask extends ShadulerTaskData {
 *   customer: string
 * }
 * const data = calculateShadulerData<BookingTask>(cols, bookings, 8, 19, 60)
 * // data.taskPositions[colId][0].task.customer is now typed
 *
 * @example
 * // Salon hours 8:30 → 18:30:
 * const data = calculateShadulerData(cols, tasks, 8, 18, 60, {
 *   startMinute: 30,
 *   endMinute: 30,
 * })
 */
export const calculateShadulerData = <
  T extends ShadulerTaskData = ShadulerTaskData,
>(
  columns: ShadulerColumn[],
  tasks: T[],
  startHour: number,
  endHour: number,
  hourHeight: number,
  optsOrTimeColumnWidth: number | CalculateShadulerDataOptions = 96,
): ShadulerCalculations<T> => {
  const opts: CalculateShadulerDataOptions =
    typeof optsOrTimeColumnWidth === 'number'
      ? { timeColumnWidth: optsOrTimeColumnWidth }
      : optsOrTimeColumnWidth
  const timeColumnWidth = opts.timeColumnWidth ?? 96
  const minColumnWidth = opts.minColumnWidth ?? 140
  const startMinute = opts.startMinute ?? 0
  const endMinute = opts.endMinute ?? 0

  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute

  const rows = generateRows(startHour, endHour, startMinute, endMinute)
  const hours = rows.filter((r) => r.showLabel).map((r) => r.hour)
  const tasksByColumn = groupTasksByColumn(tasks, columns)
  const taskPositions = calculateAllTaskPositions(
    columns,
    tasksByColumn,
    startMinutes,
    endMinutes,
    hourHeight,
  )

  // Build CSS grid rows from the ShadulerRowInfo list. When all rows are full
  // hours we collapse to `repeat(N, hourHeight)` for slightly cleaner CSS.
  const allFullHours = rows.every((r) => r.durationMinutes === 60)
  const gridTemplateRows = allFullHours
    ? `repeat(${rows.length}, ${hourHeight}px)`
    : rows
        .map((r) => `${(r.durationMinutes / 60) * hourHeight}px`)
        .join(' ')

  return {
    hours,
    rows,
    startMinutes,
    endMinutes,
    tasksByColumn,
    taskPositions,
    gridTemplateColumns: `${timeColumnWidth}px repeat(${columns.length}, minmax(${minColumnWidth}px, 1fr))`,
    gridTemplateRows,
    timeColumnWidth,
  }
}

// ============================================================================
// VARIANTS
// ============================================================================

const shadulerTaskVariants = cva(
  'flex h-full flex-col overflow-hidden rounded-md border px-2 py-1 text-xs transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border-primary/20',
        secondary:
          'bg-secondary text-secondary-foreground border-secondary',
        outline: 'bg-background text-foreground border-border',
        muted: 'bg-muted text-muted-foreground border-muted',
        destructive:
          'bg-destructive/10 text-destructive border-destructive/30',
        accent: 'bg-accent text-accent-foreground border-accent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

// ============================================================================
// HOOKS — opt-in interactivity
// ============================================================================
//
// All three hooks below are pure utilities: they generate handlers you spread
// onto the matching component prop. The component itself stays display-driven.
// You only pull in the parts you need.
//
//   useShadulerTaskResize   →  ShadulerTask `onResizeStart` + `isDragging`
//   useShadulerTaskDrag     →  ShadulerTask `onTaskDragStart` + `isDragging`
//   useShadulerRangeSelect  →  ShadulerCell `onCellPointerDown` + active range
//
// Document-level pointermove / pointerup listeners are attached on press
// and removed on release / cancel. Each hook returns latest-state via React
// state plus a stable getter that you call inside your render loop.

interface PointerGridMetrics {
  hourHeight: number
  timeInterval: number
  /** Range start in absolute minutes from midnight. */
  startTotalMinutes: number
  /** Range end in absolute minutes from midnight. */
  endTotalMinutes: number
  timeColumnWidth: number
  columns: ShadulerColumn[]
}

/**
 * Map a viewport pointer position onto column / minutes within the grid.
 *
 * Assumes data columns are equal width (the default produced by
 * `calculateShadulerData`, where the grid template is
 * `${timeColumnWidth}px repeat(N, minmax(${minColumnWidth}px, 1fr))`).
 * If you pass a custom non-uniform `gridTemplateColumns`, the column index
 * resolution will be wrong — read column rects from the DOM yourself instead.
 */
const resolvePointerOnGrid = (
  pointer: { x: number; y: number },
  gridRect: DOMRect,
  m: PointerGridMetrics,
): { columnIndex: number; columnId: string | number | null; minutes: number } => {
  const localY = pointer.y - gridRect.top
  const rawMinutes = (localY / m.hourHeight) * 60 + m.startTotalMinutes
  const snapped =
    Math.round(rawMinutes / m.timeInterval) * m.timeInterval
  const minutes = Math.max(
    m.startTotalMinutes,
    Math.min(m.endTotalMinutes, snapped),
  )

  if (m.columns.length === 0) {
    return { columnIndex: 0, columnId: null, minutes }
  }
  const localX = pointer.x - gridRect.left - m.timeColumnWidth
  const colWidth =
    (gridRect.width - m.timeColumnWidth) / m.columns.length
  const idx = Math.max(
    0,
    Math.min(m.columns.length - 1, Math.floor(localX / colWidth)),
  )
  return { columnIndex: idx, columnId: m.columns[idx]!.id, minutes }
}

/**
 * Resize a task by dragging its bottom edge. Pass the returned `onResizeStart`
 * via `getResizeProps(task)` to a `<ShadulerTask>`.
 *
 * The hook does not own task state — your `onResize` updates it, and the new
 * `endTime` flows back through props on the next render.
 */
export interface UseShadulerTaskResizeOptions {
  hourHeight?: number
  /** Snap minutes (default 15). */
  timeInterval?: number
  /** Lower / upper bounds (in hours) for the resulting endTime. */
  startHour?: number
  endHour?: number
  /** Minute offset within `startHour`. Default 0. */
  startMinute?: number
  /** Minute offset within `endHour`. Default 0. */
  endMinute?: number
  /** Reject resize that would make the task shorter than this many minutes. Default 15. */
  minDurationMinutes?: number
  /** Live update during drag. Use this to render a preview. */
  onResize?: (
    taskId: string | number,
    update: { endTime: string },
  ) => void
  /** Final commit when the user releases the pointer. */
  onResizeEnd?: (
    taskId: string | number,
    update: { endTime: string },
  ) => void
}

function useShadulerTaskResize({
  hourHeight = 60,
  timeInterval = 15,
  startHour = 0,
  endHour = 24,
  startMinute = 0,
  endMinute = 0,
  minDurationMinutes = 15,
  onResize,
  onResizeEnd,
}: UseShadulerTaskResizeOptions) {
  // Latest-callback refs: lets the user pass inline handlers without breaking
  // the `useCallback` stability of `handleResizeStart` / `getResizeProps`.
  const onResizeRef = React.useRef(onResize)
  const onResizeEndRef = React.useRef(onResizeEnd)
  React.useEffect(() => {
    onResizeRef.current = onResize
    onResizeEndRef.current = onResizeEnd
  })

  const [resizingTaskId, setResizingTaskId] = React.useState<
    string | number | null
  >(null)

  const handleResizeStart = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>, task: ShadulerTaskData) => {
      const startPtrY = e.clientY
      const startMin = timeToMinutes(task.startTime)
      const initialEndMin = timeToMinutes(task.endTime)
      const rangeEndMin = endHour * 60 + endMinute
      let lastEnd = initialEndMin
      setResizingTaskId(task.id)

      const compute = (clientY: number) => {
        const deltaY = clientY - startPtrY
        const deltaMinutes = (deltaY / hourHeight) * 60
        const raw = initialEndMin + deltaMinutes
        const snapped = Math.round(raw / timeInterval) * timeInterval
        const min = startMin + minDurationMinutes
        const max = rangeEndMin
        return Math.max(min, Math.min(max, snapped))
      }

      const handleMove = (ev: PointerEvent) => {
        const next = compute(ev.clientY)
        if (next !== lastEnd) {
          lastEnd = next
          onResizeRef.current?.(task.id, { endTime: minutesToTime(next) })
        }
      }

      const handleUp = (ev: PointerEvent) => {
        const final = compute(ev.clientY)
        onResizeEndRef.current?.(task.id, { endTime: minutesToTime(final) })
        cleanup()
      }

      const cleanup = () => {
        setResizingTaskId(null)
        document.removeEventListener('pointermove', handleMove)
        document.removeEventListener('pointerup', handleUp)
        document.removeEventListener('pointercancel', cleanup)
      }

      document.addEventListener('pointermove', handleMove)
      document.addEventListener('pointerup', handleUp)
      document.addEventListener('pointercancel', cleanup)
    },
    [hourHeight, timeInterval, startHour, endHour, startMinute, endMinute, minDurationMinutes],
  )

  const getResizeProps = React.useCallback(
    (task: ShadulerTaskData) => ({
      onResizeStart: handleResizeStart,
      isDragging: resizingTaskId === task.id,
    }),
    [handleResizeStart, resizingTaskId],
  )

  return { resizingTaskId, getResizeProps }
}

/**
 * Drag a task between columns and times. Duration is preserved. Pass the
 * returned `onTaskDragStart` via `getTaskDragProps(task)` to a `<ShadulerTask>`.
 *
 * Click-vs-drag: if the pointer moves less than `clickThresholdPx` (default 4)
 * between press and release, the gesture is treated as a click — `onDragEnd`
 * does NOT fire and the native browser click fires normally, so your
 * `<ShadulerTask onClick={...}>` handler runs as expected. When a real drag
 * happens, the next browser click is suppressed automatically so you don't
 * get a stray click after dropping.
 *
 * `isDragging` only becomes `true` once the threshold is crossed, so brief
 * clicks never visually "feel" like a drag.
 *
 * Requires a `gridRef` to a `<ShadulerGrid>` element so the hook can resolve
 * pointer coordinates against the grid's bounding box.
 */
export interface UseShadulerTaskDragOptions {
  gridRef: React.RefObject<HTMLElement | null>
  columns: ShadulerColumn[]
  hourHeight?: number
  timeInterval?: number
  startHour?: number
  endHour?: number
  /** Minute offset within `startHour`. Default 0. */
  startMinute?: number
  /** Minute offset within `endHour`. Default 0. */
  endMinute?: number
  timeColumnWidth?: number
  /**
   * Pointer movement (in CSS pixels) below which the gesture is treated as a
   * click rather than a drag. Default 4.
   */
  clickThresholdPx?: number
  /** Live update during drag. Use this to render a preview. */
  onDrag?: (
    taskId: string | number,
    update: {
      column: string | number
      startTime: string
      endTime: string
    },
  ) => void
  /** Final commit when the user releases the pointer after a real drag. */
  onDragEnd?: (
    taskId: string | number,
    update: {
      column: string | number
      startTime: string
      endTime: string
    },
  ) => void
}

function useShadulerTaskDrag({
  gridRef,
  columns,
  hourHeight = 60,
  timeInterval = 15,
  startHour = 0,
  endHour = 24,
  startMinute = 0,
  endMinute = 0,
  timeColumnWidth = 96,
  clickThresholdPx = 4,
  onDrag,
  onDragEnd,
}: UseShadulerTaskDragOptions) {
  const onDragRef = React.useRef(onDrag)
  const onDragEndRef = React.useRef(onDragEnd)
  React.useEffect(() => {
    onDragRef.current = onDrag
    onDragEndRef.current = onDragEnd
  })

  const [draggingTaskId, setDraggingTaskId] = React.useState<
    string | number | null
  >(null)

  const handleDragStart = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>, task: ShadulerTaskData) => {
      const grid = gridRef.current
      if (!grid) return
      const startPtrX = e.clientX
      const startPtrY = e.clientY
      let didDrag = false

      const startTotalMinutes = startHour * 60 + startMinute
      const endTotalMinutes = endHour * 60 + endMinute

      const initialRect = grid.getBoundingClientRect()
      const initialStart = timeToMinutes(task.startTime)
      const initialEnd = timeToMinutes(task.endTime)
      const duration = initialEnd - initialStart
      const initialTopPx =
        ((initialStart - startTotalMinutes) / 60) * hourHeight
      const grabOffsetY = e.clientY - (initialRect.top + initialTopPx)

      const compute = (clientX: number, clientY: number) => {
        const rect = grid.getBoundingClientRect()
        const metrics: PointerGridMetrics = {
          hourHeight,
          timeInterval,
          startTotalMinutes,
          endTotalMinutes,
          timeColumnWidth,
          columns,
        }
        const { columnId, minutes } = resolvePointerOnGrid(
          { x: clientX, y: clientY - grabOffsetY },
          rect,
          metrics,
        )
        const minStart = startTotalMinutes
        const maxStart = endTotalMinutes - duration
        const newStart = Math.max(minStart, Math.min(maxStart, minutes))
        const newEnd = newStart + duration
        return {
          column: columnId ?? task.column,
          startTime: minutesToTime(newStart),
          endTime: minutesToTime(newEnd),
        }
      }

      let lastUpdate = {
        column: task.column,
        startTime: task.startTime,
        endTime: task.endTime,
      }

      const handleMove = (ev: PointerEvent) => {
        if (!didDrag) {
          const dx = ev.clientX - startPtrX
          const dy = ev.clientY - startPtrY
          if (Math.hypot(dx, dy) <= clickThresholdPx) return
          didDrag = true
          setDraggingTaskId(task.id)
        }
        const next = compute(ev.clientX, ev.clientY)
        if (
          next.column !== lastUpdate.column ||
          next.startTime !== lastUpdate.startTime
        ) {
          lastUpdate = next
          onDragRef.current?.(task.id, next)
        }
      }

      const handleUp = (ev: PointerEvent) => {
        if (didDrag) {
          const final = compute(ev.clientX, ev.clientY)
          onDragEndRef.current?.(task.id, final)
          // Suppress the synthetic click event the browser may fire after a
          // real drag, so user-attached `onClick` on the task doesn't fire.
          // The capturing one-shot listener catches it before reaching the task.
          window.addEventListener(
            'click',
            (e) => e.stopPropagation(),
            { capture: true, once: true },
          )
        }
        cleanup()
      }

      const cleanup = () => {
        setDraggingTaskId(null)
        document.removeEventListener('pointermove', handleMove)
        document.removeEventListener('pointerup', handleUp)
        document.removeEventListener('pointercancel', cleanup)
      }

      document.addEventListener('pointermove', handleMove)
      document.addEventListener('pointerup', handleUp)
      document.addEventListener('pointercancel', cleanup)
    },
    [
      gridRef,
      columns,
      hourHeight,
      timeInterval,
      startHour,
      endHour,
      startMinute,
      endMinute,
      timeColumnWidth,
      clickThresholdPx,
    ],
  )

  const getTaskDragProps = React.useCallback(
    (task: ShadulerTaskData) => ({
      onTaskDragStart: handleDragStart,
      isDragging: draggingTaskId === task.id,
    }),
    [handleDragStart, draggingTaskId],
  )

  return { draggingTaskId, getTaskDragProps }
}

/**
 * Drag across cells to define a time range (e.g. drag-to-create). The active
 * range is locked to the column where the drag started.
 *
 * Pass the returned `onCellPointerDown` via `getCellProps()` to `<ShadulerCell>`.
 */
export interface ShadulerRange {
  columnId: string | number
  startMinutes: number
  endMinutes: number
}

export interface UseShadulerRangeSelectOptions {
  gridRef: React.RefObject<HTMLElement | null>
  hourHeight?: number
  timeInterval?: number
  startHour?: number
  endHour?: number
  /** Minute offset within `startHour`. Default 0. */
  startMinute?: number
  /** Minute offset within `endHour`. Default 0. */
  endMinute?: number
  /** Live update during drag. Use this to render a preview overlay. */
  onSelectChange?: (range: ShadulerRange) => void
  /** Final commit when the user releases the pointer. */
  onSelect?: (range: ShadulerRange) => void
}

function useShadulerRangeSelect({
  gridRef,
  hourHeight = 60,
  timeInterval = 15,
  startHour = 0,
  endHour = 24,
  startMinute = 0,
  endMinute = 0,
  onSelectChange,
  onSelect,
}: UseShadulerRangeSelectOptions) {
  const onSelectChangeRef = React.useRef(onSelectChange)
  const onSelectRef = React.useRef(onSelect)
  React.useEffect(() => {
    onSelectChangeRef.current = onSelectChange
    onSelectRef.current = onSelect
  })

  const [activeRange, setActiveRange] = React.useState<ShadulerRange | null>(
    null,
  )

  const handleCellPointerDown = React.useCallback(
    (
      _e: React.PointerEvent<HTMLDivElement>,
      info: {
        hour: number
        minute: number
        column?: ShadulerColumn
      },
    ) => {
      if (!info.column) return
      const grid = gridRef.current
      if (!grid) return

      const startMinutes = info.hour * 60 + info.minute
      const columnId = info.column.id
      const initial: ShadulerRange = {
        columnId,
        startMinutes,
        endMinutes: startMinutes + timeInterval,
      }
      setActiveRange(initial)
      onSelectChangeRef.current?.(initial)

      let lastRange = initial

      const startTotal = startHour * 60 + startMinute
      const endTotal = endHour * 60 + endMinute

      const compute = (clientY: number): ShadulerRange => {
        const rect = grid.getBoundingClientRect()
        const localY = clientY - rect.top
        const raw = (localY / hourHeight) * 60 + startTotal
        const snapped = Math.round(raw / timeInterval) * timeInterval
        const m = Math.max(startTotal, Math.min(endTotal, snapped))
        const a = Math.min(startMinutes, m)
        const b = Math.max(startMinutes + timeInterval, Math.max(startMinutes, m))
        return { columnId, startMinutes: a, endMinutes: b }
      }

      const handleMove = (ev: PointerEvent) => {
        const next = compute(ev.clientY)
        if (
          next.startMinutes !== lastRange.startMinutes ||
          next.endMinutes !== lastRange.endMinutes
        ) {
          lastRange = next
          setActiveRange(next)
          onSelectChangeRef.current?.(next)
        }
      }

      const handleUp = (ev: PointerEvent) => {
        const final = compute(ev.clientY)
        onSelectRef.current?.(final)
        cleanup()
      }

      const cleanup = () => {
        setActiveRange(null)
        document.removeEventListener('pointermove', handleMove)
        document.removeEventListener('pointerup', handleUp)
        document.removeEventListener('pointercancel', cleanup)
      }

      document.addEventListener('pointermove', handleMove)
      document.addEventListener('pointerup', handleUp)
      document.addEventListener('pointercancel', cleanup)
    },
    [gridRef, hourHeight, timeInterval, startHour, endHour, startMinute, endMinute],
  )

  const getCellProps = React.useCallback(
    () => ({
      onCellPointerDown: handleCellPointerDown,
    }),
    [handleCellPointerDown],
  )

  const isSelecting = activeRange !== null

  return { activeRange, isSelecting, getCellProps }
}

/**
 * Merge multiple hook outputs into a single set of props for `<ShadulerTask>`.
 * Falsy sources are ignored, so you can pass `enabled && hookProps` directly.
 *
 * Resolution rules:
 * - First defined `onResizeStart` / `onTaskDragStart` wins; later duplicates
 *   are silently dropped (you should never have two competing handlers — pick
 *   one source of truth per interaction).
 * - `isDragging` / `isSelecting` are OR'd across sources.
 *
 * @example
 * const props = composeShadulerTaskProps(
 *   resizeEnabled && getResizeProps(task),
 *   dragEnabled && getTaskDragProps(task),
 *   { isSelecting },
 * )
 * <ShadulerTask {...props} ... />
 */
export interface ComposableShadulerTaskProps {
  onResizeStart?: (
    event: React.PointerEvent<HTMLDivElement>,
    task: ShadulerTaskData,
  ) => void
  onTaskDragStart?: (
    event: React.PointerEvent<HTMLDivElement>,
    task: ShadulerTaskData,
  ) => void
  isDragging?: boolean
  isSelecting?: boolean
}

export const composeShadulerTaskProps = (
  ...sources: Array<ComposableShadulerTaskProps | false | null | undefined>
): ComposableShadulerTaskProps => {
  const out: ComposableShadulerTaskProps = {}
  for (const source of sources) {
    if (!source) continue
    if (source.onResizeStart && !out.onResizeStart) {
      out.onResizeStart = source.onResizeStart
    }
    if (source.onTaskDragStart && !out.onTaskDragStart) {
      out.onTaskDragStart = source.onTaskDragStart
    }
    if (source.isDragging) out.isDragging = true
    if (source.isSelecting) out.isSelecting = true
  }
  return out
}

// ============================================================================
// ROOT
// ============================================================================

function Shaduler({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="shaduler"
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden rounded-lg border bg-background',
        className,
      )}
      {...props}
    />
  )
}

// ============================================================================
// HEADER (optional slot, no default content)
// ============================================================================

function ShadulerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="shaduler-header"
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between border-b bg-background px-4 py-3',
        className,
      )}
      {...props}
    />
  )
}

// ============================================================================
// CONTENT (scroll wrapper)
// ============================================================================

function ShadulerContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="shaduler-content"
      className={cn('scrollbar-thin flex-1 overflow-auto', className)}
      {...props}
    />
  )
}

// ============================================================================
// GRID
// ============================================================================

interface ShadulerGridProps extends React.ComponentProps<'div'> {
  gridTemplateColumns: string
  gridTemplateRows: string
}

function ShadulerGrid({
  className,
  gridTemplateColumns,
  gridTemplateRows,
  role = 'grid',
  style,
  ...props
}: ShadulerGridProps) {
  return (
    <div
      data-slot="shaduler-grid"
      role={role}
      // `w-max min-w-full` makes the grid box match the sum of its column
      // tracks when they overflow (so sticky children, like the time
      // column, anchor to the real scroll viewport edge instead of the
      // visible-but-narrower parent box) while still filling the parent
      // when there are few columns.
      className={cn('relative grid w-max min-w-full', className)}
      style={{
        gridTemplateColumns,
        gridTemplateRows,
        boxSizing: 'border-box',
        ...style,
      }}
      {...props}
    />
  )
}

// ============================================================================
// COLUMNS HEADER
// ============================================================================

interface ShadulerColumnsHeaderProps extends React.ComponentProps<'div'> {
  columns?: ShadulerColumn[]
  gridTemplateColumns: string
}

function ShadulerColumnsHeader({
  className,
  children,
  columns,
  gridTemplateColumns,
  style,
  ...props
}: ShadulerColumnsHeaderProps) {
  return (
    <div
      data-slot="shaduler-columns-header"
      className={cn(
        // The bottom border lives on the column-header / corner children
        // (not on this container) so it spans the full grid track width
        // even when the grid overflows horizontally.
        // z-30 keeps the sticky header above the time column (z-20) when
        // the user scrolls vertically — otherwise time labels would bleed
        // into the header strip at the top-left.
        // `w-max min-w-full` matches the body grid: width = sum of tracks
        // when they overflow horizontally, otherwise fills the parent. The
        // bg has to span the actual track width (not just the visible
        // viewport) so it stays opaque under the column labels after the
        // user scrolls vertically.
        'sticky top-0 z-30 grid min-h-14 w-max min-w-full bg-background',
        className,
      )}
      style={{
        gridTemplateColumns,
        boxSizing: 'border-box',
        ...style,
      }}
      {...props}
    >
      {children ??
        columns?.map((column, index) => (
          <ShadulerColumnHeader
            key={column.id}
            column={column}
            columnIndex={index}
          >
            {column.label}
          </ShadulerColumnHeader>
        ))}
    </div>
  )
}

interface ShadulerColumnHeaderProps extends React.ComponentProps<'div'> {
  column?: ShadulerColumn
  columnIndex: number
}

function ShadulerColumnHeader({
  className,
  column,
  columnIndex,
  children,
  role = 'columnheader',
  style,
  ...props
}: ShadulerColumnHeaderProps) {
  return (
    <div
      data-slot="shaduler-column-header"
      role={role}
      className={cn(
        'flex items-center justify-center border-b border-r px-4 py-3 text-center text-sm font-semibold',
        className,
      )}
      style={{
        gridColumn: columnIndex + 2,
        boxSizing: 'border-box',
        minWidth: 0,
        ...style,
      }}
      {...props}
    >
      {children ?? column?.label}
    </div>
  )
}

// ============================================================================
// CORNER (top-left freeze)
// ============================================================================

function ShadulerCorner({
  className,
  style,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="shaduler-corner"
      className={cn(
        'sticky left-0 top-0 z-20 border-b border-r bg-background px-4 py-3',
        className,
      )}
      style={{
        gridColumn: 1,
        ...style,
      }}
      {...props}
    />
  )
}

// ============================================================================
// TIME COLUMN
// ============================================================================

interface ShadulerTimeColumnProps extends React.ComponentProps<'div'> {
  /** Start hour (e.g. 8). Used when `rows` is not provided. */
  startTime?: number
  /** End hour, exclusive of `endMinute` (e.g. 19). Used when `rows` is not provided. */
  endTime?: number
  /** Minute offset within `startTime` for partial first row. */
  startMinute?: number
  /** Minute offset within `endTime` for partial last row. */
  endMinute?: number
  /**
   * Row layout. Pass `calculations.rows` for full partial-row support.
   * When omitted, rows are derived from `startTime`/`endTime`/`startMinute`/`endMinute`.
   */
  rows?: ShadulerRowInfo[]
  hourHeight?: number
  timeFormat?: TimeFormat
  /** BCP 47 locale (e.g. "en-US", "de-DE"). When set, uses `Intl.DateTimeFormat`. */
  locale?: string
}

function ShadulerTimeColumn({
  className,
  children,
  startTime = 0,
  endTime = 24,
  startMinute = 0,
  endMinute = 0,
  rows,
  hourHeight = 60,
  timeFormat = '24h',
  locale,
  style,
  ...props
}: ShadulerTimeColumnProps) {
  const resolvedRows: ShadulerRowInfo[] =
    rows ?? generateRows(startTime, endTime, startMinute, endMinute)
  return (
    <div
      data-slot="shaduler-time-column"
      className={cn(
        // z-20 keeps the time column above tasks/cells when the grid scrolls
        // horizontally, so tasks slide behind it instead of through it.
        'sticky left-0 z-20 flex flex-col bg-background',
        className,
      )}
      style={{
        gridColumn: 1,
        gridRow: `1 / ${resolvedRows.length + 1}`,
        ...style,
      }}
      {...props}
    >
      {children ??
        resolvedRows.map((row, rowIndex) => (
          <ShadulerTimeSlot
            key={row.startMinutes}
            hour={row.hour}
            durationMinutes={row.durationMinutes}
            showLabel={row.showLabel}
            timeFormat={timeFormat}
            locale={locale}
            hourHeight={hourHeight}
            hourIndex={rowIndex}
          />
        ))}
    </div>
  )
}

interface ShadulerTimeSlotProps extends React.ComponentProps<'div'> {
  hour: number
  hourHeight?: number
  /** Slot duration in minutes. Default 60. Set < 60 for partial rows. */
  durationMinutes?: number
  /** Render the hour label. Default true. Set false for partial rows that don't sit on an hour boundary. */
  showLabel?: boolean
  timeFormat?: TimeFormat
  locale?: string
  hourIndex: number
}

function ShadulerTimeSlot({
  className,
  hour,
  children,
  hourHeight = 60,
  durationMinutes = 60,
  showLabel = true,
  timeFormat = '24h',
  locale,
  hourIndex,
  style,
  ...props
}: ShadulerTimeSlotProps) {
  const slotHeight = (durationMinutes / 60) * hourHeight
  return (
    <div
      data-slot="shaduler-time-slot"
      className={cn('relative border-b border-r', className)}
      style={{
        height: slotHeight,
        ...style,
      }}
      {...props}
    >
      {children ??
        (showLabel && (
          <span
            className={cn(
              'absolute left-1/2 -translate-x-1/2 bg-background px-2 text-xs text-muted-foreground sm:text-sm',
              hourIndex === 0 ? 'top-2' : '-top-3',
            )}
          >
            {formatTime(hour, timeFormat, locale)}
          </span>
        ))}
    </div>
  )
}

// ============================================================================
// CELL
// ============================================================================

interface ShadulerCellProps extends React.ComponentProps<'div'> {
  hour: number
  column?: ShadulerColumn
  columnIndex: number
  hourIndex: number
  hourHeight?: number
  /**
   * Minute offset within `hour` where this cell starts. 0 for full-hour cells
   * (the default). Set to e.g. 30 for the partial cell that opens an 8:30
   * range with `startMinute: 30`.
   */
  startMinuteOffset?: number
  /**
   * Cell duration in minutes. 60 for full-hour cells (the default). Set to
   * the row's actual duration for partial first/last rows so the snapping
   * math and rendered height match.
   */
  durationMinutes?: number
  /** Snap interval in minutes for `onCellPointerDown`. Default 15. */
  timeInterval?: number
  /**
   * Fires when user presses the cell. The reported `hour` and `minute`
   * represent the *absolute* clicked time (snapped to `timeInterval`), so
   * partial cells correctly report e.g. `(hour=8, minute=45)` for a click in
   * the middle of an 8:30–9:00 cell. The cell is non-interactive by default.
   */
  onCellPointerDown?: (
    event: React.PointerEvent<HTMLDivElement>,
    info: { hour: number; minute: number; column?: ShadulerColumn },
  ) => void
}

function ShadulerCell({
  className,
  hour,
  column,
  columnIndex,
  hourIndex,
  hourHeight = 60,
  startMinuteOffset = 0,
  durationMinutes = 60,
  timeInterval = 15,
  onCellPointerDown,
  onPointerDown,
  role = 'gridcell',
  'aria-label': ariaLabel,
  style,
  children,
  ...props
}: ShadulerCellProps) {
  const isInteractive = Boolean(onCellPointerDown)
  const cellHeightPx = (durationMinutes / 60) * hourHeight

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e)
    if (!onCellPointerDown) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    // Convert pixel offset → minutes within this cell (independent of cell
    // duration), then add the cell's absolute start to get the clicked time.
    const yMin = (y / hourHeight) * 60
    const cellStartMinAbs = hour * 60 + startMinuteOffset
    const totalMinAbs = Math.min(
      cellStartMinAbs + durationMinutes,
      cellStartMinAbs + yMin,
    )
    const snapped =
      Math.floor(totalMinAbs / timeInterval) * timeInterval
    const finalHour = Math.floor(snapped / 60)
    const finalMinute = snapped - finalHour * 60
    onCellPointerDown(e, {
      hour: finalHour,
      minute: finalMinute,
      column,
    })
  }

  const labelHourStr = hour.toString().padStart(2, '0')
  const labelMinuteStr = startMinuteOffset.toString().padStart(2, '0')
  const defaultLabel =
    column?.label != null
      ? `${column.label} at ${labelHourStr}:${labelMinuteStr}`
      : `${labelHourStr}:${labelMinuteStr}`

  return (
    <div
      data-slot="shaduler-cell"
      data-interactive={isInteractive || undefined}
      role={role}
      aria-label={ariaLabel ?? defaultLabel}
      className={cn(
        'relative border-b border-r transition-colors hover:bg-muted/50',
        // Block touch-pan only on devices with precise pointers (desktop),
        // so mobile users can still scroll the calendar with their finger.
        isInteractive && 'pointer-fine:[touch-action:none]',
        className,
      )}
      style={{
        gridColumn: columnIndex + 2,
        gridRow: hourIndex + 1,
        height: cellHeightPx,
        boxSizing: 'border-box',
        minWidth: 0,
        ...style,
      }}
      onPointerDown={isInteractive ? handlePointerDown : onPointerDown}
      {...props}
    >
      {children}
    </div>
  )
}

// Performance tip: with a typical day grid (24h × 10 columns = 240 cells),
// re-rendering every cell on each task update gets expensive. If your app
// passes stable `column` and `onCellPointerDown` references (`useMemo` /
// `useCallback`), wrap your cell render with `React.memo` in user-land to
// skip unchanged cell renders.

// ============================================================================
// CELLS (convenience iterator)
// ============================================================================

/** Props that `ShadulerCells` will spread onto every generated `ShadulerCell`. */
type ShadulerCellSharedProps = Omit<
  ShadulerCellProps,
  'hour' | 'column' | 'columnIndex' | 'hourIndex'
>

interface ShadulerCellsProps {
  children?: React.ReactNode
  /**
   * Row layout from `calculateShadulerData(...).rows`. Each row produces one
   * cell per column; partial rows render as shorter cells with the correct
   * `startMinuteOffset` / `durationMinutes` / height.
   *
   * For backward compatibility you may still pass `hours: number[]` instead
   * — full-hour rows will be derived. Prefer `rows` for new code.
   */
  rows?: ShadulerRowInfo[]
  /** Legacy: integer hours, treated as full 60-min rows. Use `rows` for partials. */
  hours?: number[]
  columns: ShadulerColumn[]
  hourHeight?: number
  /**
   * Props applied to every generated cell. Use this to wire up shared
   * `onCellPointerDown` (e.g. from `useShadulerRangeSelect().getCellProps()`)
   * or shared `className` without writing the iteration loop yourself.
   */
  cellProps?: ShadulerCellSharedProps
  /**
   * Per-cell escape hatch. Receives the cell's row info and returns extra
   * props to spread on that cell only. Runs after `cellProps` so it wins on
   * conflicting keys.
   */
  getCellPropsFor?: (info: {
    row: ShadulerRowInfo
    column: ShadulerColumn
    columnIndex: number
    rowIndex: number
  }) => ShadulerCellSharedProps | undefined
}

function ShadulerCells({
  children,
  rows,
  hours,
  columns,
  hourHeight = 60,
  cellProps,
  getCellPropsFor,
}: ShadulerCellsProps) {
  // Resolve to a `ShadulerRowInfo[]` whether the caller passed `rows` (new) or
  // `hours` (legacy). Memoize the legacy fallback to a stable shape.
  const resolvedRows: ShadulerRowInfo[] =
    rows ??
    (hours ?? []).map((hour, i) => ({
      startMinutes: hour * 60,
      durationMinutes: 60,
      hour,
      startMinuteOffset: 0,
      gridRow: i + 1,
      isPartial: false,
      showLabel: true,
    }))

  return (
    <>
      {children ??
        resolvedRows.flatMap((row, rowIndex) =>
          columns.map((column, columnIndex) => {
            const perCell = getCellPropsFor?.({
              row,
              column,
              columnIndex,
              rowIndex,
            })
            return (
              <ShadulerCell
                key={`${column.id}-${row.startMinutes}`}
                hour={row.hour}
                column={column}
                columnIndex={columnIndex}
                hourIndex={rowIndex}
                hourHeight={hourHeight}
                startMinuteOffset={row.startMinuteOffset}
                durationMinutes={row.durationMinutes}
                {...cellProps}
                {...perCell}
              />
            )
          }),
        )}
    </>
  )
}

// ============================================================================
// TASK
// ============================================================================

type ShadulerTaskProps = Omit<React.ComponentProps<'div'>, 'children'> &
  VariantProps<typeof shadulerTaskVariants> & {
    task: ShadulerTaskData
    position: TaskPosition
    columnIndex: number
    totalColumns: number
    children?: React.ReactNode
    /**
     * Pass a handler to enable resize. A small handle appears at the bottom
     * edge of the task; pressing it fires `onResizeStart`. Track pointermove
     * and pointerup at the document level in your handler.
     */
    onResizeStart?: (
      event: React.PointerEvent<HTMLDivElement>,
      task: ShadulerTaskData,
    ) => void
    /**
     * Pass a handler to enable drag-to-move. By default the entire task body
     * triggers drag; set `dragHandleOnly` to require an inner handle instead.
     */
    onTaskDragStart?: (
      event: React.PointerEvent<HTMLDivElement>,
      task: ShadulerTaskData,
    ) => void
    /** Suppress pointer events while another task is being dragged. */
    isDragging?: boolean
    /** Suppress pointer events while a range selection is in progress. */
    isSelecting?: boolean
    /**
     * On touch devices, prevents the body from triggering drag so the user
     * can still scroll the calendar. Drag must then be initiated from a
     * child element you mark with `data-shaduler-drag-handle`.
     */
    dragHandleOnly?: boolean
  }

function ShadulerTask({
  className,
  task,
  position,
  columnIndex,
  totalColumns,
  variant,
  children,
  onResizeStart,
  onTaskDragStart,
  isDragging = false,
  isSelecting = false,
  dragHandleOnly = false,
  role,
  tabIndex,
  'aria-label': ariaLabel,
  style,
  onClick,
  onPointerDown,
  onKeyDown,
  ...props
}: ShadulerTaskProps) {
  const groupCount = position.groupCount
  const groupIndex = position.groupIndex

  const columnLeft = (columnIndex / totalColumns) * 100
  const columnWidth = 100 / totalColumns

  let taskLeft = 0
  let taskWidth = 90
  if (groupCount > 1) {
    taskWidth = 90 / groupCount
    taskLeft = groupIndex * taskWidth
  }

  const left = columnLeft + (taskLeft * columnWidth) / 100
  const width = (taskWidth * columnWidth) / 100

  const useDragHandle = dragHandleOnly && Boolean(onTaskDragStart)
  const bodyTriggersDrag = !useDragHandle && Boolean(onTaskDragStart)

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.preventDefault()
    onResizeStart?.(e, task)
  }

  const handleBodyPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e)
    const target = e.target as HTMLElement
    if (target.closest('[data-shaduler-resize-handle]')) return
    if (!bodyTriggersDrag) return
    // Only stop propagation so the underlying cell's range-select doesn't
    // also start. We intentionally do NOT preventDefault — the browser will
    // suppress the native click itself if the pointer moves past its own
    // threshold during the gesture; for short presses, native click fires
    // and `onClick` works exactly as in display-only mode.
    e.stopPropagation()
    onTaskDragStart?.(e, task)
  }

  const isClickable = Boolean(onClick)
  const computedRole = role ?? (isClickable ? 'button' : undefined)
  const computedTabIndex =
    tabIndex ?? (isClickable ? 0 : undefined)
  const computedLabel =
    ariaLabel ?? `${task.name}, ${task.startTime} – ${task.endTime}`

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (!isClickable || e.defaultPrevented) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.(
        e as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>,
      )
    }
  }

  return (
    <div
      data-slot="shaduler-task"
      data-dragging={isDragging || undefined}
      data-selecting={isSelecting || undefined}
      role={computedRole}
      tabIndex={computedTabIndex}
      aria-label={computedLabel}
      className={cn(
        'absolute z-10 box-border flex select-none flex-col overflow-hidden',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        isDragging || isSelecting
          ? 'pointer-events-none'
          : 'pointer-events-auto',
        isDragging
          ? 'cursor-grabbing'
          : bodyTriggersDrag && !isSelecting
            ? 'cursor-grab'
            : isClickable
              ? 'cursor-pointer'
              : undefined,
        className,
      )}
      style={{
        left: `${left}%`,
        width: `${width}%`,
        top: position.top,
        height: position.height,
        touchAction: useDragHandle
          ? 'pan-y'
          : bodyTriggersDrag
            ? 'none'
            : undefined,
        ...style,
      }}
      onPointerDown={
        bodyTriggersDrag || onPointerDown ? handleBodyPointerDown : undefined
      }
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
      }}
      {...props}
    >
      {children ?? (
        <div className={cn(shadulerTaskVariants({ variant }))}>
          <span className="truncate font-medium">{task.name}</span>
        </div>
      )}
      {onResizeStart && (
        <div
          data-shaduler-resize-handle=""
          aria-hidden
          className="absolute inset-x-0 bottom-0 z-20 flex min-h-3 cursor-ns-resize touch-none flex-col items-stretch justify-center gap-0.5 rounded-b-md px-1 pb-0.5 pt-2 transition-colors hover:bg-foreground/10"
          onPointerDown={handleResizePointerDown}
        >
          <div className="h-px w-full bg-foreground/40" />
          <div className="h-px w-full bg-foreground/40" />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// TASKS OVERLAY
// ============================================================================

interface ShadulerTasksOverlayProps<
  T extends ShadulerTaskData = ShadulerTaskData,
> extends Omit<React.ComponentProps<'div'>, 'children'> {
  children?:
    | React.ReactNode
    | ((
        taskPositions: Record<string | number, TaskPosition<T>[]>,
        columns?: ShadulerColumn[],
      ) => React.ReactNode)
  taskPositions: Record<string | number, TaskPosition<T>[]>
  columns?: ShadulerColumn[]
  timeColumnWidth?: number
  hourHeight?: number
  startHour?: number
  endHour?: number
  /** Minute offset within `startHour`. Default 0. */
  startMinute?: number
  /** Minute offset within `endHour`. Default 0. */
  endMinute?: number
}

function ShadulerTasksOverlay<
  T extends ShadulerTaskData = ShadulerTaskData,
>({
  className,
  children,
  taskPositions,
  columns,
  timeColumnWidth = 96,
  hourHeight = 60,
  startHour = 0,
  endHour = 24,
  startMinute = 0,
  endMinute = 0,
  style,
  ...props
}: ShadulerTasksOverlayProps<T>) {
  const totalMinutes =
    endHour * 60 + endMinute - (startHour * 60 + startMinute)
  return (
    <div
      data-slot="shaduler-tasks-overlay"
      // Placed as a grid item spanning column 2 → end (skip the time column)
      // and all rows. Width comes from the grid's column tracks, so when the
      // grid overflows horizontally (e.g. 100 resources × 140px) the overlay
      // matches the full track width — not the visible viewport. `relative`
      // gives our absolutely-positioned task children a sized containing
      // block so percentage left/width map to the real grid extent.
      className={cn('pointer-events-none relative', className)}
      style={{
        gridColumn: '2 / -1',
        gridRow: '1 / -1',
        height: (totalMinutes / 60) * hourHeight,
        ...style,
      }}
      {...props}
    >
      {typeof children === 'function'
        ? children(taskPositions, columns)
        : (children ??
          columns?.map((column, colIndex) => {
            const positions = taskPositions[column.id] ?? []
            return positions.map((pos) => (
              <ShadulerTask
                key={pos.task.id}
                task={pos.task}
                position={pos}
                columnIndex={colIndex}
                totalColumns={columns.length}
              />
            ))
          }))}
    </div>
  )
}

// ============================================================================
// ALL-DAY STRIP — multi-day events that span columns
// ============================================================================
//
// All-day events live OUTSIDE the hourly grid. They render as horizontal bars
// inside `<ShadulerAllDayStrip>`, which sits between the columns header and
// the hourly grid. Tasks span from `startColumn` to `endColumn` (inclusive)
// and stack into lanes when they overlap. This is the same pattern Google
// Calendar / Outlook use for vacations, multi-day workshops, holidays, etc.
//
// The hourly grid (`ShadulerCell`, `ShadulerTask`, `ShadulerTasksOverlay`,
// `useShadulerTaskDrag`, etc.) is untouched — all-day is a separate primitive
// you opt into. Don't render the strip if your data has no all-day events.

/** Minimal shape of a multi-day "all-day" event. Extend for custom fields. */
export interface ShadulerAllDayTaskData {
  id: string | number
  name: string
  /** ID of the first column the task spans. Must match a `ShadulerColumn.id`. */
  startColumn: string | number
  /** ID of the last column the task spans (inclusive). Same as `startColumn` for a single-day task. */
  endColumn: string | number
}

/** Computed placement of one all-day task within the strip. */
export interface AllDayPosition<
  T extends ShadulerAllDayTaskData = ShadulerAllDayTaskData,
> {
  task: T
  /** 0-indexed lane (CSS grid row inside the strip). Tasks that overlap horizontally stack into separate lanes. */
  lane: number
  /** 0-indexed start column. */
  startColumnIndex: number
  /** 0-indexed end column (inclusive). */
  endColumnIndex: number
}

/**
 * Assigns each all-day task to a lane inside the strip. Tasks that don't
 * overlap horizontally share a lane (greedy fit); overlapping tasks stack.
 *
 * Tasks whose `startColumn` / `endColumn` don't resolve to a known column,
 * or whose start is after their end, are silently dropped.
 */
export const calculateAllDayPositions = <
  T extends ShadulerAllDayTaskData = ShadulerAllDayTaskData,
>(
  columns: ShadulerColumn[],
  tasks: T[],
): { positions: AllDayPosition<T>[]; laneCount: number } => {
  const indexById = new Map<string | number, number>(
    columns.map((c, i) => [c.id, i]),
  )

  const enriched = tasks
    .map((t) => ({
      task: t,
      startColumnIndex: indexById.get(t.startColumn) ?? -1,
      endColumnIndex: indexById.get(t.endColumn) ?? -1,
    }))
    .filter(
      (e) =>
        e.startColumnIndex >= 0 &&
        e.endColumnIndex >= 0 &&
        e.startColumnIndex <= e.endColumnIndex,
    )
    // Stable sort by start column. Ties keep input order so the user has
    // predictable control over which task lands on the lower lane (the one
    // declared first wins).
    .sort((a, b) => a.startColumnIndex - b.startColumnIndex)

  // Each lane tracks the rightmost column index it currently extends to.
  const lanes: number[] = []
  const positions: AllDayPosition<T>[] = []

  for (const e of enriched) {
    let laneIdx = lanes.findIndex((endIndex) => endIndex < e.startColumnIndex)
    if (laneIdx === -1) {
      laneIdx = lanes.length
      lanes.push(e.endColumnIndex)
    } else {
      lanes[laneIdx] = e.endColumnIndex
    }
    positions.push({
      task: e.task,
      lane: laneIdx,
      startColumnIndex: e.startColumnIndex,
      endColumnIndex: e.endColumnIndex,
    })
  }

  return { positions, laneCount: lanes.length }
}

interface ShadulerAllDayStripProps<
  T extends ShadulerAllDayTaskData = ShadulerAllDayTaskData,
> extends Omit<React.ComponentProps<'div'>, 'children'> {
  columns: ShadulerColumn[]
  tasks: T[]
  /** CSS grid template columns. Use `calculations.gridTemplateColumns` so the strip aligns with the hourly grid. */
  gridTemplateColumns: string
  /** Pixel height per lane. Default 28. */
  laneHeight?: number
  /**
   * Custom render. Receives positions + computed lane count. When omitted,
   * each task renders as a default `<ShadulerAllDayTask>` bar.
   */
  children?:
    | React.ReactNode
    | ((
        positions: AllDayPosition<T>[],
        laneCount: number,
      ) => React.ReactNode)
}

function ShadulerAllDayStrip<
  T extends ShadulerAllDayTaskData = ShadulerAllDayTaskData,
>({
  className,
  columns,
  tasks,
  gridTemplateColumns,
  laneHeight = 28,
  children,
  style,
  ...props
}: ShadulerAllDayStripProps<T>) {
  const { positions, laneCount } = React.useMemo(
    () => calculateAllDayPositions(columns, tasks),
    [columns, tasks],
  )
  // When there's nothing to show, render zero-height container so the
  // hourly grid sits flush against the columns header (no empty gap).
  const visibleLaneCount = Math.max(laneCount, 0)
  return (
    <div
      data-slot="shaduler-all-day-strip"
      className={cn(
        // Sits below the columns header, above the hourly grid. Not sticky
        // by default — keeps semantics simple and predictable.
        'grid w-full border-b bg-background',
        className,
      )}
      style={{
        gridTemplateColumns,
        gridTemplateRows:
          visibleLaneCount > 0
            ? `repeat(${visibleLaneCount}, ${laneHeight}px)`
            : '0px',
        boxSizing: 'border-box',
        ...style,
      }}
      {...props}
    >
      {/*
        Empty corner cell at gridColumn 1 keeps the strip aligned with the
        time column on the left. Sticky-left so it stays visible during
        horizontal scroll, matching the corner in the columns header.
      */}
      {visibleLaneCount > 0 && (
        <div
          aria-hidden
          data-slot="shaduler-all-day-corner"
          className="sticky left-0 z-10 border-r bg-background"
          style={{ gridColumn: 1, gridRow: `1 / ${visibleLaneCount + 1}` }}
        >
          <span className="block px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            All day
          </span>
        </div>
      )}
      {typeof children === 'function'
        ? children(positions, visibleLaneCount)
        : (children ??
          positions.map((pos) => (
            <ShadulerAllDayTask key={pos.task.id} position={pos} />
          )))}
    </div>
  )
}

interface ShadulerAllDayTaskProps<
  T extends ShadulerAllDayTaskData = ShadulerAllDayTaskData,
> extends Omit<React.ComponentProps<'div'>, 'children'> {
  position: AllDayPosition<T>
  children?: React.ReactNode
}

function ShadulerAllDayTask<
  T extends ShadulerAllDayTaskData = ShadulerAllDayTaskData,
>({
  className,
  position,
  children,
  style,
  onClick,
  ...props
}: ShadulerAllDayTaskProps<T>) {
  const isClickable = Boolean(onClick)
  // Grid placement: data columns start at track 2 (track 1 is the corner).
  // gridColumn end is exclusive in CSS Grid, so end = endColumnIndex + 3.
  const gridColumnStart = position.startColumnIndex + 2
  const gridColumnEnd = position.endColumnIndex + 3
  return (
    <div
      data-slot="shaduler-all-day-task"
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={position.task.name}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!isClickable) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(
            e as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>,
          )
        }
      }}
      className={cn(
        'relative mx-0.5 my-0.5 flex items-center overflow-hidden rounded-md border border-primary/20 bg-primary/10 px-2 text-xs font-medium text-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        isClickable && 'cursor-pointer',
        className,
      )}
      style={{
        gridColumn: `${gridColumnStart} / ${gridColumnEnd}`,
        gridRow: position.lane + 1,
        boxSizing: 'border-box',
        minWidth: 0,
        ...style,
      }}
      {...props}
    >
      {children ?? (
        <span className="truncate">{position.task.name}</span>
      )}
    </div>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
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
  shadulerTaskVariants,
  useShadulerTaskResize,
  useShadulerTaskDrag,
  useShadulerRangeSelect,
}
