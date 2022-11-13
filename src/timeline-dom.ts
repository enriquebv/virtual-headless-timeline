import type Timeline from './index'
import type { Item, Range } from './types'

import Hammer, { DIRECTION_HORIZONTAL } from 'hammerjs'

export interface TimelineDOMOptions {
  container: HTMLElement
  timelines: Timeline[]
  onRender(items: TimelineDOMItem[][]): void
  customResizeObserver?: any
}

export interface TimelineDOMItem {
  item: Item
  width: number
  startOffsetPx: number
}

export default class TimelineDOM {
  private container: HTMLElement
  private timelines: Timeline[]
  private renderCallback: (items: TimelineDOMItem[][]) => void
  private ResizeObserver: any
  private msPerPx: number | null = null
  private previousTimelineStartReference: number | null = null
  private isPaning: boolean = false

  constructor(options: TimelineDOMOptions) {
    this.container = options.container
    this.timelines = options.timelines
    this.renderCallback = options.onRender
    this.ResizeObserver = options.customResizeObserver ?? window.ResizeObserver

    this.setupPanEvents()
    this.setupResizeEvents()
    this.timelines.forEach((timeline) => timeline.calculate())
  }

  private setupPanEvents() {
    const hammer = new Hammer.Manager(this.container)
    const horizontalPan = new Hammer.Pan({ direction: DIRECTION_HORIZONTAL })

    hammer.add(horizontalPan)

    const handlers: Record<string, Function> = {
      panstart: this.onPanStart,
      panend: this.onPanEnd,
      panleft: this.onPan,
      panright: this.onPan,
    }

    hammer.on('panleft panright panstart panend', (e) => {
      const handler = handlers[e.type] as (pixelsMoved: number) => void
      // Note: Invert x delta value to match user gesture.
      const invertedDelta = e.deltaX > 0 ? -Math.abs(e.deltaX) : Math.abs(e.deltaX)

      handler.call(this, invertedDelta)
    })
  }

  setupResizeEvents() {
    const ResizeObserver = this.ResizeObserver as typeof window.ResizeObserver

    const resizeObserver = new ResizeObserver(([entry]) => {
      const isContainer = entry.target === this.container

      if (isContainer) {
        const currentWidth = entry.contentRect.width
        // Note: Timelines are sync in same DOM context, so we use first
        // to get milliseconds per pixel value
        const [firstTimeline] = this.timelines
        this.msPerPx = firstTimeline.timeWindowDuration / currentWidth

        this.emitRenderCallback()
      }
    })

    resizeObserver.observe(this.container)
  }

  private onPanStart() {
    this.isPaning = true
    const [firstTimeline] = this.timelines

    this.previousTimelineStartReference = firstTimeline.options.timeWindow.start
  }

  private onPan(pixelsMoved: number) {
    window.requestAnimationFrame(() => {
      if (!this.isPaning) return

      const { previousTimelineStartReference: timelineStartAtPanStart, msPerPx, timelines: timeline } = this
      const timelineDuration = timeline[0].timeWindowDuration

      const deltaMsFromStart = (msPerPx as number) * pixelsMoved

      const nextStart = (timelineStartAtPanStart as number) + deltaMsFromStart
      const nextEnd = nextStart + timelineDuration
      const nextTimeWindow: Range = { start: nextStart, end: nextEnd }

      for (const timeline of this.timelines) {
        timeline.setTimeWindow(nextTimeWindow)
      }

      this.emitRenderCallback()
    })
  }

  private onPanEnd() {
    this.isPaning = false
    this.previousTimelineStartReference = null
  }

  private emitRenderCallback() {
    const result: TimelineDOMItem[][] = []

    for (const timeline of this.timelines) {
      const timelineStart = timeline.options.timeWindow.start

      const timelineResult: TimelineDOMItem[] = []

      for (const itemInRange of timeline.getItemsInRange()) {
        const { itemReference, end, start } = itemInRange
        const duration = end - start
        const msFromTimelineStart = start - timelineStart
        const width = duration / (this.msPerPx as number)
        const startPxOffset = msFromTimelineStart / (this.msPerPx as number)

        timelineResult.push({
          width,
          item: itemReference,
          startOffsetPx: startPxOffset,
        })
      }

      result.push(timelineResult)
    }

    this.renderCallback(result)
  }

  getRangeTimestamps(scale: 'seconds' | 'minutes' | 'hours' | 'days' | 'months') {
    const timestamps = this.timelines[0].getRangeTimestamps(scale)

    const domRangeTimestamps = timestamps.map(({ timestamp, offsetStart }) => {
      const offsetFromLeft = offsetStart / (this.msPerPx || 0)
      return { timestamp, left: offsetFromLeft }
    })

    return domRangeTimestamps
  }

  static getTimelineStyle() {
    return {
      position: 'relative',
      overflow: 'hidden',
    }
  }

  static getItemStyleFromDomItem(item: TimelineDOMItem) {
    return {
      position: 'absolute',
      left: `${item.startOffsetPx}px`,
      width: `${item.width}px`,
    }
  }
}
