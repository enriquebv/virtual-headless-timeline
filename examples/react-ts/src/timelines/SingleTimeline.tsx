import { Timeline } from '@eon-timeline/core'
import { EonTimeline } from '@eon-timeline/react'
import { useEffect, useState } from 'react'
import makeRandomItemCollection from '../../../utils'
import { ExampleProps, RANGES_PER_UNIT } from './shared'

const items = makeRandomItemCollection({
  gapRangeInMinutes: {
    min: 1,
    max: 5,
  },
  durationRangeInMinutes: {
    min: 5,
    max: 10,
  },
})

const timeline = new Timeline({ items })

export default function SingleTimeline(props: ExampleProps) {
  const [range, setRange] = useState(RANGES_PER_UNIT[props.rangeUnit])

  useEffect(() => setRange(RANGES_PER_UNIT[props.rangeUnit]), [props.rangeUnit])

  return <EonTimeline range={range} timelines={[timeline]} onRangeChange={setRange} />
}
