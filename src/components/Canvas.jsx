import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Rnd } from 'react-rnd'
import { useTouchDevice } from '../hooks/useTouchDevice'

export default function Canvas({
  selectedClothes, onRemoveCloth, onBatchRemove, onSaveOutfit,
  canvasRef, selectedIds, onToggleSelect, onMultiSelect, onBatchSelect,
  onClothPositionChange, onBatchPositionChange, onClearCanvas,
  onUndo, onRedo, canUndo, canRedo, isPortrait = false, hideBottomToolbar = false
}) {

  const [selectionBox, setSelectionBox] = useState(null)
  const selectStartRef = useRef(null)
  const isSelectingRef = useRef(false)
  const selectionBoxRef = useRef(null)
  const containerRef = useRef(null)

  const batchDragRef = useRef(null)
  const [leaderDraggingId, setLeaderDraggingId] = useState(null)
  const isTouchDevice = useTouchDevice()
  const [doubleTapId, setDoubleTapId] = useState(null)
  const lastTapRef = useRef(null) // { instanceId, time } for double-tap detection via dragStop

  // Calculate min canvas height to contain all items + buffer
  const canvasMinHeight = useMemo(() => {
    if (selectedClothes.length === 0) return 0
    let maxBottom = 0
    selectedClothes.forEach(c => {
      const y = c.y !== undefined ? c.y : 150
      const h = c.height !== undefined ? c.height : 260
      maxBottom = Math.max(maxBottom, y + h)
    })
    return Math.max(0, maxBottom + 400) // 400px buffer below items
  }, [selectedClothes])

  const getCoords = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return null
    if (e.touches) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const beginSelection = useCallback((coords) => {
    if (!coords) return
    selectStartRef.current = coords
    isSelectingRef.current = true
    const box = { x: coords.x, y: coords.y, w: 0, h: 0 }
    selectionBoxRef.current = box
    setSelectionBox(box)
  }, [])

  const updateSelection = useCallback((e) => {
    if (!isSelectingRef.current || !selectStartRef.current) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    let cx, cy
    if (e.touches) {
      cx = e.touches[0].clientX - rect.left
      cy = e.touches[0].clientY - rect.top
    } else {
      cx = e.clientX - rect.left
      cy = e.clientY - rect.top
    }
    const start = selectStartRef.current
    const box = { x: Math.min(start.x, cx), y: Math.min(start.y, cy), w: Math.abs(cx - start.x), h: Math.abs(cy - start.y) }
    selectionBoxRef.current = box
    setSelectionBox(box)
  }, [])

  const endSelection = useCallback(() => {
    if (!isSelectingRef.current) return
    isSelectingRef.current = false
    const container = containerRef.current
    if (!container) { setSelectionBox(null); selectStartRef.current = null; return }
    const box = selectionBoxRef.current
    if (box && box.w > 5 && box.h > 5) {
      const items = container.querySelectorAll('.rnd-item')
      const containerRect = container.getBoundingClientRect()
      const selectedIdsArr = []
      items.forEach(el => {
        const rect = el.getBoundingClientRect()
        const itemX = rect.left - containerRect.left
        const itemY = rect.top - containerRect.top
        const itemW = rect.width
        const itemH = rect.height
        if (!(itemX + itemW < box.x || itemX > box.x + box.w || itemY + itemH < box.y || itemY > box.y + box.h)) {
          const instanceId = el.getAttribute('data-instance-id')
          if (instanceId) selectedIdsArr.push(instanceId)
        }
      })
      if (selectedIdsArr.length > 0) onBatchSelect(selectedIdsArr)
    }
    setSelectionBox(null)
    selectStartRef.current = null
  }, [onBatchSelect])

  const handleCanvasPointerDown = useCallback((e) => {
    // Skip right-click
    if (e.button && e.button !== 0) return
    // Skip if touching multiple fingers (pinch/zoom)
    if (e.touches && e.touches.length > 1) return
    const target = e.target
    if (target.closest('.rnd-item') || target.closest('button') || target.closest('img')) return

    e.preventDefault()
    onToggleSelect(null)
    const coords = getCoords(e)
    beginSelection(coords)
  }, [onToggleSelect, getCoords, beginSelection])

  useEffect(() => {
    const handleMouseMove = (e) => updateSelection(e)
    const handleMouseUp = () => endSelection()
    const handleTouchMove = (e) => {
      if (e.touches.length > 1) { isSelectingRef.current = false; setSelectionBox(null); return }
      updateSelection(e)
    }
    const handleTouchEnd = () => endSelection()

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [updateSelection, endSelection])

  const handleBringToFront = useCallback((e) => {
    e.stopPropagation()
    if (selectedIds.length === 0) return
    onSaveOutfit(selectedClothes, 'bringToFront', selectedIds)
  }, [selectedClothes, selectedIds, onSaveOutfit])

  const handleSendToBack = useCallback((e) => {
    e.stopPropagation()
    if (selectedIds.length === 0) return
    onSaveOutfit(selectedClothes, 'sendToBack', selectedIds)
  }, [selectedClothes, selectedIds, onSaveOutfit])

  const handleCanvasClick = useCallback((e) => {
    const target = e.target
    if (target.closest('.rnd-item') || target.closest('button') || target.closest('img')) return
    onToggleSelect(null)
  }, [onToggleSelect])

  const handleBatchDragStart = useCallback((instanceId, e) => {
    e.stopPropagation()
    if (selectedIds.length > 1 && selectedIds.includes(instanceId)) {
      const initialPositions = {}
      selectedIds.forEach(id => {
        const cloth = selectedClothes.find(c => c.instanceId === id)
        if (cloth) initialPositions[id] = { x: cloth.x !== undefined ? cloth.x : 150, y: cloth.y !== undefined ? cloth.y : 150 }
      })
      batchDragRef.current = { initialPositions, leaderId: instanceId }
      setLeaderDraggingId(instanceId)
      return
    }
    if (!selectedIds.includes(instanceId)) onToggleSelect(instanceId)
  }, [selectedIds, selectedClothes, onToggleSelect, onSaveOutfit])

  const handleBatchDrag = useCallback((instanceId, e, d) => {
    if (!batchDragRef.current) return
    const { initialPositions, leaderId } = batchDragRef.current
    const leaderInitial = initialPositions[leaderId]
    if (!leaderInitial) return
    const dx = d.x - leaderInitial.x
    const dy = d.y - leaderInitial.y
    batchDragRef.current = { ...batchDragRef.current, currentDx: dx, currentDy: dy }
  }, [])

  const handleBatchDragStop = useCallback((instanceId, e, d) => {
    if (selectedIds.length > 1 && batchDragRef.current) {
      const { initialPositions, leaderId, currentDx = 0, currentDy = 0 } = batchDragRef.current
      const updates = selectedIds.map(id => {
        const cloth = selectedClothes.find(c => c.instanceId === id)
        if (!cloth) return null
        if (id === leaderId) return { instanceId: id, x: d.x, y: d.y }
        return { instanceId: id, x: (cloth.x !== undefined ? cloth.x : 150) + currentDx, y: (cloth.y !== undefined ? cloth.y : 150) + currentDy }
      }).filter(Boolean)
      onBatchPositionChange(updates); batchDragRef.current = null; setLeaderDraggingId(null)
      return
    }

    // Single item: always save position
    if (onClothPositionChange) onClothPositionChange(instanceId, { x: d.x, y: d.y })

    // Double-tap detection via dragStop (works through Rnd's touch handling on iOS)
    const cloth = selectedClothes.find(c => c.instanceId === instanceId)
    const origX = cloth?.x !== undefined ? cloth.x : 150
    const origY = cloth?.y !== undefined ? cloth.y : 150
    const dist = Math.sqrt((d.x - origX) ** 2 + (d.y - origY) ** 2)

    if (dist < 8) {
      // Finger barely moved → treat as a tap
      const now = Date.now()
      if (lastTapRef.current &&
          lastTapRef.current.instanceId === instanceId &&
          (now - lastTapRef.current.time) < 350) {
        // Double tap detected → delete
        lastTapRef.current = null
        setDoubleTapId(instanceId)
        setTimeout(() => setDoubleTapId(null), 400)
        onRemoveCloth(instanceId)
        return
      }
      lastTapRef.current = { instanceId, time: now }
    }
  }, [selectedIds, selectedClothes, onBatchPositionChange, onClothPositionChange, onRemoveCloth])

  const handleResizeStop = useCallback((instanceId, e, direction, ref, delta, position) => {
    if (selectedIds.length > 1 && selectedIds.includes(instanceId)) {
      const scale = delta.width / ref.offsetWidth
      const updates = selectedIds.map(id => {
        const cloth = selectedClothes.find(c => c.instanceId === id)
        if (!cloth) return null
        if (id === instanceId) return { instanceId: id, x: position.x, y: position.y, width: ref.offsetWidth, height: ref.offsetHeight }
        const cw = cloth.width !== undefined ? cloth.width : 150
        const ch = cloth.height !== undefined ? cloth.height : 200
        return { instanceId: id, x: cloth.x !== undefined ? cloth.x : 150, y: cloth.y !== undefined ? cloth.y : 150, width: Math.max(50, cw * scale), height: Math.max(50, ch * scale) }
      }).filter(Boolean)
      onBatchPositionChange(updates)
      return
    }
    if (onClothPositionChange) onClothPositionChange(instanceId, { x: position.x, y: position.y, width: ref.offsetWidth, height: ref.offsetHeight })
  }, [selectedIds, selectedClothes, onBatchPositionChange, onClothPositionChange])

  const handleZoom = useCallback((instanceId, factor) => {
    const cloth = selectedClothes.find(c => c.instanceId === instanceId)
    if (!cloth) return
    const currW = cloth.width !== undefined ? cloth.width : 220
    const currH = cloth.height !== undefined ? cloth.height : 260
    const maxW = isPortrait ? 350 : 500
    const maxH = isPortrait ? 420 : 600
    const newW = Math.max(50, Math.min(maxW, Math.round(currW * factor)))
    const newH = Math.max(50, Math.min(maxH, Math.round(currH * factor)))
    const cx = (cloth.x !== undefined ? cloth.x : 150) + currW / 2
    const cy = (cloth.y !== undefined ? cloth.y : 150) + currH / 2
    onClothPositionChange(instanceId, { x: cx - newW / 2, y: cy - newH / 2, width: newW, height: newH })
  }, [selectedClothes, isPortrait, onClothPositionChange])

  const touchResizeStyles = {
    bottomLeft: { width: 32, height: 32, touchAction: 'none' },
    bottomRight: { width: 32, height: 32, touchAction: 'none' },
    topLeft: { width: 32, height: 32, touchAction: 'none' },
    topRight: { width: 32, height: 32, touchAction: 'none' },
  }

  const handleClass = 'react-rnd-handle'

  return (
    <div className="h-full flex flex-col glass-card gallery-shadow rounded-3xl mx-2 mt-2 overflow-hidden">
      <div ref={containerRef} className="flex-1 relative overflow-auto dotted-grid select-none"
        onMouseDown={handleCanvasPointerDown} onTouchStart={handleCanvasPointerDown} onClick={handleCanvasClick}>
        <div ref={canvasRef} className="relative w-full" style={{ minHeight: canvasMinHeight || undefined, touchAction: 'manipulation' }}>
          {selectedClothes.length > 0 && selectedClothes.map((cloth, index) => {
              const isSelected = selectedIds.includes(cloth.instanceId)
              const batchDrag = batchDragRef.current
              let dx = 0, dy = 0
              if (batchDrag && isSelected && cloth.instanceId !== batchDrag.leaderId) {
                dx = batchDrag.currentDx || 0; dy = batchDrag.currentDy || 0
              }
              return (
                <Rnd key={cloth.instanceId}
                  position={{ x: ((cloth.x !== undefined ? cloth.x : 150 + (index * 60))) + dx, y: ((cloth.y !== undefined ? cloth.y : 150 + (index * 40))) + dy }}
                  size={{ width: cloth.width !== undefined ? cloth.width : 220, height: cloth.height !== undefined ? cloth.height : 260 }}
                  minWidth={50} minHeight={50} maxWidth={isPortrait ? 350 : 500} maxHeight={isPortrait ? 420 : 600} bounds="parent"
                  className={`rnd-item ${isSelected ? 'selected ring-[3px] ring-blue-500 rounded-lg' : ''}`}
                  data-instance-id={cloth.instanceId}
                  disableDragging={leaderDraggingId !== null && cloth.instanceId !== leaderDraggingId}
                  enableResizing={true}
                  resizeHandleStyles={touchResizeStyles}
                  resizeHandleComponent={{
                    bottomLeft: <div style={{ width: 10, height: 10, background: 'rgba(184, 173, 160, 0.7)', borderRadius: '50%', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', pointerEvents: 'auto' }} />,
                    bottomRight: <div style={{ width: 10, height: 10, background: 'rgba(184, 173, 160, 0.7)', borderRadius: '50%', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', pointerEvents: 'auto' }} />,
                    topLeft: <div style={{ width: 10, height: 10, background: 'rgba(184, 173, 160, 0.7)', borderRadius: '50%', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', pointerEvents: 'auto' }} />,
                    topRight: <div style={{ width: 10, height: 10, background: 'rgba(184, 173, 160, 0.7)', borderRadius: '50%', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', pointerEvents: 'auto' }} />,
                  }}
                  onDragStart={(e, d) => handleBatchDragStart(cloth.instanceId, e)}
                  onDrag={(e, d) => handleBatchDrag(cloth.instanceId, e, d)}
                  onDragStop={(e, d) => handleBatchDragStop(cloth.instanceId, e, d)}
                  onResizeStop={(e, direction, ref, delta, position) => handleResizeStop(cloth.instanceId, e, direction, ref, delta, position)}
                >
                  <div className={`w-full h-full relative ${doubleTapId === cloth.instanceId ? 'animate-double-tap' : ''}`}
                    style={{ transform: cloth.flipped ? 'scaleX(-1)' : 'none' }}>
                    <img src={cloth.image} alt={cloth.name} className="w-full h-full object-contain pointer-events-none" draggable={false} />
                  </div>
                  {isSelected && (
                    <div className="absolute bottom-1 right-1 flex items-center gap-1 z-10">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleZoom(cloth.instanceId, 0.9) }}
                        className="w-[28px] h-[28px] rounded-full bg-gray-500/60 hover:bg-gray-600/80 text-white text-sm flex items-center justify-center leading-none transition-all"
                        title="缩小"
                      >−</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleZoom(cloth.instanceId, 1.1) }}
                        className="w-[28px] h-[28px] rounded-full bg-gray-500/60 hover:bg-gray-600/80 text-white text-sm flex items-center justify-center leading-none transition-all"
                        title="放大"
                      >+</button>
                    </div>
                  )}
                </Rnd>
              )
            })
          }
        </div>

        {selectedClothes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400 animate-fade-in">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <p className="text-sm tracking-wider font-light">点击左侧衣物</p>
              <p className="text-xs mt-2 opacity-60">添加到画布进行搭配</p>
            </div>
          </div>
        )}

        {selectionBox && selectionBox.w > 5 && selectionBox.h > 5 && (
          <div className="absolute border-2 border-blue-400/70 bg-blue-200/20 z-40 pointer-events-none"
            style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h }} />
        )}
      </div>

      {!hideBottomToolbar && (
      <div className="p-4 border-t border-gray-200/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onUndo} disabled={!canUndo}
              className={`p-2 rounded-lg transition-all duration-200 ${canUndo ? 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-800' : 'text-gray-300 cursor-not-allowed'}`} title="撤销 (Ctrl+Z)">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" /></svg>
            </button>
            <button onClick={onRedo} disabled={!canRedo}
              className={`p-2 rounded-lg transition-all duration-200 ${canRedo ? 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-800' : 'text-gray-300 cursor-not-allowed'}`} title="重做 (Ctrl+Shift+Z)">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" /></svg>
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button onClick={onClearCanvas} disabled={selectedClothes.length === 0}
              className={`px-3 py-1.5 rounded-lg text-xs tracking-wide transition-all duration-200 ${selectedClothes.length > 0 ? 'text-gray-500 hover:bg-gray-100/50 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'}`} title="清空画布">
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>新建搭配
            </button>
          </div>
          <button onClick={() => onSaveOutfit(selectedClothes, 'save')} disabled={selectedClothes.length === 0}
            className={`px-4 sm:px-8 py-2 rounded-full text-xs tracking-widest uppercase transition-all duration-300 ${selectedClothes.length > 0 ? 'bg-gray-800 text-white hover:bg-gray-700 shadow-card hover:shadow-soft' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
            保存搭配
          </button>
        </div>
      </div>
      )}
    </div>
  )
}
