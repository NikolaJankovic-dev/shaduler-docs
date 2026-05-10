'use client'

import * as React from 'react'
import {
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Filter,
  Maximize2,
  Minimize2,
  Phone,
  Plus,
  Settings,
  Target,
  Trash2,
  Users,
  Utensils,
} from 'lucide-react'
import {
  Shaduler,
  ShadulerCell,
  ShadulerColumnHeader,
  ShadulerColumnsHeader,
  ShadulerContent,
  ShadulerCorner,
  ShadulerGrid,
  ShadulerTask,
  ShadulerTasksOverlay,
  ShadulerTimeColumn,
  ShadulerTimeSlot,
  calculateShadulerData,
  composeShadulerTaskProps,
  minutesToTime,
  timeToMinutes,
  useShadulerRangeSelect,
  useShadulerTaskDrag,
  useShadulerTaskResize,
  type ShadulerColumn,
  type ShadulerTaskData,
} from '@/components/ui/shaduler'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { TimePicker } from './time-picker'

// ---------------------------------------------------------------------------
// Theme-aware glass primitives — light theme uses translucent white over a
// warm pastel gradient, dark theme uses translucent white/slate over deep
// navy. Defined once so all popovers/dialogs/buttons share the same look.
// ---------------------------------------------------------------------------

const GLASS_PANEL =
  'border-black/10 bg-white/80 text-slate-900 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/20 dark:bg-slate-900/85 dark:text-white'

const GLASS_BUTTON =
  'border-black/15 bg-white/55 text-slate-900 backdrop-blur-sm hover:bg-white/75 hover:text-slate-900 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white'

const GLASS_INPUT =
  'border-black/15 bg-white/55 text-slate-900 placeholder:text-slate-400 backdrop-blur-sm dark:border-white/20 dark:bg-white/10 dark:text-white dark:placeholder:text-white/40'

const GLASS_GHOST =
  'text-slate-700 hover:bg-black/5 hover:text-slate-900 dark:text-white dark:hover:bg-white/15 dark:hover:text-white'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const START_HOUR = 0
const END_HOUR = 24
const HOUR_HEIGHT_PX = 60
const TIME_COLUMN_WIDTH_PX = 88
const TIME_INTERVAL_MIN = 15
const DEFAULT_TASK_DURATION_MIN = 60
const DEFAULT_WORK_START = 9
const DEFAULT_WORK_END = 17

type ViewMode = '1' | '3' | '7'

type Resource = { id: string; name: string }

const RESOURCES: Resource[] = [
  { id: 'anna', name: 'Anna' },
  { id: 'ben', name: 'Ben' },
  { id: 'clara', name: 'Clara' },
]

type TaskType = 'meeting' | 'call' | 'focus' | 'lunch' | 'break'

const TASK_TYPES: {
  id: TaskType
  label: string
  icon: React.ComponentType<{ className?: string }>
  /** Classic outlined card (used by other recipes). */
  className: string
  /** Glassmorphism card — premium look, white text on tinted blur. */
  glassClass: string
  dot: string
}[] = [
  {
    id: 'meeting',
    label: 'Meeting',
    icon: Users,
    className:
      'bg-blue-500/15 text-blue-700 border-blue-500/40 dark:text-blue-300',
    glassClass:
      'bg-blue-500/15 border-blue-500/50 text-blue-900 shadow-blue-500/20 dark:bg-blue-500/20 dark:border-blue-300/40 dark:text-blue-50 dark:shadow-blue-500/30',
    dot: 'bg-blue-500',
  },
  {
    id: 'call',
    label: 'Call',
    icon: Phone,
    className:
      'bg-emerald-500/15 text-emerald-700 border-emerald-500/40 dark:text-emerald-300',
    glassClass:
      'bg-emerald-500/15 border-emerald-500/50 text-emerald-900 shadow-emerald-500/20 dark:bg-emerald-500/20 dark:border-emerald-300/40 dark:text-emerald-50 dark:shadow-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  {
    id: 'focus',
    label: 'Focus',
    icon: Target,
    className:
      'bg-violet-500/15 text-violet-700 border-violet-500/40 dark:text-violet-300',
    glassClass:
      'bg-violet-500/15 border-violet-500/50 text-violet-900 shadow-violet-500/20 dark:bg-violet-500/20 dark:border-violet-300/40 dark:text-violet-50 dark:shadow-violet-500/30',
    dot: 'bg-violet-500',
  },
  {
    id: 'lunch',
    label: 'Lunch',
    icon: Utensils,
    className:
      'bg-amber-500/15 text-amber-700 border-amber-500/40 dark:text-amber-300',
    glassClass:
      'bg-amber-500/20 border-amber-500/50 text-amber-900 shadow-amber-500/20 dark:bg-amber-500/20 dark:border-amber-300/40 dark:text-amber-50 dark:shadow-amber-500/30',
    dot: 'bg-amber-500',
  },
  {
    id: 'break',
    label: 'Break',
    icon: Coffee,
    className:
      'bg-stone-500/15 text-stone-700 border-stone-500/40 dark:text-stone-300',
    glassClass:
      'bg-stone-500/15 border-stone-500/50 text-stone-900 shadow-stone-500/20 dark:bg-stone-400/25 dark:border-stone-300/40 dark:text-stone-50 dark:shadow-stone-500/30',
    dot: 'bg-stone-500',
  },
]

const TASK_TYPE_BY_ID: Record<TaskType, (typeof TASK_TYPES)[number]> =
  Object.fromEntries(TASK_TYPES.map((t) => [t.id, t])) as Record<
    TaskType,
    (typeof TASK_TYPES)[number]
  >

type DemoTask = ShadulerTaskData & {
  resourceId: string
  dateKey: string
  type: TaskType
}

