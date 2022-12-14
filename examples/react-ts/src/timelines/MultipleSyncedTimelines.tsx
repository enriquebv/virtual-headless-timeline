import { Timeline } from '@eon-timeline/core'
import { EonTimeline } from '@eon-timeline/react'
import { useEffect, useState } from 'react'
import makeRandomOcurrenceCollection from '../../../utils'
import { ExampleProps, RANGES_PER_UNIT } from './shared'

function makeOcurrencesCollection() {
  return makeRandomOcurrenceCollection({
    gapRangeInMinutes: {
      min: 1,
      max: 5,
    },
    durationRangeInMinutes: {
      min: 5,
      max: 10,
    },
  })
}

const timelines = [
  new Timeline({ ocurrences: makeOcurrencesCollection() }),
  new Timeline({ ocurrences: makeOcurrencesCollection() }),
  new Timeline({ ocurrences: makeOcurrencesCollection() }),
  new Timeline({ ocurrences: makeOcurrencesCollection() }),
  new Timeline({ ocurrences: makeOcurrencesCollection() }),
]

export default function MultipleSyncedTimelines(props: ExampleProps) {
  const [range, setRange] = useState(RANGES_PER_UNIT[props.rangeUnit])

  useEffect(() => setRange(RANGES_PER_UNIT[props.rangeUnit]), [props.rangeUnit])

  return <EonTimeline range={range} timelines={timelines} onRangeChange={setRange} />
}
