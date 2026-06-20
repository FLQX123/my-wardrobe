import { useRef, useCallback } from 'react'

export function useLongPress(onLongPress, delay = 500) {
  const timerRef = useRef(null)
  const isLongRef = useRef(false)
  const startPosRef = useRef(null)

  const start = useCallback((e) => {
    isLongRef.current = false
    const touch = e.touches ? e.touches[0] : null
    startPosRef.current = touch ? { x: touch.clientX, y: touch.clientY } : { x: e.clientX, y: e.clientY }
    timerRef.current = setTimeout(() => {
      isLongRef.current = true
      if (onLongPress) onLongPress(e)
    }, delay)
  }, [onLongPress, delay])

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    startPosRef.current = null
  }, [])

  const move = useCallback((e) => {
    if (!startPosRef.current) return
    const touch = e.touches ? e.touches[0] : null
    const cx = touch ? touch.clientX : e.clientX
    const cy = touch ? touch.clientY : e.clientY
    const dx = cx - startPosRef.current.x
    const dy = cy - startPosRef.current.y
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      cancel()
    }
  }, [cancel])

  const wasLongPress = useCallback(() => isLongRef.current, [])

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: move,
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseMove: move,
    onMouseLeave: cancel,
    wasLongPress,
  }
}
