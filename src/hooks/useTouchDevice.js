import { useState, useEffect } from 'react'

export function useTouchDevice() {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    setIsTouch(hasTouch)
    if (hasTouch) {
      document.documentElement.classList.add('touch-device')
    }
    return () => {
      document.documentElement.classList.remove('touch-device')
    }
  }, [])

  return isTouch
}
