import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom doesn't always have PointerEvent — polyfill from MouseEvent so our
// hook tests can dispatch pointermove / pointerup at the document level.
if (typeof window !== 'undefined' && !('PointerEvent' in window)) {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number
    pointerType: string
    constructor(type: string, init?: PointerEventInit) {
      super(type, init)
      this.pointerId = init?.pointerId ?? 1
      this.pointerType = init?.pointerType ?? 'mouse'
    }
  }
  // @ts-expect-error: assigning polyfill onto Window
  window.PointerEvent = PointerEventPolyfill
}

afterEach(() => {
  cleanup()
})