type TaskDraft = {
  name: string
  dateKey: string
  resourceId: string
  startTime: string
  endTime: string
  type: TaskType
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fromKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatRangeLabel(dates: Date[]): string {
  if (dates.length === 1) return formatDateLabel(dates[0])
  const first = dates[0]
  const last = dates[dates.length - 1]
  return `${first.getDate()} – ${formatDateLabel(last)}`
}

function getDates(currentDate: Date, view: ViewMode): Date[] {
  const count = view === '1' ? 1 : view === '3' ? 3 : 7
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + i)
    return d
  })
}

function buildColumnId(dateKey: string, resourceId: string): string {
  return `${dateKey}::${resourceId}`
}

function parseColumnId(id: string | number): {
  dateKey: string
  resourceId: string
} {
  const [dateKey, resourceId] = String(id).split('::')
  return { dateKey, resourceId }
}

/** First task that overlaps the candidate's column + time range, or null. */
function detectOverlap(
  tasks: DemoTask[],
  candidate: {
    id?: string | number
    column: string | number
    startTime: string
    endTime: string
  },
): DemoTask | null {
  const cStart = timeToMinutes(candidate.startTime)
  const cEnd = timeToMinutes(candidate.endTime)
  return (
    tasks.find((t) => {
      if (candidate.id !== undefined && t.id === candidate.id) return false
      if (t.column !== candidate.column) return false
      const tStart = timeToMinutes(t.startTime)
      const tEnd = timeToMinutes(t.endTime)
      return cStart < tEnd && cEnd > tStart
    }) ?? null
  )
}

/** True when the task's [start, end) range falls (partly) outside [workStart, workEnd). */
function isOutsideWorkingHours(
  candidate: { startTime: string; endTime: string },
  workStart: number,
  workEnd: number,
): boolean {
  const start = timeToMinutes(candidate.startTime)
  const end = timeToMinutes(candidate.endTime)
  return start < workStart * 60 || end > workEnd * 60
}

// ---------------------------------------------------------------------------
// Initial data
// ---------------------------------------------------------------------------

const TODAY = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})()

