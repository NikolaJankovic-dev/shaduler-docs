import { describe, it, expect, vi } from 'vitest'
import {
  composeShadulerTaskProps,
  type ShadulerTaskData,
} from '@/components/ui/shaduler'

const dummyTask: ShadulerTaskData = {
  id: 1,
  column: 'a',
  name: 'X',
  startTime: '09:00',
  endTime: '10:00',
}

describe('composeShadulerTaskProps', () => {
  it('returns an empty object when no sources are provided', () => {
    expect(composeShadulerTaskProps()).toEqual({})
  })

  it('ignores falsy sources (false / null / undefined)', () => {
    const props = composeShadulerTaskProps(false, null, undefined)
    expect(props).toEqual({})
  })

  it('first defined onResizeStart wins', () => {
    const a = vi.fn()
    const b = vi.fn()
    const props = composeShadulerTaskProps(
      { onResizeStart: a },
      { onResizeStart: b },
    )
    expect(props.onResizeStart).toBe(a)
  })

  it('first defined onTaskDragStart wins', () => {
    const a = vi.fn()
    const b = vi.fn()
    const props = composeShadulerTaskProps(
      { onTaskDragStart: a },
      { onTaskDragStart: b },
    )
    expect(props.onTaskDragStart).toBe(a)
  })

  it('still picks up a handler from a later source if earlier sources lack it', () => {
    const drag = vi.fn()
    const resize = vi.fn()
    const props = composeShadulerTaskProps(
      { onTaskDragStart: drag },
      { onResizeStart: resize },
    )
    expect(props.onTaskDragStart).toBe(drag)
    expect(props.onResizeStart).toBe(resize)
  })

  it('ORs isDragging across sources', () => {
    expect(
      composeShadulerTaskProps({ isDragging: false }, { isDragging: true })
        .isDragging,
    ).toBe(true)
    expect(
      composeShadulerTaskProps({ isDragging: false }, { isDragging: false })
        .isDragging,
    ).toBeUndefined()
  })

  it('ORs isSelecting across sources', () => {
    expect(
      composeShadulerTaskProps({ isSelecting: true }, { isSelecting: false })
        .isSelecting,
    ).toBe(true)
  })

  it('skips falsy sources between defined ones', () => {
    const handler = vi.fn()
    const props = composeShadulerTaskProps(
      false,
      { onResizeStart: handler },
      null,
      { isSelecting: true },
    )
    expect(props.onResizeStart).toBe(handler)
    expect(props.isSelecting).toBe(true)
  })

  it('preserves handler signature when called', () => {
    const handler = vi.fn()
    const props = composeShadulerTaskProps({ onResizeStart: handler })
    const event = new MouseEvent('pointerdown') as unknown as React.PointerEvent<HTMLDivElement>
    props.onResizeStart!(event, dummyTask)
    expect(handler).toHaveBeenCalledWith(event, dummyTask)
  })
})
