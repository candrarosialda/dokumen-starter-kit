import {
  useEffect,
} from 'react'

import {
  useJobStore,
} from '../../store/useJobStore'

export function JobEventBridge() {
  useEffect(() => {
    const unsubscribe =
      window
        .desktopAPI
        .jobs
        .onEvent(
          (event) => {
            useJobStore
              .getState()
              .applyEvent(
                event,
              )
          },
        )

    return unsubscribe
  }, [])

  return null
}