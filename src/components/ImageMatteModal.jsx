import { useState, useRef, useEffect, useCallback } from 'react'

const MAX_DIM = 1200
const DEFAULT_TOLERANCE = 20
const DEFAULT_FEATHER = 2

// ── core algorithm ──────────────────────────────────────────

/**
 * Weighted Euclidean color distance (human perception weights).
 */
function colorDistance(r1, g1, b1, r2, g2, b2) {
  const dr = (r1 - r2) * 0.3
  const dg = (g1 - g2) * 0.59
  const db = (b1 - b2) * 0.11
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

/**
 * BFS flood fill from (startX, startY).
 * Compares each pixel to the color at the start point.
 * Returns Uint8Array where 1 = filled.
 */
function floodFill(data, width, height, startX, startY, tolerance) {
  const off = (startY * width + startX) * 4
  const seedR = data[off], seedG = data[off + 1], seedB = data[off + 2]

  const mask = new Uint8Array(width * height)
  const visited = new Uint8Array(width * height)
  const queue = [startX, startY]
  visited[startY * width + startX] = 1
  mask[startY * width + startX] = 1

  let head = 0
  while (head < queue.length) {
    const x = queue[head], y = queue[head + 1]
    head += 2
    if (x > 0) tryEnqueue(x - 1, y)
    if (x < width - 1) tryEnqueue(x + 1, y)
    if (y > 0) tryEnqueue(x, y - 1)
    if (y < height - 1) tryEnqueue(x, y + 1)
  }

  function tryEnqueue(nx, ny) {
    const idx = ny * width + nx
    if (visited[idx]) return
    visited[idx] = 1
    const o = idx * 4
    if (colorDistance(data[o], data[o + 1], data[o + 2], seedR, seedG, seedB) <= tolerance) {
      mask[idx] = 1
      queue.push(nx, ny)
    }
  }

  return mask
}

/**
 * Compute Manhattan distance transform: distance from each pixel
 * to the nearest pixel where mask == 1.
 */
function distanceToSelection(mask, width, height) {
  const dist = new Float32Array(width * height)
  const INF = 1e9

  for (let i = 0; i < width * height; i++) {
    dist[i] = mask[i] === 1 ? 0 : INF
  }

  // Forward pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      if (x > 0 && dist[i - 1] + 1 < dist[i]) dist[i] = dist[i - 1] + 1
      if (y > 0 && dist[i - width] + 1 < dist[i]) dist[i] = dist[i - width] + 1
    }
  }

  // Backward pass
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x
      if (x < width - 1 && dist[i + 1] + 1 < dist[i]) dist[i] = dist[i + 1] + 1
      if (y < height - 1 && dist[i + width] + 1 < dist[i]) dist[i] = dist[i + width] + 1
    }
  }

  return dist
}

/**
 * Smoothstep function for nice alpha transitions.
 */
function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/**
 * Compute alpha channel from selection mask + feather.
 * Selected pixels → alpha 0 (transparent).
 * Unselected pixels near selection boundary → smooth feather transition.
 * Unselected pixels far from boundary → alpha 255 (opaque).
 */
function computeAlpha(mask, width, height, featherRadius) {
  const alpha = new Uint8Array(width * height)
  const total = width * height

  if (featherRadius <= 0) {
    for (let i = 0; i < total; i++) {
      alpha[i] = mask[i] === 1 ? 0 : 255
    }
    return alpha
  }

  const dist = distanceToSelection(mask, width, height)

  for (let i = 0; i < total; i++) {
    if (mask[i] === 1) {
      alpha[i] = 0
    } else {
      const d = dist[i]
      if (d <= featherRadius) {
        alpha[i] = Math.round(255 * smoothstep(0, featherRadius, d))
      } else {
        alpha[i] = 255
      }
    }
  }

  return alpha
}

/**
 * Generate blue overlay ImageData for preview.
 */