const INITIAL_TASKS: DemoTask[] = (() => {
  const day0 = toKey(TODAY)
  const day1 = toKey(new Date(TODAY.getTime() + 86_400_000))
  const day2 = toKey(new Date(TODAY.getTime() + 2 * 86_400_000))
  return [
    {
      id: 'seed-1',
      dateKey: day0,
      resourceId: 'anna',
      column: buildColumnId(day0, 'anna'),
      name: 'Morning sync',
      startTime: '09:00',
      endTime: '10:00',
      type: 'meeting',
    },
    {
      id: 'seed-2',
      dateKey: day0,
      resourceId: 'ben',
      column: buildColumnId(day0, 'ben'),
      name: 'Customer call',
      startTime: '11:00',
      endTime: '12:00',
      type: 'call',
    },
    {
      id: 'seed-3',
      dateKey: day0,
      resourceId: 'clara',
      column: buildColumnId(day0, 'clara'),
      name: 'Deep work',
      startTime: '14:00',
      endTime: '17:00',
      type: 'focus',
    },
    {
      id: 'seed-4',
      dateKey: day1,
      resourceId: 'anna',
      column: buildColumnId(day1, 'anna'),
      name: 'Pair session',
      startTime: '10:00',
      endTime: '12:00',
      type: 'meeting',
    },
    {
      id: 'seed-4b',
      dateKey: day1,
      resourceId: 'ben',
      column: buildColumnId(day1, 'ben'),
      name: 'Lunch',
      startTime: '12:00',
      endTime: '13:00',
      type: 'lunch',
    },
    {
      id: 'seed-4c',
      dateKey: day1,
      resourceId: 'clara',
      column: buildColumnId(day1, 'clara'),
      name: 'Coffee chat',
      startTime: '15:00',
      endTime: '15:30',
      type: 'break',
    },
    {
      id: 'seed-5',
      dateKey: day2,
      resourceId: 'ben',
      column: buildColumnId(day2, 'ben'),
      name: 'Demo',
      startTime: '13:00',
      endTime: '14:30',
      type: 'meeting',
    },
  ]
})()

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DemoFullCustomization() {
  const [view, setView] = React.useState<ViewMode>('3')
  const [currentDate, setCurrentDate] = React.useState<Date>(TODAY)
  const [stackedHeaders, setStackedHeaders] = React.useState(true)
  const [tasks, setTasks] = React.useState<DemoTask[]>(INITIAL_TASKS)

  const [newTaskDraft, setNewTaskDraft] = React.useState<TaskDraft | null>(null)
  const [editingTask, setEditingTask] = React.useState<DemoTask | null>(null)
  const [warningPrompt, setWarningPrompt] = React.useState<{
    title: string
    description: string
    warnings: string[]
    confirmLabel: string
    cancelLabel: string
    onConfirm: () => void
    onCancel: () => void
  } | null>(null)
  const [fullscreen, setFullscreen] = React.useState(false)

  // Filters + working-hour settings
  const [visibleResources, setVisibleResources] = React.useState<Set<string>>(
    () => new Set(RESOURCES.map((r) => r.id)),
  )
  const [visibleTypes, setVisibleTypes] = React.useState<Set<TaskType>>(
    () => new Set(TASK_TYPES.map((t) => t.id)),
  )
  const [workStart, setWorkStart] = React.useState(DEFAULT_WORK_START)
  const [workEnd, setWorkEnd] = React.useState(DEFAULT_WORK_END)

  // Behavior settings
  const [autoSave, setAutoSave] = React.useState(false)
  const [allowOverlap, setAllowOverlap] = React.useState(false)
  const [allowOutsideHours, setAllowOutsideHours] = React.useState(false)
  const [snapMin, setSnapMin] = React.useState(15)

  // Refs for fresh values inside stable hook callbacks
  const tasksRef = React.useRef(tasks)
  React.useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])
  const settingsRef = React.useRef({
    autoSave,
    allowOverlap,
    allowOutsideHours,
    workStart,
    workEnd,
  })
  React.useEffect(() => {
    settingsRef.current = {
      autoSave,
      allowOverlap,
      allowOutsideHours,
      workStart,
      workEnd,
    }
  }, [autoSave, allowOverlap, allowOutsideHours, workStart, workEnd])

  // Snapshot of a task before drag/resize starts — used to revert on Cancel.
  const dragSnapshots = React.useRef<Map<string | number, DemoTask>>(new Map())

  // Esc key exits fullscreen.
  React.useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  const gridRef = React.useRef<HTMLDivElement>(null)
  const spotlightRef = React.useRef<HTMLDivElement>(null)

  // Spotlight follows the pointer over the shaduler shell.
  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = spotlightRef.current
      if (!el) return
      const rect = e.currentTarget.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
      el.style.setProperty('--my', `${e.clientY - rect.top}px`)
      el.style.opacity = '1'
    },
    [],
  )
  const handleMouseLeave = React.useCallback(() => {
    const el = spotlightRef.current
    if (el) el.style.opacity = '0'
  }, [])

  // Land on the working-hour window on mount instead of 00:00.
  React.useLayoutEffect(() => {
    const content = gridRef.current?.closest(
      '[data-slot="shaduler-content"]',
    )
    if (content instanceof HTMLElement) {
      content.scrollTop = Math.max(0, workStart * HOUR_HEIGHT_PX - 24)
    }
    // intentionally run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dates = React.useMemo(
    () => getDates(currentDate, view),
    [currentDate, view],
  )

  const visibleResourceList = React.useMemo(
    () => RESOURCES.filter((r) => visibleResources.has(r.id)),
    [visibleResources],
  )

  const columns: ShadulerColumn[] = React.useMemo(
    () =>
      dates.flatMap((d) =>
        visibleResourceList.map((r) => ({
          id: buildColumnId(toKey(d), r.id),
          label: r.name,
        })),
      ),
    [dates, visibleResourceList],
  )

  const visibleTasks = React.useMemo(() => {
    const keys = new Set(dates.map(toKey))
    return tasks.filter(
      (t) =>
        keys.has(t.dateKey) &&
        visibleResources.has(t.resourceId) &&
        visibleTypes.has(t.type),
    )
  }, [tasks, dates, visibleResources, visibleTypes])

  const calc = React.useMemo(
    () =>
      calculateShadulerData<DemoTask>(
        columns,
        visibleTasks,
        START_HOUR,
        END_HOUR,
        HOUR_HEIGHT_PX,
        { timeColumnWidth: TIME_COLUMN_WIDTH_PX },
      ),
    [columns, visibleTasks],
  )

  // ---- mutations ---------------------------------------------------------

  const updateTask = (
    id: string | number,
    patch: Partial<ShadulerTaskData>,
  ) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const next: DemoTask = { ...t, ...patch }
        // If column changed, derive new dateKey + resourceId.
        if (patch.column && patch.column !== t.column) {
          const { dateKey, resourceId } = parseColumnId(patch.column)
          next.dateKey = dateKey
          next.resourceId = resourceId
        }
        return next
      }),
    )
  }

  const collectWarnings = (
    candidate: {
      id?: string | number
      column: string | number
      startTime: string
      endTime: string
    },
  ): string[] => {
    const { allowOverlap, allowOutsideHours, workStart, workEnd } =
      settingsRef.current
    const out: string[] = []
    if (!allowOverlap) {
      const conflict = detectOverlap(tasksRef.current, candidate)
      if (conflict) {
        out.push(
          `Conflicts with "${conflict.name}" (${conflict.startTime} – ${conflict.endTime}).`,
        )
      }
    }
    if (!allowOutsideHours) {
      if (isOutsideWorkingHours(candidate, workStart, workEnd)) {
        out.push(
          `Time falls outside working hours (${String(workStart).padStart(2, '0')}:00 – ${String(workEnd).padStart(2, '0')}:00).`,
        )
      }
    }
    return out
  }

  const commitNewTask = (draft: TaskDraft) => {
    const task: DemoTask = {
      id: `task-${Date.now()}`,
      name: draft.name.trim() || 'New event',
      dateKey: draft.dateKey,
      resourceId: draft.resourceId,
      column: buildColumnId(draft.dateKey, draft.resourceId),
      startTime: draft.startTime,
      endTime: draft.endTime,
      type: draft.type,
    }
    const insert = () => {
      setTasks((prev) => [...prev, task])
      setNewTaskDraft(null)
      setWarningPrompt(null)
    }
    const warnings = collectWarnings(task)
    if (warnings.length > 0) {
      setWarningPrompt({
        title: 'Save with warnings?',
        description: 'The event has the following issue(s):',
        warnings,
        confirmLabel: 'Save anyway',
        cancelLabel: 'Cancel',
        onConfirm: insert,
        onCancel: () => setWarningPrompt(null),
      })
      return
    }
    insert()
  }

  const commitEdit = (id: string | number, draft: TaskDraft) => {
    const candidate = {
      id,
      column: buildColumnId(draft.dateKey, draft.resourceId),
      startTime: draft.startTime,
      endTime: draft.endTime,
    }
    const apply = () => {
      updateTask(id, {
        name: draft.name.trim() || 'Event',
        column: candidate.column,
        startTime: draft.startTime,
        endTime: draft.endTime,
        type: draft.type,
      } as Partial<DemoTask>)
      setEditingTask(null)
      setWarningPrompt(null)
    }
    const warnings = collectWarnings(candidate)
    if (warnings.length > 0) {
      setWarningPrompt({
        title: 'Save with warnings?',
        description: 'The event has the following issue(s):',
        warnings,
        confirmLabel: 'Save anyway',
        cancelLabel: 'Cancel',
        onConfirm: apply,
        onCancel: () => setWarningPrompt(null),
      })
      return
    }
    apply()
  }

  /** Called from drag/resize end. Compares current state to snapshot
   *  and either auto-saves or prompts the user to confirm/revert.
   *
   *  - `autoSave` ON  + no warnings → silent keep
   *  - `autoSave` ON  + warnings    → still prompt (warnings always surface
   *                                   unless the matching "allow X" toggle
   *                                   is on, which already short-circuits
   *                                   them inside `collectWarnings`)
   *  - `autoSave` OFF + no warnings → prompt "Keep / Revert"
   *  - `autoSave` OFF + warnings    → prompt with warning list */
  const finalizeDragResize = (id: string | number) => {
    const snapshot = dragSnapshots.current.get(id)
    dragSnapshots.current.delete(id)
    if (!snapshot) return

    const current = tasksRef.current.find((t) => t.id === id)
    if (!current) return
    const unchanged =
      current.startTime === snapshot.startTime &&
      current.endTime === snapshot.endTime &&
      current.column === snapshot.column
    if (unchanged) return

    const warnings = collectWarnings({
      id,
      column: current.column,
      startTime: current.startTime,
      endTime: current.endTime,
    })

    // autoSave bypasses the dialog only when there's nothing to warn about.
    if (settingsRef.current.autoSave && warnings.length === 0) return

    setWarningPrompt({
      title:
        warnings.length > 0 ? 'Keep with warnings?' : 'Keep new position?',
      description:
        warnings.length > 0
          ? 'There are issues with the new placement:'
          : 'Confirm the new position or revert to where it was.',
      warnings,
      confirmLabel: 'Keep',
      cancelLabel: 'Revert',
      onConfirm: () => setWarningPrompt(null),
      onCancel: () => {
        updateTask(id, {
          startTime: snapshot.startTime,
          endTime: snapshot.endTime,
          column: snapshot.column,
        })
        setWarningPrompt(null)
      },
    })
  }

  /** First call during a drag/resize for this task — store its current shape. */
  const recordSnapshot = (id: string | number) => {
    if (dragSnapshots.current.has(id)) return
    const orig = tasksRef.current.find((t) => t.id === id)
    if (orig) dragSnapshots.current.set(id, { ...orig })
  }

  const deleteTask = (id: string | number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setEditingTask(null)
  }

  // ---- hooks (drag, resize, range-select) --------------------------------

  const { getResizeProps } = useShadulerTaskResize({
    hourHeight: HOUR_HEIGHT_PX,
    timeInterval: snapMin,
    startHour: START_HOUR,
    endHour: END_HOUR,
    onResize: (id, patch) => {
      recordSnapshot(id)
      updateTask(id, patch)
    },
    onResizeEnd: (id, patch) => {
      updateTask(id, patch)
      finalizeDragResize(id)
    },
  })

  const { getTaskDragProps } = useShadulerTaskDrag({
    gridRef,
    columns,
    hourHeight: HOUR_HEIGHT_PX,
    timeInterval: snapMin,
    startHour: START_HOUR,
    endHour: END_HOUR,
    onDrag: (id, patch) => {
      recordSnapshot(id)
      updateTask(id, patch)
    },
    onDragEnd: (id, patch) => {
      updateTask(id, patch)
      finalizeDragResize(id)
    },
  })

  const { activeRange, isSelecting, getCellProps } = useShadulerRangeSelect({
    gridRef,
    hourHeight: HOUR_HEIGHT_PX,
    timeInterval: snapMin,
    startHour: START_HOUR,
    endHour: END_HOUR,
    onSelect: (range) => {
      const { dateKey, resourceId } = parseColumnId(range.columnId)
      setNewTaskDraft({
        name: '',
        dateKey,
        resourceId,
        startTime: minutesToTime(range.startMinutes),
        endTime: minutesToTime(range.endMinutes),
        type: 'meeting',
      })
    },
  })

  // ---- navigation --------------------------------------------------------

  const shiftDate = (dir: -1 | 1) => {
    const step = view === '1' ? 1 : view === '3' ? 3 : 7
    const next = new Date(currentDate)
    next.setDate(next.getDate() + dir * step)
    setCurrentDate(next)
  }

  // ---- column header rendering ------------------------------------------

  const headerRows = stackedHeaders ? 2 : 1

  const renderHeaders = () => {
    if (!stackedHeaders) {
      // Single row with combined "Day · Resource" labels.
      return columns.map((column, i) => {
        const { dateKey, resourceId } = parseColumnId(column.id)
        const date = fromKey(dateKey)
        const isFirstOfDay = i % visibleResourceList.length === 0
        return (
          <ShadulerColumnHeader
            key={column.id}
            column={column}
            columnIndex={i}
            className={cn(
              'flex-col items-center justify-center gap-0.5 text-xs text-slate-800 dark:text-white/85',
              isFirstOfDay &&
                view !== '1' &&
                'border-l-2 border-l-black/15 dark:border-l-white/20',
            )}
          >
            {view !== '1' && (
              <span className="text-[10px] font-normal text-slate-500 dark:text-white/55">
                {date.toLocaleDateString(undefined, {
                  weekday: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
            <span>
              {RESOURCES.find((r) => r.id === resourceId)?.name ?? column.label}
            </span>
          </ShadulerColumnHeader>
        )
      })
    }
    // Stacked: row 1 = days, row 2 = resources.
    return (
      <>
        {dates.map((date, dayIdx) => (
          <div
            key={`day-${toKey(date)}`}
            className="flex items-center justify-center border-b border-r border-black/10 px-2 py-1 text-xs font-semibold text-slate-800 dark:border-white/10 dark:text-white/90"
            style={{
              gridColumn: `${dayIdx * visibleResourceList.length + 2} / span ${visibleResourceList.length}`,
              gridRow: 1,
            }}
          >
            {date.toLocaleDateString(undefined, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          </div>
        ))}
        {columns.map((column, i) => (
          <ShadulerColumnHeader
            key={column.id}
            column={column}
            columnIndex={i}
            className="text-xs font-medium text-slate-700 dark:text-white/80"
            style={{ gridRow: 2 }}
          />
        ))}
      </>
    )
  }

  // ---- render ------------------------------------------------------------

  return (
    <div
      className={cn(
        fullscreen && 'fixed inset-0 z-60 flex flex-col bg-background p-4',
      )}
    >
      <div
        className={cn(
          'relative isolate flex flex-col overflow-hidden rounded-lg',
          fullscreen ? 'min-h-0 flex-1' : 'h-[600px]',
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Theme-aware gradient base — fresh sky/blue in light, deep navy in dark. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-sky-100 to-cyan-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
        />
        {/* Subtle dot pattern overlay — dark dots on light, light dots on dark. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-40 [background-image:radial-gradient(rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-25 dark:[background-image:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)]"
        />
        {/* Pointer-following spotlight — indigo/violet glow that works on both themes. */}
        <div
          ref={spotlightRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(139,92,246,0.18), rgba(244,114,182,0.10) 35%, transparent 70%)',
          }}
        />

      <div className="relative z-50 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-black/10 bg-white/40 px-4 py-3 text-slate-900 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-white">
        {/* Left — filters */}
        <div className="flex items-center gap-2 justify-self-start">
          <FilterPopover
            icon={Filter}
            label="Resources"
            activeCount={visibleResources.size}
            totalCount={RESOURCES.length}
            options={RESOURCES.map((r) => ({ id: r.id, label: r.name }))}
            selectedIds={visibleResources}
            onToggle={(id) =>
              setVisibleResources((prev) => {
                const next = new Set(prev)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next.size === 0 ? prev : next
              })
            }
          />
          <FilterPopover
            icon={Filter}
            label="Types"
            activeCount={visibleTypes.size}
            totalCount={TASK_TYPES.length}
            options={TASK_TYPES.map((t) => ({
              id: t.id,
              label: t.label,
              dot: t.dot,
            }))}
            selectedIds={visibleTypes}
            onToggle={(id) =>
              setVisibleTypes((prev) => {
                const next = new Set(prev) as Set<TaskType>
                const typed = id as TaskType
                if (next.has(typed)) next.delete(typed)
                else next.add(typed)
                return next.size === 0 ? prev : next
              })
            }
          />
        </div>

        {/* Middle — date navigation */}
        <div className="flex items-center gap-1 justify-self-center">
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-8 px-2', GLASS_GHOST)}
            onClick={() => shiftDate(-1)}
            aria-label="Previous"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn('h-8 gap-2 text-xs', GLASS_BUTTON)}
              >
                <CalendarIcon className="size-3.5" />
                {formatRangeLabel(dates)}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className={cn('w-fit p-3', GLASS_PANEL)}
              align="center"
            >
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(d) => d && setCurrentDate(d)}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-8 px-2', GLASS_GHOST)}
            onClick={() => shiftDate(1)}
            aria-label="Next"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-8 text-xs', GLASS_GHOST)}
            onClick={() => setCurrentDate(TODAY)}
          >
            Today
          </Button>
        </div>

        {/* Right — fullscreen button + settings smooth dropdown */}
        <div className="flex items-center gap-2 justify-self-end">
          <Button
            variant="outline"
            size="sm"
            className={cn('h-8 px-2', GLASS_BUTTON)}
            onClick={() => setFullscreen((f) => !f)}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn('size-8 p-0', GLASS_BUTTON)}
                aria-label="Settings"
              >
                <Settings className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              className={cn('w-64 p-3', GLASS_PANEL)}
            >
              <div className="flex flex-col gap-3">
                {/* View */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-white/60">
                    View
                  </span>
                  <ToggleGroup
                    type="single"
                    value={view}
                    onValueChange={(v) => v && setView(v as ViewMode)}
                    size="sm"
                    className="w-full gap-2"
                  >
                    {(['1', '3', '7'] as const).map((v) => (
                      <ToggleGroupItem
                        key={v}
                        value={v}
                        className={cn(
                          'h-8 flex-1 rounded-md border text-xs backdrop-blur-sm',
                          'border-black/15 bg-white/55 text-slate-900 hover:bg-white/75 hover:text-slate-900',
                          'data-[state=on]:border-slate-900/40 data-[state=on]:bg-slate-900 data-[state=on]:text-white',
                          'dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white',
                          'dark:data-[state=on]:border-white/40 dark:data-[state=on]:bg-white/25 dark:data-[state=on]:text-white',
                        )}
                      >
                        {v} {v === '1' ? 'day' : 'days'}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <Separator />

                {/* Working hours */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-white/60">
                    Working hours
                  </span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(workStart)}
                      onValueChange={(v) => {
                        const n = Number(v)
                        if (n < workEnd) setWorkStart(n)
                      }}
                    >
                      <SelectTrigger className={cn('h-8 flex-1 text-xs', GLASS_BUTTON)}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={cn('max-h-56', GLASS_PANEL)}>
                        {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                          <SelectItem
                            key={h}
                            value={String(h)}
                            disabled={h >= workEnd}
                          >
                            {String(h).padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-slate-500 dark:text-white/50">–</span>
                    <Select
                      value={String(workEnd)}
                      onValueChange={(v) => {
                        const n = Number(v)
                        if (n > workStart) setWorkEnd(n)
                      }}
                    >
                      <SelectTrigger className={cn('h-8 flex-1 text-xs', GLASS_BUTTON)}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={cn('max-h-56', GLASS_PANEL)}>
                        {Array.from({ length: 24 }, (_, i) => i + 1).map(
                          (h) => (
                            <SelectItem
                              key={h}
                              value={String(h)}
                              disabled={h <= workStart}
                            >
                              {String(h).padStart(2, '0')}:00
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Snap interval */}
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs font-normal text-slate-700 dark:text-white/70">
                    Snap interval
                  </Label>
                  <Select
                    value={String(snapMin)}
                    onValueChange={(v) => setSnapMin(Number(v))}
                  >
                    <SelectTrigger className={cn('h-8 w-[90px] text-xs', GLASS_BUTTON)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={cn('max-h-56', GLASS_PANEL)}>
                      {[5, 10, 15, 30, 60].map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {m} min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Toggles */}
                <div className="flex flex-col gap-3">
                  <ToggleRow
                    id="settings-stacked"
                    label="Stacked headers"
                    checked={stackedHeaders}
                    onCheckedChange={setStackedHeaders}
                  />
                  <ToggleRow
                    id="settings-auto-save"
                    label="Auto-save drag & resize"
                    checked={autoSave}
                    onCheckedChange={setAutoSave}
                  />
                  <ToggleRow
                    id="settings-allow-overlap"
                    label="Allow overlapping tasks"
                    checked={allowOverlap}
                    onCheckedChange={setAllowOverlap}
                  />
                  <ToggleRow
                    id="settings-allow-outside"
                    label="Allow outside working hours"
                    checked={allowOutsideHours}
                    onCheckedChange={setAllowOutsideHours}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <Shaduler className="border-0 bg-transparent text-slate-900 dark:text-white">
          <ShadulerContent>
            <ShadulerColumnsHeader
            gridTemplateColumns={calc.gridTemplateColumns}
            className="bg-white/30 backdrop-blur-md [&>*]:border-black/10 dark:bg-white/5 dark:[&>*]:border-white/10"
            style={
              stackedHeaders ? { gridTemplateRows: 'auto auto' } : undefined
            }
          >
            <ShadulerCorner
              style={
                stackedHeaders
                  ? { gridRow: `1 / ${headerRows + 1}` }
                  : undefined
              }
              className="flex items-center justify-center border-black/10 bg-transparent p-0 dark:border-white/10"
            >
              <Button
                size="sm"
                className="size-8 border border-black/15 bg-white/55 p-0 text-slate-900 backdrop-blur-md shadow-lg shadow-black/10 hover:bg-white/75 hover:text-slate-900 dark:border-white/20 dark:bg-white/10 dark:text-white dark:shadow-black/40 dark:hover:bg-white/20 dark:hover:text-white"
                aria-label="Add event"
                onClick={() => {
                  const firstDate = dates[0]
                  setNewTaskDraft({
                    name: '',
                    dateKey: toKey(firstDate),
                    resourceId: RESOURCES[0].id,
                    startTime: `${String(workStart).padStart(2, '0')}:00`,
                    endTime: minutesToTime(
                      workStart * 60 + DEFAULT_TASK_DURATION_MIN,
                    ),
                    type: 'meeting',
                  })
                }}
              >
                <Plus className="size-4" />
              </Button>
            </ShadulerCorner>
            {renderHeaders()}
          </ShadulerColumnsHeader>
          <ShadulerGrid
            ref={gridRef}
            gridTemplateColumns={calc.gridTemplateColumns}
            gridTemplateRows={calc.gridTemplateRows}
          >
            <ShadulerTimeColumn
              rows={calc.rows}
              className="bg-white/30 text-slate-700 backdrop-blur-md dark:bg-white/5 dark:text-white/80"
            >
              {calc.rows.map((row, i) => {
                const isOpen = row.hour === workStart
                const isClose = row.hour === workEnd
                return (
                  <ShadulerTimeSlot
                    key={row.startMinutes}
                    hour={row.hour}
                    durationMinutes={row.durationMinutes}
                    hourIndex={i}
                    hourHeight={HOUR_HEIGHT_PX}
                  >
                    {isOpen || isClose ? (
                      <span
                        className={cn(
                          'absolute left-1/2 -top-3 flex -translate-x-1/2 items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold tabular-nums shadow-lg ring-1',
                          isOpen
                            ? 'bg-emerald-500/15 text-emerald-900 ring-emerald-500/50 dark:bg-emerald-500/30 dark:text-emerald-100 dark:ring-emerald-300/40'
                            : 'bg-rose-500/15 text-rose-900 ring-rose-500/50 dark:bg-rose-500/30 dark:text-rose-100 dark:ring-rose-300/40',
                        )}
                      >
                        {String(row.hour).padStart(2, '0')}:00
                        <span className="uppercase tracking-wide opacity-80">
                          {isOpen ? 'Open' : 'Close'}
                        </span>
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'absolute left-1/2 -translate-x-1/2 rounded-sm bg-white/40 px-2 text-xs text-slate-700 backdrop-blur-sm dark:bg-white/10 dark:text-white/70 sm:text-sm',
                          i === 0 ? 'top-2' : '-top-3',
                        )}
                      >
                        {String(row.hour).padStart(2, '0')}:00
                      </span>
                    )}
                  </ShadulerTimeSlot>
                )
              })}
            </ShadulerTimeColumn>
            {calc.hours.flatMap((hour, hourIndex) =>
              columns.map((column, colIndex) => {
                const isNonWorking = hour < workStart || hour >= workEnd
                return (
                  <ShadulerCell
                    key={`${column.id}-${hour}`}
                    hour={hour}
                    column={column}
                    columnIndex={colIndex}
                    hourIndex={hourIndex}
                    hourHeight={HOUR_HEIGHT_PX}
                    timeInterval={snapMin}
                    className={cn(
                      'border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5',
                      isNonWorking &&
                        'bg-[repeating-linear-gradient(135deg,rgba(0,0,0,0.04)_0_6px,transparent_6px_12px)] hover:bg-black/[0.07] dark:bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.04)_0_6px,transparent_6px_12px)] dark:hover:bg-white/[0.07]',
                    )}
                    {...getCellProps()}
                  />
                )
              }),
            )}
            <ShadulerTasksOverlay
              taskPositions={calc.taskPositions}
              columns={columns}
              startHour={START_HOUR}
              endHour={END_HOUR}
              hourHeight={HOUR_HEIGHT_PX}
              timeColumnWidth={TIME_COLUMN_WIDTH_PX}
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
                      const cfg = TASK_TYPE_BY_ID[pos.task.type]
                      const Icon = cfg.icon
                      return (
                        <ShadulerTask
                          key={pos.task.id}
                          task={pos.task}
                          position={pos}
                          columnIndex={colIndex}
                          totalColumns={(cols ?? []).length}
                          {...props}
                          onClick={() => setEditingTask(pos.task)}
                          className="bg-transparent p-0 transition-transform duration-150 hover:z-20 hover:scale-[1.02]"
                        >
                          <div
                            className={cn(
                              'group/task flex h-full w-full flex-col gap-0.5 overflow-hidden rounded-lg border px-2 py-1.5 backdrop-blur-md shadow-lg transition-shadow duration-200 hover:shadow-xl',
                              cfg.glassClass,
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <Icon className="size-3 shrink-0 drop-shadow" />
                              <span className="truncate text-xs font-semibold drop-shadow">
                                {pos.task.name}
                              </span>
                            </div>
                            <span className="text-[10px] tabular-nums opacity-80">
                              {pos.task.startTime} – {pos.task.endTime}
                            </span>
                          </div>
                        </ShadulerTask>
                      )
                    })
                  })}
                  {activeRange && (
                    <RangeMarker
                      range={activeRange}
                      columns={columns}
                      hourHeight={HOUR_HEIGHT_PX}
                      startHour={START_HOUR}
                    />
                  )}
                </>
              )}
            </ShadulerTasksOverlay>
          </ShadulerGrid>
          </ShadulerContent>
        </Shaduler>
      </div>
      </div>

      <TaskDialog
        open={newTaskDraft !== null}
        title="New event"
        draft={newTaskDraft}
        dates={dates}
        onClose={() => setNewTaskDraft(null)}
        onSubmit={(draft) => commitNewTask(draft)}
      />

      <TaskDialog
        open={editingTask !== null}
        title="Edit event"
        draft={
          editingTask
            ? {
                name: editingTask.name,
                dateKey: editingTask.dateKey,
                resourceId: editingTask.resourceId,
                startTime: editingTask.startTime,
                endTime: editingTask.endTime,
                type: editingTask.type,
              }
            : null
        }
        dates={dates}
        onClose={() => setEditingTask(null)}
        onSubmit={(draft) => {
          if (editingTask) commitEdit(editingTask.id, draft)
        }}
        onDelete={
          editingTask ? () => deleteTask(editingTask.id) : undefined
        }
      />

      <AlertDialog
        open={warningPrompt !== null}
        onOpenChange={(o) => {
          // Esc / outside-click → just dismiss the dialog without taking
          // either action. Explicit Keep/Revert buttons handle commit/revert
          // themselves. (Auto-cancelling here caused stale-closure double
          // calls that reverted on Keep clicks.)
          if (!o) setWarningPrompt(null)
        }}
      >
        <AlertDialogContent className={GLASS_PANEL}>
          <AlertDialogHeader>
            <AlertDialogTitle>{warningPrompt?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {warningPrompt?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {warningPrompt && warningPrompt.warnings.length > 0 && (
            <ul className="ml-4 list-disc space-y-1 text-sm text-slate-700 dark:text-white/70">
              {warningPrompt.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => warningPrompt?.onCancel()}
              className={GLASS_BUTTON}
            >
              {warningPrompt?.cancelLabel ?? 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => warningPrompt?.onConfirm()}
              className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-white/90"
            >
              {warningPrompt?.confirmLabel ?? 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dialog used for both create + edit (delete is only shown when editing)
// ---------------------------------------------------------------------------

function TaskDialog({
  open,
  title,
  draft,
  dates,
  onClose,
  onSubmit,
  onDelete,
}: {
  open: boolean
  title: string
  draft: TaskDraft | null
  dates: Date[]
  onClose: () => void
  onSubmit: (draft: TaskDraft) => void
  onDelete?: () => void
}) {
  const [local, setLocal] = React.useState<TaskDraft | null>(null)
  React.useEffect(() => {
    if (open) setLocal(draft)
  }, [open, draft])
  if (!local) return null

  const dateOptions = dates.map((d) => ({
    key: toKey(d),
    label: formatDateLabel(d),
  }))

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn('max-w-md', GLASS_PANEL)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Pick a resource and time. We'll warn you if the slot is already
            booked.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="task-name" className="text-xs">
                Name
              </Label>
              <Input
                id="task-name"
                value={local.name}
                onChange={(e) =>
                  setLocal({ ...local, name: e.target.value })
                }
                className={cn('h-8 text-xs', GLASS_INPUT)}
                autoFocus
                placeholder="e.g. Customer call"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Type</Label>
              <Select
                value={local.type}
                onValueChange={(v) =>
                  setLocal({ ...local, type: v as TaskType })
                }
              >
                <SelectTrigger className={cn('h-8 w-[130px] text-xs', GLASS_BUTTON)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn('max-h-56', GLASS_PANEL)}>
                  {TASK_TYPES.map((t) => {
                    const Icon = t.icon
                    return (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="flex items-center gap-2">
                          <Icon className="size-3.5" />
                          {t.label}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Date</Label>
              <Select
                value={local.dateKey}
                onValueChange={(v) => setLocal({ ...local, dateKey: v })}
              >
                <SelectTrigger className={cn('h-8 text-xs', GLASS_BUTTON)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn('max-h-56', GLASS_PANEL)}>
                  {dateOptions.map((d) => (
                    <SelectItem key={d.key} value={d.key}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Resource</Label>
              <Select
                value={local.resourceId}
                onValueChange={(v) => setLocal({ ...local, resourceId: v })}
              >
                <SelectTrigger className={cn('h-8 text-xs', GLASS_BUTTON)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn('max-h-56', GLASS_PANEL)}>
                  {RESOURCES.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Start</Label>
              <TimePicker
                value={local.startTime}
                onChange={(t) => setLocal({ ...local, startTime: t })}
                className={GLASS_BUTTON}
                contentClassName={GLASS_PANEL}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">End</Label>
              <TimePicker
                value={local.endTime}
                onChange={(t) => setLocal({ ...local, endTime: t })}
                className={GLASS_BUTTON}
                contentClassName={GLASS_PANEL}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          {onDelete ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-rose-500/40 bg-rose-500/10 text-xs text-rose-700 backdrop-blur-sm hover:bg-rose-500/20 hover:text-rose-800 dark:text-rose-100 dark:hover:bg-rose-500/25 dark:hover:text-rose-50"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn('h-8 text-xs', GLASS_BUTTON)}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 bg-slate-900 text-xs text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-white/90"
              onClick={() => onSubmit(local)}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Settings toggle row — label + switch on the right.
// ---------------------------------------------------------------------------

function ToggleRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <Label
        htmlFor={id}
        className="cursor-pointer text-xs font-normal text-slate-700 dark:text-white/70"
      >
        {label}
      </Label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="h-4 w-7 data-[state=unchecked]:bg-black/15 dark:data-[state=unchecked]:bg-white/20 [&>span]:size-3 [&>span]:data-[state=checked]:translate-x-3"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter popover (resources, task types) — checkbox-style list, always
// requires at least one option selected.
// ---------------------------------------------------------------------------

function FilterPopover({
  icon: Icon,
  label,
  options,
  selectedIds,
  activeCount,
  totalCount,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  options: { id: string; label: string; dot?: string }[]
  selectedIds: Set<string>
  activeCount: number
  totalCount: number
  onToggle: (id: string) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-8 gap-1.5 text-xs', GLASS_BUTTON)}
        >
          <Icon className="size-3.5" />
          {label}
          <span className="rounded bg-black/10 px-1.5 text-[10px] font-semibold text-slate-700 dark:bg-white/15 dark:text-white/85">
            {activeCount}/{totalCount}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('w-48 p-1', GLASS_PANEL)}
        align="start"
      >
        <div className="flex flex-col">
          {options.map((opt) => {
            const active = selectedIds.has(opt.id)
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onToggle(opt.id)}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition hover:bg-black/5 dark:hover:bg-white/10"
              >
                {opt.dot && (
                  <span
                    className={cn('size-2 shrink-0 rounded-full', opt.dot)}
                  />
                )}
                <span className="flex-1">{opt.label}</span>
                {active && <Check className="size-4" />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// Working-hours popover — two number selects for start / end.
// ---------------------------------------------------------------------------

function HoursPopover({
  workStart,
  workEnd,
  onChange,
}: {
  workStart: number
  workEnd: number
  onChange: (start: number, end: number) => void
}) {
  const [s, setS] = React.useState(workStart)
  const [e, setE] = React.useState(workEnd)
  React.useEffect(() => {
    setS(workStart)
    setE(workEnd)
  }, [workStart, workEnd])
  const hours = Array.from({ length: 25 }, (_, i) => i)
  const valid = e > s
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <Clock className="size-3.5" />
          {String(workStart).padStart(2, '0')}:00 –{' '}
          {String(workEnd).padStart(2, '0')}:00
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="flex flex-col gap-2">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Working hours
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(s)}
              onValueChange={(v) => setS(Number(v))}
            >
              <SelectTrigger className="h-8 flex-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={cn('max-h-56', GLASS_PANEL)}>
                {hours.slice(0, 24).map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {String(h).padStart(2, '0')}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">–</span>
            <Select
              value={String(e)}
              onValueChange={(v) => setE(Number(v))}
            >
              <SelectTrigger className="h-8 flex-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={cn('max-h-56', GLASS_PANEL)}>
                {hours.slice(1).map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {String(h).padStart(2, '0')}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={!valid}
            onClick={() => onChange(s, e)}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// Visual marker rendered while the user is dragging across cells.
// ---------------------------------------------------------------------------

function RangeMarker({
  range,
  columns,
  hourHeight,
  startHour,
}: {
  range: {
    columnId: string | number
    startMinutes: number
    endMinutes: number
  }
  columns: ShadulerColumn[]
  hourHeight: number
  startHour: number
}) {
  const colIndex = columns.findIndex((c) => c.id === range.columnId)
  if (colIndex === -1) return null
  const top = ((range.startMinutes - startHour * 60) / 60) * hourHeight
  const height = ((range.endMinutes - range.startMinutes) / 60) * hourHeight
  const colWidthPercent = 100 / columns.length
  return (
    <div
      data-slot="full-customization-range"
      className="pointer-events-none absolute z-20 rounded-md border-2 border-primary bg-primary/15"
      style={{
        left: `${colIndex * colWidthPercent}%`,
        width: `${colWidthPercent}%`,
        top,
        height,
        boxSizing: 'border-box',
      }}
    >
      <span className="absolute left-1 top-1 text-xs font-medium text-primary">
        {minutesToTime(range.startMinutes)} → {minutesToTime(range.endMinutes)}
      </span>
    </div>
  )
}
