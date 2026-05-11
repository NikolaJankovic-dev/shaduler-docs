'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
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
  type ShadulerColumn,
  type ShadulerTaskData,
} from '@/components/ui/shaduler'
import { cn } from '@/lib/utils'

/**
 * Hero demo for the marketing landing page. Choreographs an animated loop —
 * empty grid → tasks fade in (scaleX from left) → some change status / move
 * columns → some exit → back to empty. The intent is to read as a short
 * video, not a static screenshot of the component.
 *
 * Kept self-contained (own column/task/status enums, own colours) so the
 * Quick taste demo and the recipe pages stay untouched.
 */

const START_HOUR = 9
const END_HOUR = 14
const HOUR_HEIGHT = 72

const COLUMNS: ShadulerColumn[] = [
  { id: 'a', label: 'Anna' },
  { id: 'b', label: 'Ben' },
  { id: 'c', label: 'Clara' },
]

type Status = 'scheduled' | 'in_progress' | 'done' | 'urgent'

type HeroTask = ShadulerTaskData & {
  status: Status
  person: string
}

/**
 * Colour tokens per status. Border / bg / text trios all swap together on
 * status change, with a 500-ms colour transition so the shift reads like an
 * update, not a re-render.
 */
const STATUS_TOKENS: Record<
  Status,
  { card: string; dot: string; label: string }
> = {
  scheduled: {
    card: 'bg-blue-50/90 border-blue-200/70 text-blue-900 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-100',
    dot: 'bg-blue-500',
    label: 'Scheduled',
  },
  in_progress: {
    card: 'bg-amber-50/90 border-amber-200/70 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-100',
    dot: 'bg-amber-500',
    label: 'In progress',
  },
  done: {
    card: 'bg-emerald-50/90 border-emerald-200/70 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-100',
    dot: 'bg-emerald-500',
    label: 'Done',
  },
  urgent: {
    card: 'bg-rose-50/90 border-rose-200/70 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-100',
    dot: 'bg-rose-500',
    label: 'Urgent',
  },
}

/**
 * Choreographed sequence of grid states. Each frame holds for `FRAME_MS`
 * before the loop advances; on the last frame we wrap back to 0. The script
 * is deliberately one-change-per-step (enter, status flip, slide, exit) so
 * the user's eye always has a single moving target — reads less like a
 * busy dashboard and more like a narrated reel.
 *
 * Task `id` is stable across frames where the same task should animate in
 * place (status, slide) rather than re-mount.
 */
const FRAME_MS = 2500

// Stable task seeds — change a field across frames by spreading + overriding.
const STANDUP: HeroTask = {
  id: 'standup',
  column: 'a',
  name: 'Daily standup',
  startTime: '09:00',
  endTime: '10:00',
  person: 'AN',
  status: 'scheduled',
}
const DESIGN: HeroTask = {
  id: 'design',
  column: 'b',
  name: 'Design review',
  startTime: '09:30',
  endTime: '11:00',
  person: 'BE',
  status: 'scheduled',
}
const FOCUS: HeroTask = {
  id: 'focus',
  column: 'c',
  name: 'Focus block',
  startTime: '10:00',
  endTime: '12:30',
  person: 'CL',
  status: 'scheduled',
}
const DEMO: HeroTask = {
  id: 'demo',
  column: 'b',
  name: 'Demo prep',
  startTime: '12:30',
  endTime: '13:30',
  person: 'BE',
  status: 'urgent',
}

const STORY: HeroTask[][] = [
  // 0 — empty (anchor; long-ish hold so the loop has a breath at the top)
  [],
  // 1 — enter: standup
  [STANDUP],
  // 2 — enter: design
  [STANDUP, DESIGN],
  // 3 — status: standup → in_progress
  [{ ...STANDUP, status: 'in_progress' }, DESIGN],
  // 4 — enter: focus
  [{ ...STANDUP, status: 'in_progress' }, DESIGN, FOCUS],
  // 5 — status: standup → done
  [{ ...STANDUP, status: 'done' }, DESIGN, FOCUS],
  // 6 — exit: standup
  [DESIGN, FOCUS],
  // 7 — status: design → in_progress
  [{ ...DESIGN, status: 'in_progress' }, FOCUS],
  // 8 — slide: focus moves down (10:00–12:30 → 11:30–14:00, ~1.5h shift)
  [
    { ...DESIGN, status: 'in_progress' },
    { ...FOCUS, startTime: '11:30', endTime: '14:00' },
  ],
  // 9 — status: focus → urgent
  [
    { ...DESIGN, status: 'in_progress' },
    { ...FOCUS, startTime: '11:30', endTime: '14:00', status: 'urgent' },
  ],
  // 10 — slide: focus moves back up (11:30–14:00 → 10:00–12:30)
  [
    { ...DESIGN, status: 'in_progress' },
    { ...FOCUS, status: 'urgent' },
  ],
  // 11 — status: design → done
  [{ ...DESIGN, status: 'done' }, { ...FOCUS, status: 'urgent' }],
  // 12 — exit: design
  [{ ...FOCUS, status: 'urgent' }],
  // 13 — enter: demo
  [{ ...FOCUS, status: 'urgent' }, DEMO],
  // 14 — exit: focus
  [DEMO],
  // 15 — exit: demo (back to empty for the loop)
  [],
]