function createOverlayImageData(mask, width, height) {
  const overlay = new ImageData(width, height)
  for (let i = 0; i < width * height; i++) {
    if (mask[i] === 1) {
      const off = i * 4
      overlay.data[off] = 0
      overlay.data[off + 1] = 100
      overlay.data[off + 2] = 255
      overlay.data[off + 3] = 89
    }
  }
  return overlay
}

/**
 * Apply alpha channel to cloned pixel data, return new ImageData.
 */
function applyAlphaToImageData(sourceData, alphaData, width, height) {
  const result = new ImageData(width, height)
  for (let i = 0; i < width * height; i++) {
    const off = i * 4
    result.data[off] = sourceData[off]
    result.data[off + 1] = sourceData[off + 1]
    result.data[off + 2] = sourceData[off + 2]
    result.data[off + 3] = alphaData[i]
  }
  return result
}

/**
 * Check if mask has any selected pixels.
 */
function maskHasSelection(mask) {
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === 1) return true
  }
  return false
}

// ── component ────────────────────────────────────────────────

export default function ImageMatteModal({ open, imageDataUrl, fileName, index, total, onConfirm, onSkip }) {
  const mainCanvasRef = useRef(null)
  const overlayCanvasRef = useRef(null)

  const [img, setImg] = useState(null)
  const [sourceImageData, setSourceImageData] = useState(null)
  const [displayDims, setDisplayDims] = useState({ w: 400, h: 300 })
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 })

  // Selection state
  const selectionMaskRef = useRef(new Uint8Array(0))
  const clickStackRef = useRef([])   // [{x, y, isEraser}, ...]
  const [maskVersion, setMaskVersion] = useState(0)

  const [tolerance, setTolerance] = useState(DEFAULT_TOLERANCE)
  const [feather, setFeather] = useState(DEFAULT_FEATHER)
  const [isEraserMode, setIsEraserMode] = useState(false)
  const [computing, setComputing] = useState(false)
  const rafRef = useRef(0)

  // ── recompute mask from all clicks with current tolerance ──
  const recomputeMask = useCallback(() => {
    if (!sourceImageData) return

    const { data, width, height } = sourceImageData
    const mask = new Uint8Array(width * height)
    const clicks = clickStackRef.current

    for (const click of clicks) {
      const fill = floodFill(data, width, height, click.x, click.y, tolerance)
      for (let i = 0; i < width * height; i++) {
        if (fill[i] === 1) {
          mask[i] = click.isEraser ? 0 : 1
        }
      }
    }

    selectionMaskRef.current = mask
    setMaskVersion(v => v + 1)
  }, [sourceImageData, tolerance])

  // ── load image ──
  useEffect(() => {
    if (!open || !imageDataUrl) return

    setTolerance(DEFAULT_TOLERANCE)
    setFeather(DEFAULT_FEATHER)
    setIsEraserMode(false)
    clickStackRef.current = []

    const image = new Image()
    image.onload = () => {
      let w = image.naturalWidth
      let h = image.naturalHeight
      if (Math.max(w, h) > MAX_DIM) {
        const s = MAX_DIM / Math.max(w, h)
        w = Math.round(w * s)
        h = Math.round(h * s)
      }

      const maxW = Math.min(window.innerWidth * 0.88, 520)
      const maxH = Math.min(window.innerHeight * 0.4, 350)
      const fit = Math.min(maxW / w, maxH / h, 1)
      setDisplayDims({ w: Math.round(w * fit), h: Math.round(h * fit) })
      setCanvasSize({ w, h })

      const canvas = mainCanvasRef.current
      if (!canvas) return
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, 0, 0, w, h)
      const id = ctx.getImageData(0, 0, w, h)
      setSourceImageData(id)

      selectionMaskRef.current = new Uint8Array(w * h)
      setMaskVersion(v => v + 1)

      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.width = w
        overlayCanvasRef.current.height = h
        overlayCanvasRef.current.getContext('2d').clearRect(0, 0, w, h)
      }

      setImg(image)
    }
    image.onerror = () => {
      console.error('ImageMatteModal: failed to load image')
      onConfirm(imageDataUrl)
    }
    image.src = imageDataUrl
  }, [open, imageDataUrl])

  // ── Alt key for eraser mode ──
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => { if (e.key === 'Alt' && !e.repeat) setIsEraserMode(true) }
    const onKeyUp = (e) => { if (e.key === 'Alt') setIsEraserMode(false) }
    const onBlur = () => setIsEraserMode(false)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [open])

  // ── recompute mask when tolerance changes ──
  useEffect(() => {
    if (!sourceImageData || clickStackRef.current.length === 0) return
    recomputeMask()
  }, [tolerance, recomputeMask, sourceImageData])

  // ── redraw preview whenever mask or feather changes ──
  useEffect(() => {
    if (!sourceImageData || !img) return

    setComputing(true)
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const { data, width, height } = sourceImageData
      const mask = selectionMaskRef.current

      console.log('[ImageMatte] redraw', { tolerance, feather, selectedPixels: mask.reduce((s, v) => s + v, 0) })

      const alphaData = computeAlpha(mask, width, height, feather)

      // Draw result to main canvas
      const mainCanvas = mainCanvasRef.current
      if (mainCanvas) {
        const resultId = applyAlphaToImageData(data, alphaData, width, height)
        mainCanvas.getContext('2d').putImageData(resultId, 0, 0)
      }

      // Draw blue overlay
      const overlayCanvas = overlayCanvasRef.current
      if (overlayCanvas) {
        overlayCanvas.width = width
        overlayCanvas.height = height
        const octx = overlayCanvas.getContext('2d')
        octx.clearRect(0, 0, width, height)
        const overlayId = createOverlayImageData(mask, width, height)
        octx.putImageData(overlayId, 0, 0)
      }

      setComputing(false)
    })
  }, [sourceImageData, img, maskVersion, feather, tolerance])

  // Cleanup raf on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // ── canvas click → flood fill ──
  const handleCanvasClick = useCallback((e) => {
    if (!sourceImageData || !img) return

    const mainCanvas = mainCanvasRef.current
    if (!mainCanvas) return

    const rect = mainCanvas.getBoundingClientRect()
    const scaleX = canvasSize.w / rect.width
    const scaleY = canvasSize.h / rect.height
    const x = Math.floor((e.clientX - rect.left) * scaleX)
    const y = Math.floor((e.clientY - rect.top) * scaleY)

    if (x < 0 || x >= canvasSize.w || y < 0 || y >= canvasSize.h) return

    // Store click and recompute
    clickStackRef.current.push({ x, y, isEraser: isEraserMode })
    recomputeMask()
  }, [sourceImageData, img, canvasSize, isEraserMode, recomputeMask])

  // ── undo last click ──
  const handleUndo = useCallback(() => {
    if (clickStackRef.current.length === 0) return
    clickStackRef.current.pop()
    recomputeMask()
  }, [recomputeMask])

  // ── reset all ──
  const handleResetAll = useCallback(() => {
    if (!sourceImageData) return
    const { width, height } = sourceImageData
    clickStackRef.current = []
    selectionMaskRef.current = new Uint8Array(width * height)
    setMaskVersion(v => v + 1)
  }, [sourceImageData])

  // ── confirm ──
  const handleConfirm = useCallback(() => {
    if (!sourceImageData) {
      onConfirm(imageDataUrl)
      return
    }

    const { data, width, height } = sourceImageData
    const mask = selectionMaskRef.current
    const alphaData = computeAlpha(mask, width, height, feather)

    const resultCanvas = document.createElement('canvas')
    resultCanvas.width = width
    resultCanvas.height = height
    const resultId = applyAlphaToImageData(data, alphaData, width, height)
    resultCanvas.getContext('2d').putImageData(resultId, 0, 0)
    onConfirm(resultCanvas.toDataURL('image/png'))
  }, [sourceImageData, feather, imageDataUrl, onConfirm])

  if (!open) return null

  const clickCount = clickStackRef.current.length
  const hasSelection = selectionMaskRef.current.length > 0 && maskHasSelection(selectionMaskRef.current)

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="glass-card gallery-shadow rounded-2xl overflow-hidden flex flex-col"
        style={{ width: 'min(92vw, 540px)', maxHeight: 'min(88vh, 620px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xs tracking-widest uppercase text-gray-400 font-medium truncate">
              {fileName || '去除背景'}
            </h2>
            {total > 1 && (
              <span className="text-[11px] text-gray-400 whitespace-nowrap">第 {index + 1}/{total} 张</span>
            )}
          </div>
          <button onClick={onSkip} className="text-[11px] tracking-wide text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100/50 transition-colors">
            跳过
          </button>
        </div>

        {/* Preview area with checkerboard */}
        <div className="flex-1 flex items-center justify-center checkerboard-bg relative overflow-hidden" style={{ minHeight: 200 }}>
          <canvas
            ref={mainCanvasRef}
            onClick={handleCanvasClick}
            style={{
              width: displayDims.w,
              height: displayDims.h,
              cursor: isEraserMode ? 'cell' : 'crosshair',
            }}
            className="relative z-10"
          />
          <canvas
            ref={overlayCanvasRef}
            style={{
              width: displayDims.w,
              height: displayDims.h,
              pointerEvents: 'none',
            }}
            className="absolute z-20"
          />
          {!sourceImageData && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs tracking-wide z-30">
              加载中...
            </div>
          )}
          {computing && (
            <div className="absolute top-2 right-2 z-30 bg-white/70 backdrop-blur rounded-full px-2.5 py-0.5 text-[10px] tracking-wide text-gray-400">
              计算中...
            </div>
          )}
          {sourceImageData && (
            <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5">
              <span className={`text-[10px] tracking-wide px-2 py-0.5 rounded-full backdrop-blur transition-colors ${isEraserMode ? 'bg-red-100/70 text-red-500' : 'bg-blue-100/70 text-blue-500'}`}>
                {isEraserMode ? '橡皮擦（按住Alt）' : '魔棒（点击选择）'}
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-4 py-3 border-t border-gray-200/20 flex flex-col gap-2.5 shrink-0">
          {/* Tolerance */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-wide text-gray-400 w-10 shrink-0">容差</span>
            <input
              type="range"
              min={5}
              max={80}
              value={tolerance}
              onChange={e => setTolerance(Number(e.target.value))}
              className="flex-1 h-1 accent-gray-600"
            />
            <span className="text-[10px] tracking-wide text-gray-500 w-7 text-right shrink-0">{tolerance}</span>
          </div>

          {/* Feather */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-wide text-gray-400 w-10 shrink-0">羽化</span>
            <input
              type="range"
              min={0}
              max={8}
              value={feather}
              onChange={e => setFeather(Number(e.target.value))}
              className="flex-1 h-1 accent-gray-600"
            />
            <span className="text-[10px] tracking-wide text-gray-500 w-12 text-right shrink-0">{feather}px</span>
          </div>

          {/* Selection info */}
          <div className="flex items-center gap-2 text-[10px] tracking-wide text-gray-400">
            <span>已点击 {clickCount} 次</span>
            {hasSelection && <span className="text-gray-500">· 已选中区域</span>}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button onClick={handleUndo}
              disabled={clickStackRef.current.length === 0}
              className="flex-1 py-2 rounded-lg text-[11px] tracking-wide bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200">
              撤销点击
            </button>
            <button onClick={handleResetAll}
              disabled={!hasSelection}
              className="flex-1 py-2 rounded-lg text-[11px] tracking-wide bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200">
              全部重置
            </button>
            <button onClick={onSkip}
              className="flex-1 py-2.5 rounded-xl text-xs tracking-wide text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200">
              使用原图
            </button>
            <button onClick={handleConfirm}
              className="flex-[2] py-2.5 rounded-xl bg-gray-800 text-white text-xs tracking-widest hover:bg-gray-700 transition-all duration-200 shadow-sm">
              确认去底
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