export function LandingHeroDemo() {
  const [frame, setFrame] = React.useState(0)
  React.useEffect(() => {
    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % STORY.length)
    }, FRAME_MS)
    return () => window.clearInterval(id)
  }, [])

  const tasks = STORY[frame]
  const calc = React.useMemo(
    () =>
      calculateShadulerData<HeroTask>(
        COLUMNS,
        tasks,
        START_HOUR,
        END_HOUR,
        HOUR_HEIGHT,
      ),
    [tasks],
  )

  return (
    <div className="h-[440px]">
      <Shaduler className="h-full">
        <ShadulerContent>
          <ShadulerColumnsHeader gridTemplateColumns={calc.gridTemplateColumns}>
            <ShadulerCorner />
            {COLUMNS.map((c, i) => (
              <ShadulerColumnHeader
                key={c.id}
                column={c}
                columnIndex={i}
                className="py-4 text-sm font-semibold"
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
              hourHeight={HOUR_HEIGHT}
            />
            <ShadulerCells
              rows={calc.rows}
              columns={COLUMNS}
              hourHeight={HOUR_HEIGHT}
            />
            <ShadulerTasksOverlay
              taskPositions={calc.taskPositions}
              columns={COLUMNS}
              startHour={START_HOUR}
              endHour={END_HOUR}
              hourHeight={HOUR_HEIGHT}
            >
              {(positions, cols) => (
                <AnimatePresence>
                  {(cols ?? []).flatMap((column, colIndex) => {
                    const total = (cols ?? []).length
                    const list = positions[column.id] ?? []
                    return list.map((pos) => (
                      <FancyTaskCard
                        key={pos.task.id}
                        task={pos.task}
                        top={pos.top}
                        height={pos.height}
                        colIndex={colIndex}
                        totalCols={total}
                      />
                    ))
                  })}
                </AnimatePresence>
              )}
            </ShadulerTasksOverlay>
          </ShadulerGrid>
        </ShadulerContent>
      </Shaduler>
    </div>
  )
}

interface FancyTaskCardProps {
  task: HeroTask
  top: number
  height: number
  colIndex: number
  totalCols: number
}

function FancyTaskCard({
  task,
  top,
  height,
  colIndex,
  totalCols,
}: FancyTaskCardProps) {
  // Replicates ShadulerTask's positioning math (90% of column width, anchored
  // to the column's left edge) without going through ShadulerTask itself —
  // that way `motion.div` can own enter / exit / layout transitions.
  const left = (colIndex / totalCols) * 100
  const width = 90 / totalCols
  const tokens = STATUS_TOKENS[task.status]
  return (
    <motion.div
      // `top` / `height` in initial = their target values so a fresh mount
      // doesn't slide down from 0; only scaleX (left → right reveal) and
      // opacity animate on entry. Subsequent renders animate `top`/`height`
      // because the values in `animate` change frame to frame.
      initial={{ scaleX: 0, opacity: 0, top, height }}
      animate={{ scaleX: 1, opacity: 1, top, height }}
      exit={{ scaleX: 0, opacity: 0 }}
      transition={{
        // Slow + soft so the user reads each enter / exit on its own beat.
        scaleX: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.5 },
        // Slides — motion drives `top` / `height` directly because
        // motion.div takes over inline `style` and tends to swallow any
        // CSS transition we set there for those properties.
        top: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
        height: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
      }}
      style={{
        position: 'absolute',
        left: `${left}%`,
        width: `${width}%`,
        transformOrigin: 'left center',
        // Colour transitions stay on CSS — motion doesn't touch them, so
        // listing only the colour properties here is safe.
        transition: [
          'background-color 0.7s ease-in-out',
          'border-color 0.7s ease-in-out',
          'color 0.7s ease-in-out',
        ].join(', '),
      }}
      className={cn(
        'flex flex-col justify-between overflow-hidden rounded-lg border px-3 py-2 shadow-sm',
        tokens.card,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-xs font-semibold leading-tight">
          {task.name}
        </span>
        <span
          aria-hidden
          className={cn('mt-1 size-1.5 shrink-0 rounded-full', tokens.dot)}
        />
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-wide opacity-70">
            {tokens.label}
          </span>
          <span className="text-[11px] tabular-nums opacity-90">
            {task.startTime} – {task.endTime}
          </span>
        </div>
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold tracking-tight">
          {task.person}
        </span>
      </div>
    </motion.div>
  )
}
