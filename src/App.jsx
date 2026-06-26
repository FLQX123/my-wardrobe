import { useState, useEffect, useRef, useCallback } from 'react'
import Wardrobe from './components/Wardrobe'
import Canvas from './components/Canvas'
import SaveModal from './components/SaveModal'
import RelatedOutfitsPanel from './components/RelatedOutfitsPanel'
import { getClothes, saveClothes, getOutfits, saveOutfits, getClothCategories, saveClothCategories, getOutfitCategories, saveOutfitCategories, getLogisticsItems, saveLogisticsItems } from './utils/storage'
import { extractPalette } from './utils/colors'
import { useIsPortrait } from './hooks/useResponsive'

const MAX_HISTORY = 50
const PANEL_WIDTH_KEY = 'wardrobe_panel_width'
const PANEL_MIN_WIDTH = 200
const PANEL_MAX_RATIO = 0.5

const WARDROBE_PANEL_WIDTH_KEY = 'wardrobe_left_panel_width'
const WARDROBE_PANEL_MIN_WIDTH = 320
const WARDROBE_PANEL_MAX_RATIO = 0.4

function getInitialPanelWidth() {
  try {
    const saved = localStorage.getItem(PANEL_WIDTH_KEY)
    if (saved) return parseInt(saved, 10)
  } catch {}
  return 280
}

function getInitialWardrobePanelWidth() {
  try {
    const saved = localStorage.getItem(WARDROBE_PANEL_WIDTH_KEY)
    if (saved) return parseInt(saved, 10)
  } catch {}
  return Math.max(WARDROBE_PANEL_MIN_WIDTH, Math.round(window.innerWidth * 0.38))
}

export default function App() {
  const [clothes, setClothes] = useState([])
  const [logisticsItems, setLogisticsItems] = useState([])
  const [selectedClothes, setSelectedClothes] = useState([])
  const [outfits, setOutfits] = useState([])
  const [clothCategories, setClothCategories] = useState([])
  const [outfitCategories, setOutfitCategories] = useState([])
  const [activeTab, setActiveTab] = useState('wardrobe')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const canvasRef = useRef(null)
  const lastCanvasPosition = useRef({ x: 150, y: 150, count: 0 })

  const pastRef = useRef([])
  const futureRef = useRef([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const pushHistory = useCallback((items) => {
    const snapshot = JSON.parse(JSON.stringify(items))
    pastRef.current.push(snapshot)
    if (pastRef.current.length > MAX_HISTORY) pastRef.current.shift()
    futureRef.current = []
    setCanUndo(true)
    setCanRedo(false)
  }, [])

  const initHistory = useCallback((items) => {
    pastRef.current = []
    futureRef.current = []
    const snapshot = JSON.parse(JSON.stringify(items))
    pastRef.current.push(snapshot)
    setCanUndo(false)
    setCanRedo(false)
  }, [])

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [pendingSaveItems, setPendingSaveItems] = useState(null)
  const [currentEditingOutfitId, setCurrentEditingOutfitId] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [selectedPanelCloth, setSelectedPanelCloth] = useState(null)
  const [relatedPanelOpen, setRelatedPanelOpen] = useState(false)
  const [relatedPanelWidth, setRelatedPanelWidth] = useState(getInitialPanelWidth)
  const isDraggingRef = useRef(false)
  const lastPanelWidthRef = useRef(relatedPanelWidth)

  const isPortrait = useIsPortrait()
  const [canvasRatio, setCanvasRatio] = useState(0.55)
  const CANVAS_MIN_RATIO = 0.4
  const CANVAS_MAX_RATIO = 0.7
  const CONTENT_MIN_HEIGHT = 150

  const wardrobePanelWidthFromStorage = getInitialWardrobePanelWidth()
  const [wardrobePanelWidth, setWardrobePanelWidth] = useState(wardrobePanelWidthFromStorage)
  const isWardrobeDraggingRef = useRef(false)
  const lastWardrobeWidthRef = useRef(wardrobePanelWidthFromStorage)

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return
    const prevSnapshot = pastRef.current.pop()
    const currentSnapshot = JSON.parse(JSON.stringify(selectedClothes))
    futureRef.current.push(currentSnapshot)
    setSelectedClothes(prevSnapshot)
    setSelectedIds([])
    setCanUndo(pastRef.current.length > 0)
    setCanRedo(true)
  }, [selectedClothes])

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return
    const nextSnapshot = futureRef.current.pop()
    const currentSnapshot = JSON.parse(JSON.stringify(selectedClothes))
    pastRef.current.push(currentSnapshot)
    setSelectedClothes(nextSnapshot)
    setSelectedIds([])
    setCanUndo(true)
    setCanRedo(futureRef.current.length > 0)
  }, [selectedClothes])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  const handleVerticalDividerResizeStart = useCallback((e) => {
    e.preventDefault()
    const startY = e.touches ? e.touches[0].clientY : e.clientY
    const startRatio = canvasRatio
    document.body.style.overflow = 'hidden'

    const onMove = (ev) => {
      ev.preventDefault()
      const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY
      const deltaY = clientY - startY
      const deltaRatio = deltaY / window.innerHeight
      const newRatio = Math.max(CANVAS_MIN_RATIO, Math.min(CANVAS_MAX_RATIO, startRatio + deltaRatio))
      setCanvasRatio(newRatio)
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.overflow = ''
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove, {passive: false})
    document.addEventListener('touchend', onUp)
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'
  }, [canvasRatio])

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const savedClothes = await getClothes()
    const savedOutfits = await getOutfits()
    const savedClothCats = await getClothCategories()
    const savedOutfitCats = await getOutfitCategories()
    const savedLogistics = await getLogisticsItems()
    setClothes(savedClothes)
    setOutfits(savedOutfits)
    setClothCategories(savedClothCats)
    setOutfitCategories(savedOutfitCats)
    setLogisticsItems(savedLogistics)
  }

  const handleAddClothes = async (cloth) => {
    const newClothes = [...clothes, cloth]
    setClothes(newClothes)
    await saveClothes(newClothes)
  }

  const handleBatchAddClothes = useCallback(async (newItems) => {
    const newClothes = [...clothes, ...newItems]
    setClothes(newClothes)
    await saveClothes(newClothes)
    setUploadProgress(null)
    showNotification(`已导入 ${newItems.length} 件单品`)
  }, [clothes])

  const handleSelectCloth = (cloth) => {
    const defW = isPortrait ? 160 : 220
    const defH = isPortrait ? 190 : 260
    const gap = 20

    // Place new items in a horizontal row from last operation position
    const baseX = lastCanvasPosition.current.x
    const baseY = lastCanvasPosition.current.y
    const canvasEl = canvasRef.current
    const canvasWidth = canvasEl ? canvasEl.clientWidth : 800

    const offsetX = lastCanvasPosition.current.count * (defW + gap)
    let newX = baseX + offsetX
    let newY = baseY

    // Wrap to next row if overflows right edge
    if (newX + defW > canvasWidth - 50) {
      newX = baseX
      newY = baseY + defH + gap
      lastCanvasPosition.current.count = 0
    }
    lastCanvasPosition.current.count += 1

    const newItem = { ...cloth, instanceId: Date.now().toString(36) + Math.random().toString(36).substr(2), flipped: false, width: defW, height: defH, x: newX, y: newY }
    const newSelected = [...selectedClothes, newItem]
    setSelectedClothes(newSelected)
    setSelectedIds([])
    pushHistory(newSelected)
    setSelectedPanelCloth(cloth)
  }

  const handleRemoveCloth = useCallback((instanceId) => {
    const deletedItem = selectedClothes.find(item => item.instanceId === instanceId)
    const newSelected = selectedClothes.filter(item => item.instanceId !== instanceId)
    setSelectedClothes(newSelected)
    setSelectedIds(prev => prev.filter(id => id !== instanceId))
    pushHistory(newSelected)
    if (deletedItem && selectedPanelCloth && deletedItem.id === selectedPanelCloth.id) {
      setSelectedPanelCloth({ id: null, name: deletedItem.name || '' })
    }
  }, [selectedClothes, pushHistory, selectedPanelCloth])

  const handleBatchRemove = useCallback((instanceIds) => {
    const deletedItems = selectedClothes.filter(item => instanceIds.includes(item.instanceId))
    const newSelected = selectedClothes.filter(item => !instanceIds.includes(item.instanceId))
    setSelectedClothes(newSelected)
    setSelectedIds([])
    pushHistory(newSelected)
    const match = deletedItems.find(d => selectedPanelCloth && d.id === selectedPanelCloth.id)
    if (match) {
      setSelectedPanelCloth({ id: null, name: match.name || '' })
    }
  }, [selectedClothes, pushHistory, selectedPanelCloth])

  const handleToggleSelect = useCallback((instanceId) => {
    if (!instanceId) { setSelectedIds([]); setSelectedPanelCloth(prev => prev ? { id: null, name: prev.name || '' } : null); return }
    setSelectedIds(prev => {
      if (prev.includes(instanceId)) {
        setSelectedPanelCloth(prevCloth => prevCloth ? { id: null, name: prevCloth.name || '' } : null)
        return prev.filter(id => id !== instanceId)
      } else {
        const cloth = selectedClothes.find(c => c.instanceId === instanceId)
        if (cloth) setSelectedPanelCloth(cloth)
        return [instanceId]
      }
    })
  }, [selectedClothes])

  const handleBatchSelect = useCallback((instanceIds) => { setSelectedIds(instanceIds); setSelectedPanelCloth(null) }, [])
  const handleMultiSelect = useCallback((instanceId) => {
    setSelectedIds(prev => prev.includes(instanceId) ? prev.filter(id => id !== instanceId) : [...prev, instanceId])
    setSelectedPanelCloth(null)
  }, [])

  const handleClothPositionChange = useCallback((instanceId, position) => {
    // Remember last canvas position for new item placement
    lastCanvasPosition.current = { x: position.x, y: position.y, count: 0 }
    setSelectedClothes(prev => {
      const newItems = prev.map(item => item.instanceId === instanceId ? { ...item, ...position } : item)
      // Save history on drag/resize end for single items
      pushHistory(newItems)
      return newItems
    })
  }, [pushHistory])

  const handleBatchPositionChange = useCallback((updates) => {
    // Remember last canvas position from the leader's new position
    if (updates.length > 0) {
      lastCanvasPosition.current = { x: updates[0].x, y: updates[0].y, count: 0 }
    }
    const newSelected = selectedClothes.map(item => {
      const update = updates.find(u => u.instanceId === item.instanceId)
      return update ? { ...item, x: update.x, y: update.y, width: update.width, height: update.height } : item
    })
    setSelectedClothes(newSelected)
    pushHistory(newSelected)
  }, [selectedClothes, pushHistory])

  const handleClearCanvas = useCallback(() => {
    pushHistory(selectedClothes) // save current state before clearing
    setSelectedClothes([]); setSelectedIds([])
    setCurrentEditingOutfitId(null)
  }, [pushHistory, selectedClothes])

  const captureOutfitSnapshot = useCallback(async (items) => {
    if (items.length === 0) return null

    // Calculate bounding box of all items (in display coordinates)
    const padding = 40
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    items.forEach(item => {
      const x = item.x !== undefined ? item.x : 150
      const y = item.y !== undefined ? item.y : 150
      const w = item.width !== undefined ? item.width : 220
      const h = item.height !== undefined ? item.height : 260
      minX = Math.min(minX, x); minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h)
    })
    minX = Math.max(0, minX - padding); minY = Math.max(0, minY - padding)
    maxX += padding; maxY += padding
    const cropW = maxX - minX; const cropH = maxY - minY
    if (cropW <= 0 || cropH <= 0) return null

    console.log('[captureOutfitSnapshot] crop region:', { minX, minY, maxX, maxY, cropW, cropH, itemCount: items.length })

    const outScale = 2
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(cropW * outScale)
    canvas.height = Math.round(cropH * outScale)
    const ctx = canvas.getContext('2d')

    // Fill with background color
    ctx.fillStyle = '#f8f5f0'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Load all images first
    const loadImage = (src) => {
      if (!src) return Promise.resolve(null)
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          console.log('[captureOutfitSnapshot] loaded image:', { src: src.substring(0, 40) + '...', naturalW: img.naturalWidth, naturalH: img.naturalHeight })
          resolve(img)
        }
        img.onerror = () => { console.warn('[captureOutfitSnapshot] failed to load image:', src.substring(0, 40)); resolve(null) }
        img.src = src
      })
    }

    const loadedImages = await Promise.all(items.map(item => loadImage(item.image || '')))

    // Draw items in order (back to front)
    for (let i = 0; i < items.length; i++) {
      const img = loadedImages[i]
      const item = items[i]
      if (!img || !img.naturalWidth || !img.naturalHeight) {
        console.warn('[captureOutfitSnapshot] skipping item with invalid image dimensions')
        continue
      }

      const itemW = item.width !== undefined ? item.width : 220
      const itemH = item.height !== undefined ? item.height : 260
      const itemX = item.x !== undefined ? item.x : 150
      const itemY = item.y !== undefined ? item.y : 150

      // object-contain: scale uniformly to fit within item bounds, preserve aspect ratio
      const fitScale = Math.min(itemW / img.naturalWidth, itemH / img.naturalHeight)
      const drawW = img.naturalWidth * fitScale
      const drawH = img.naturalHeight * fitScale

      // Center within the item bounds
      const offsetX = (itemW - drawW) / 2
      const offsetY = (itemH - drawH) / 2

      const dx = (itemX - minX + offsetX) * outScale
      const dy = (itemY - minY + offsetY) * outScale
      const dw = drawW * outScale
      const dh = drawH * outScale

      console.log(`[captureOutfitSnapshot] drawing item ${i}:`, {
        itemPos: { x: itemX, y: itemY, w: itemW, h: itemH },
        imgNatural: { w: img.naturalWidth, h: img.naturalHeight },
        fitScale, drawW, drawH,
        canvasDest: { dx, dy, dw, dh },
      })

      if (item.flipped) {
        ctx.save()
        ctx.translate(dx + dw, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(img, 0, dy, dw, dh)
        ctx.restore()
      } else {
        ctx.drawImage(img, dx, dy, dw, dh)
      }
    }

    const dataUrl = canvas.toDataURL('image/png')
    console.log('[captureOutfitSnapshot] output canvas:', { w: canvas.width, h: canvas.height, dataUrlLen: dataUrl.length })
    return dataUrl
  }, [])

  const handleCanvasAction = useCallback(async (items, action, targetIds) => {
    if (action === 'save') {
      if (!canvasRef.current || items.length === 0) return
      if (currentEditingOutfitId) {
        try {
          const screenshot = await captureOutfitSnapshot(items)
          if (!screenshot) return
          const palette = await extractPalette(screenshot, 4)
          const newOutfits = outfits.map(item =>
            item.id === currentEditingOutfitId
              ? { ...item, screenshot, palette, clothes: items }
              : item
          )
          setOutfits(newOutfits); await saveOutfits(newOutfits)
          showNotification('搭配已更新')
        } catch (error) {
          console.error('更新失败:', error)
          showNotification('更新失败，请重试')
        }
      } else {
        setPendingSaveItems(items)
        setShowSaveModal(true)
      }
    } else if (action === 'bringToFront') {
      const targets = items.filter(item => targetIds.includes(item.instanceId))
      const others = items.filter(item => !targetIds.includes(item.instanceId))
      const newItems = [...others, ...targets]
      setSelectedClothes(newItems); pushHistory(newItems)
    } else if (action === 'sendToBack') {
      const targets = items.filter(item => targetIds.includes(item.instanceId))
      const others = items.filter(item => !targetIds.includes(item.instanceId))
      const newItems = [...targets, ...others]
      setSelectedClothes(newItems); pushHistory(newItems)
    } else if (action === 'flip') {
      const newItems = items.map(item => targetIds.includes(item.instanceId) ? { ...item, flipped: !item.flipped } : item)
      setSelectedClothes(newItems); pushHistory(newItems)
    }
  }, [outfits, pushHistory, currentEditingOutfitId, captureOutfitSnapshot])

  const handleSelectOutfit = useCallback((outfit) => {
    const restoredClothes = outfit.clothes.map((cloth, index) => ({
      ...cloth, instanceId: Date.now().toString(36) + Math.random().toString(36).substr(2) + index,
    }))
    setSelectedClothes(restoredClothes)
    setSelectedIds([])
    setCurrentEditingOutfitId(outfit.id)
    initHistory(restoredClothes)
  }, [initHistory])

  const handleCloneOutfit = useCallback(async (outfit) => {
    const clonedOutfit = {
      ...outfit,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: (outfit.name || '搭配方案') + ' - 副本',
      createdAt: new Date().toISOString(),
    }
    const newOutfits = [...outfits, clonedOutfit]
    setOutfits(newOutfits)
    await saveOutfits(newOutfits)

    const restoredClothes = clonedOutfit.clothes.map((cloth, index) => ({
      ...cloth, instanceId: Date.now().toString(36) + Math.random().toString(36).substr(2) + index,
    }))
    setSelectedClothes(restoredClothes)
    setSelectedIds([])
    setCurrentEditingOutfitId(clonedOutfit.id)
    initHistory(restoredClothes)
    showNotification('已复制并打开新副本')
  }, [outfits, initHistory])

  const handleDeleteOutfit = useCallback(async (outfitId) => {
    const newOutfits = outfits.filter(outfit => outfit.id !== outfitId)
    setOutfits(newOutfits)
    await saveOutfits(newOutfits)
    showNotification('已删除')
  }, [outfits])

  const handleUpdateClothCategory = useCallback(async (clothId, newCategory) => {
    const newClothes = clothes.map(item => item.id === clothId ? { ...item, category: newCategory } : item)
    setClothes(newClothes)
    await saveClothes(newClothes)
  }, [clothes])

  const handleDeleteCloth = useCallback(async (clothId) => {
    const newClothes = clothes.filter(item => item.id !== clothId)
    setClothes(newClothes)
    await saveClothes(newClothes)
    showNotification('已删除')
  }, [clothes])

  const handleBatchDeleteClothes = useCallback(async (clothIds) => {
    const newClothes = clothes.filter(item => !clothIds.includes(item.id))
    setClothes(newClothes)
    await saveClothes(newClothes)
    showNotification(`已删除 ${clothIds.length} 件单品`)
  }, [clothes])

  const handleBatchDeleteOutfits = useCallback(async (outfitIds) => {
    const newOutfits = outfits.filter(item => !outfitIds.includes(item.id))
    setOutfits(newOutfits)
    await saveOutfits(newOutfits)
    showNotification(`已删除 ${outfitIds.length} 套搭配`)
  }, [outfits])

  const handleConfirmSave = useCallback(async (name, season) => {
    if (!canvasRef.current || !pendingSaveItems || pendingSaveItems.length === 0) {
      setShowSaveModal(false); setPendingSaveItems(null); return
    }
    try {
      const screenshot = await captureOutfitSnapshot(pendingSaveItems)
      if (!screenshot) { setShowSaveModal(false); setPendingSaveItems(null); return }
      const palette = await extractPalette(screenshot, 4)

      const outfit = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name: name || '搭配方案', season: season || '',
        screenshot, palette, clothes: pendingSaveItems,
        shootStatus: '未拍摄',
        realPhotos: [],
        createdAt: new Date().toISOString(),
      }

      const newOutfits = [...outfits, outfit]
      setOutfits(newOutfits)
      await saveOutfits(newOutfits)
      setSelectedClothes([]); setSelectedIds([]); setPendingSaveItems(null)
      setCurrentEditingOutfitId(null)
      initHistory([])
      showNotification('搭配已保存' + (season ? '至「' + season + '」' : ''))
    } catch (error) {
      console.error('保存失败:', error)
      showNotification('保存失败，请重试')
    } finally {
      setShowSaveModal(false)
    }
  }, [outfits, pendingSaveItems, captureOutfitSnapshot, initHistory])

  const handleUpdateOutfit = useCallback(async (outfitId, updates) => {
    const newOutfits = outfits.map(item => item.id === outfitId ? { ...item, ...updates } : item)
    setOutfits(newOutfits)
    await saveOutfits(newOutfits)
  }, [outfits])

  const handleAddRealPhoto = useCallback(async (outfitId, dataUrl) => {
    const newOutfits = outfits.map(item =>
      item.id === outfitId
        ? { ...item, realPhotos: [...(item.realPhotos || []), { dataUrl, createdAt: new Date().toISOString() }] }
        : item
    )
    setOutfits(newOutfits)
    await saveOutfits(newOutfits)
    showNotification('实物照已添加')
  }, [outfits])

  const handleDeleteRealPhoto = useCallback(async (outfitId, photoIndex) => {
    const newOutfits = outfits.map(item =>
      item.id === outfitId
        ? { ...item, realPhotos: (item.realPhotos || []).filter((_, i) => i !== photoIndex) }
        : item
    )
    setOutfits(newOutfits)
    await saveOutfits(newOutfits)
    showNotification('实物照已删除')
  }, [outfits])

  const handleUpdateOutfitShootStatus = useCallback(async (outfitId, status) => {
    const newOutfits = outfits.map(item => item.id === outfitId ? { ...item, shootStatus: status } : item)
    setOutfits(newOutfits)
    await saveOutfits(newOutfits)
    showNotification(status === '已拍摄' ? '已标记为拍摄完成' : '已标记为未拍摄')
  }, [outfits])

  const handleUpdateClothLogistics = useCallback(async (clothId, updates) => {
    const newItems = logisticsItems.map(item => item.id === clothId ? { ...item, ...updates } : item)
    setLogisticsItems(newItems)
    await saveLogisticsItems(newItems)
  }, [logisticsItems])

  const handleAddLogisticsItems = useCallback(async (newItems) => {
    const updatedItems = [...logisticsItems, ...newItems]
    setLogisticsItems(updatedItems)
    await saveLogisticsItems(updatedItems)
  }, [logisticsItems])

  const handleDeleteLogisticsItem = useCallback(async (clothId) => {
    const newItems = logisticsItems.filter(item => item.id !== clothId)
    setLogisticsItems(newItems)
    await saveLogisticsItems(newItems)
  }, [logisticsItems])

  const handleAddClothCategory = useCallback(async (name) => {
    const newCats = [...clothCategories, name]
    setClothCategories(newCats)
    await saveClothCategories(newCats)
  }, [clothCategories])

  const handleRenameClothCategory = useCallback(async (oldName, newName) => {
    const newCats = clothCategories.map(c => c === oldName ? newName : c)
    setClothCategories(newCats)
    await saveClothCategories(newCats)
    const newClothes = clothes.map(item => item.category === oldName ? { ...item, category: newName } : item)
    setClothes(newClothes)
    await saveClothes(newClothes)
  }, [clothCategories, clothes])

  const handleDeleteClothCategory = useCallback(async (name) => {
    const newCats = clothCategories.filter(c => c !== name)
    setClothCategories(newCats)
    await saveClothCategories(newCats)
    const fallback = newCats.find(c => c !== '全部') || ''
    const newClothes = clothes.map(item => item.category === name ? { ...item, category: fallback } : item)
    setClothes(newClothes)
    await saveClothes(newClothes)
  }, [clothCategories, clothes])

  const handleAddOutfitCategory = useCallback(async (name) => {
    const newCats = [...outfitCategories, name]
    setOutfitCategories(newCats)
    await saveOutfitCategories(newCats)
  }, [outfitCategories])

  const handleRenameOutfitCategory = useCallback(async (oldName, newName) => {
    const newCats = outfitCategories.map(c => c === oldName ? newName : c)
    setOutfitCategories(newCats)
    await saveOutfitCategories(newCats)
    const newOutfits = outfits.map(item => item.season === oldName ? { ...item, season: newName } : item)
    setOutfits(newOutfits)
    await saveOutfits(newOutfits)
  }, [outfitCategories, outfits])

  const handleDeleteOutfitCategory = useCallback(async (name) => {
    const newCats = outfitCategories.filter(c => c !== name)
    setOutfitCategories(newCats)
    await saveOutfitCategories(newCats)
    const fallback = newCats.find(c => c !== '全部') || ''
    const newOutfits = outfits.map(item => item.season === name ? { ...item, season: fallback } : item)
    setOutfits(newOutfits)
    await saveOutfits(newOutfits)
  }, [outfitCategories, outfits])

  const sortedClothes = [...clothes].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  const sortedOutfits = [...outfits].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

  const handlePanelResizeStart = useCallback((e) => {
    if (isPortrait) return
    e.preventDefault()
    isDraggingRef.current = true
    const initialPanelWidth = relatedPanelWidth
    const startMouseX = e.clientX || (e.touches && e.touches[0].clientX) || 0
    lastPanelWidthRef.current = initialPanelWidth
    document.body.style.overflow = 'hidden'

    const onMove = (ev) => {
      ev.preventDefault()
      if (!isDraggingRef.current) return
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX
      const delta = startMouseX - clientX
      const newWidth = Math.max(PANEL_MIN_WIDTH, Math.min(window.innerWidth * PANEL_MAX_RATIO, initialPanelWidth + delta))
      lastPanelWidthRef.current = newWidth
      setRelatedPanelWidth(Math.round(newWidth))
    }

    const onUp = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.overflow = ''
      try { localStorage.setItem(PANEL_WIDTH_KEY, String(Math.round(lastPanelWidthRef.current))) } catch {}
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove, {passive: false})
    document.addEventListener('touchend', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [relatedPanelWidth])

  const handleWardrobePanelResizeStart = useCallback((e) => {
    if (isPortrait) return
    e.preventDefault()
    e.stopPropagation()
    console.log('[Divider] 分隔线被点击/触摸')
    isWardrobeDraggingRef.current = true
    const initialWidth = wardrobePanelWidth
    const startMouseX = e.clientX || (e.touches && e.touches[0].clientX) || 0
    lastWardrobeWidthRef.current = initialWidth
    document.body.style.overflow = 'hidden'

    const onMove = (ev) => {
      ev.preventDefault()
      if (!isWardrobeDraggingRef.current) return
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX
      const delta = clientX - startMouseX
      const newWidth = Math.max(WARDROBE_PANEL_MIN_WIDTH, Math.min(window.innerWidth * WARDROBE_PANEL_MAX_RATIO, initialWidth + delta))
      console.log('[Divider] 拖动中:', { delta, newWidth })
      lastWardrobeWidthRef.current = newWidth
      setWardrobePanelWidth(Math.round(newWidth))
    }

    const onUp = () => {
      if (!isWardrobeDraggingRef.current) return
      isWardrobeDraggingRef.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.overflow = ''
      const finalWidth = Math.round(lastWardrobeWidthRef.current)
      console.log('[Divider] 拖动结束，保存宽度:', finalWidth)
      try { localStorage.setItem(WARDROBE_PANEL_WIDTH_KEY, String(finalWidth)) } catch {}
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove, {passive: false})
    document.addEventListener('touchend', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [wardrobePanelWidth])

  const showNotification = (message) => {
    setToastMessage(message); setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {isPortrait ? (
        <div className="h-screen w-screen flex flex-col overflow-hidden">
          {/* Top toolbar */}
          <div className="flex-shrink-0 pt-safe px-3 py-2 flex items-center justify-between glass-card border-b border-gray-200/20 z-10">
            <div className="flex items-center gap-1">
              <button onClick={undo} disabled={!canUndo}
                className={`p-2 rounded-lg transition-all duration-200 ${canUndo ? 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-800' : 'text-gray-300 cursor-not-allowed'}`} title="撤销 (Ctrl+Z)">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" /></svg>
              </button>
              <button onClick={redo} disabled={!canRedo}
                className={`p-2 rounded-lg transition-all duration-200 ${canRedo ? 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-800' : 'text-gray-300 cursor-not-allowed'}`} title="重做 (Ctrl+Shift+Z)">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" /></svg>
              </button>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <button onClick={handleClearCanvas} disabled={selectedClothes.length === 0}
                className={`px-3 py-1.5 rounded-lg text-xs tracking-wide transition-all duration-200 ${selectedClothes.length > 0 ? 'text-gray-500 hover:bg-gray-100/50 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}>
                新建
              </button>
              <button
                onClick={() => setRelatedPanelOpen(prev => !prev)}
                className={`px-3 py-1.5 rounded-lg text-xs tracking-wide transition-all duration-200 flex items-center gap-1 ${relatedPanelOpen ? 'text-gray-700 bg-gray-100/50' : 'text-gray-400 hover:bg-gray-100/50 hover:text-gray-600'}`}
                title={relatedPanelOpen ? '收起关联搭配' : '关联搭配'}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                关联搭配
              </button>
            </div>
            <button onClick={() => handleCanvasAction(selectedClothes, 'save')} disabled={selectedClothes.length === 0}
              className={`px-4 py-2 rounded-full text-xs tracking-widest uppercase transition-all duration-300 ${selectedClothes.length > 0 ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
              保存
            </button>
          </div>

          {/* Canvas area — 55% height, draggable */}
          <div className="flex-shrink-0 overflow-auto" style={{ height: `${canvasRatio * 100}%`, minHeight: `${CANVAS_MIN_RATIO * 100}%`, maxHeight: `${CANVAS_MAX_RATIO * 100}%` }}>
            <Canvas
              selectedClothes={selectedClothes} onRemoveCloth={handleRemoveCloth}
              onBatchRemove={handleBatchRemove} onSaveOutfit={handleCanvasAction}
              canvasRef={canvasRef} selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect} onMultiSelect={handleMultiSelect}
              onBatchSelect={handleBatchSelect} onClothPositionChange={handleClothPositionChange}
              onBatchPositionChange={handleBatchPositionChange} onClearCanvas={handleClearCanvas}
              onUndo={undo} onRedo={redo}
              canUndo={canUndo} canRedo={canRedo}
              isPortrait={true} hideBottomToolbar={true}
            />
          </div>

          {/* Vertical divider — 20px touch target, 2px visual line */}
          <div
            className="flex-shrink-0 h-[20px] cursor-ns-resize flex items-center justify-center relative z-10 group touch-none"
            style={{ touchAction: 'none' }}
            onMouseDown={handleVerticalDividerResizeStart}
            onTouchStart={handleVerticalDividerResizeStart}
          >
            <div className="w-10 h-[3px] rounded-full bg-gray-300/40 group-hover:bg-gray-400/60 transition-colors duration-200" />
          </div>

          {/* Content area — flex-1, independent scroll */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <Wardrobe
              clothes={sortedClothes} logisticsItems={logisticsItems} outfits={sortedOutfits} activeTab={activeTab}
              clothCategories={clothCategories} outfitCategories={outfitCategories}
              onTabChange={setActiveTab} onSelectCloth={handleSelectCloth}
              onAddClothes={handleAddClothes} onBatchAddClothes={handleBatchAddClothes}
              onUploadProgress={setUploadProgress}
              onSelectOutfit={handleSelectOutfit}
              onCloneOutfit={handleCloneOutfit}
              onDeleteOutfit={handleDeleteOutfit} onUpdateClothCategory={handleUpdateClothCategory}
              onUpdateOutfit={handleUpdateOutfit} onDeleteCloth={handleDeleteCloth}
              onBatchDeleteClothes={handleBatchDeleteClothes}
              onBatchDeleteOutfits={handleBatchDeleteOutfits}
              onAddClothCategory={handleAddClothCategory}
              onRenameClothCategory={handleRenameClothCategory}
              onDeleteClothCategory={handleDeleteClothCategory}
              onAddOutfitCategory={handleAddOutfitCategory}
              onRenameOutfitCategory={handleRenameOutfitCategory}
              onDeleteOutfitCategory={handleDeleteOutfitCategory}
              onUpdateOutfitShootStatus={handleUpdateOutfitShootStatus}
              onAddRealPhoto={handleAddRealPhoto}
              onDeleteRealPhoto={handleDeleteRealPhoto}
              onUpdateClothLogistics={handleUpdateClothLogistics}
              onAddLogisticsItems={handleAddLogisticsItems}
              onDeleteLogisticsItem={handleDeleteLogisticsItem}
              hideTabBar={true}
              isPortraitMode={true}
            />
          </div>

          {/* Fixed tab bar at screen bottom */}
          <div className="flex-shrink-0 flex border-t border-gray-200/40 pb-safe bg-white/60 backdrop-blur-sm">
            {['wardrobe', 'outfits', 'shooting', 'logistics'].map(key => {
              const labels = { wardrobe: '我的单品', outfits: '搭配手册', shooting: '拍摄看板', logistics: '物流管理' }
              const isActive = activeTab === key
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 py-4 text-xs tracking-widest transition-all duration-300 relative ${isActive ? 'text-gray-800 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {labels[key]}
                  {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gray-500 rounded-full" />}
                </button>
              )
            })}
          </div>

          {/* Related outfits floating panel */}
          {relatedPanelOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-backdrop-in"
                   onClick={() => setRelatedPanelOpen(false)} />
              <div className="fixed top-0 right-0 bottom-0 z-50 w-[50vw] max-w-[350px] animate-slide-in-right"
                   style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                <RelatedOutfitsPanel
                  cloth={selectedPanelCloth}
                  outfits={outfits}
                  panelWidth={Math.min(350, window.innerWidth * 0.5)}
                  onClose={() => setRelatedPanelOpen(false)}
                  onSelectOutfit={handleSelectOutfit}
                  isPortrait={true}
                />
              </div>
            </>
          )}

        </div>
      ) : (
        <>
      <div className="h-full flex-shrink-0 overflow-hidden" style={{ width: wardrobePanelWidth }}>
        <Wardrobe
          clothes={sortedClothes} logisticsItems={logisticsItems} outfits={sortedOutfits} activeTab={activeTab}
          clothCategories={clothCategories} outfitCategories={outfitCategories}
          onTabChange={setActiveTab} onSelectCloth={handleSelectCloth}
          onAddClothes={handleAddClothes} onBatchAddClothes={handleBatchAddClothes}
          onUploadProgress={setUploadProgress}
          onSelectOutfit={handleSelectOutfit}
          onCloneOutfit={handleCloneOutfit}
          onDeleteOutfit={handleDeleteOutfit} onUpdateClothCategory={handleUpdateClothCategory}
          onUpdateOutfit={handleUpdateOutfit} onDeleteCloth={handleDeleteCloth}
          onBatchDeleteClothes={handleBatchDeleteClothes}
          onBatchDeleteOutfits={handleBatchDeleteOutfits}
          onAddClothCategory={handleAddClothCategory}
          onRenameClothCategory={handleRenameClothCategory}
          onDeleteClothCategory={handleDeleteClothCategory}
          onAddOutfitCategory={handleAddOutfitCategory}
          onRenameOutfitCategory={handleRenameOutfitCategory}
          onDeleteOutfitCategory={handleDeleteOutfitCategory}
          onUpdateOutfitShootStatus={handleUpdateOutfitShootStatus}
          onAddRealPhoto={handleAddRealPhoto}
          onDeleteRealPhoto={handleDeleteRealPhoto}
          onUpdateClothLogistics={handleUpdateClothLogistics}
          onAddLogisticsItems={handleAddLogisticsItems}
          onDeleteLogisticsItem={handleDeleteLogisticsItem}
        />
      </div>
      <div
        className="w-[20px] h-full cursor-col-resize relative z-30 flex-shrink-0 group flex items-center justify-center"
        style={{ touchAction: 'none' }}
        onMouseDown={handleWardrobePanelResizeStart}
        onTouchStart={handleWardrobePanelResizeStart}
      >
        <div className="w-[3px] h-full bg-gray-300/50 group-hover:bg-blue-400/60 transition-colors duration-200 pointer-events-none rounded-full" />
      </div>
      <div className="flex-1 h-full flex min-w-0 relative">
        <div className="flex-1 min-w-0 min-h-0 overflow-auto">
          <Canvas
            selectedClothes={selectedClothes} onRemoveCloth={handleRemoveCloth}
            onBatchRemove={handleBatchRemove} onSaveOutfit={handleCanvasAction}
            canvasRef={canvasRef} selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect} onMultiSelect={handleMultiSelect}
            onBatchSelect={handleBatchSelect} onClothPositionChange={handleClothPositionChange}
            onBatchPositionChange={handleBatchPositionChange} onClearCanvas={handleClearCanvas}
            onUndo={undo} onRedo={redo}
            canUndo={canUndo} canRedo={canRedo}
            isPortrait={false}
          />
        </div>
        {relatedPanelOpen && (
          <>
            <div
              className="w-[20px] h-full cursor-col-resize relative z-30 flex-shrink-0 group flex items-center justify-center"
              style={{ touchAction: 'none' }}
              onMouseDown={handlePanelResizeStart}
              onTouchStart={handlePanelResizeStart}
            >
              <div className="w-[3px] h-full bg-gray-300/50 group-hover:bg-blue-400/60 transition-colors duration-200 pointer-events-none rounded-full" />
            </div>
            <div className="h-full animate-slide-in-right flex-shrink-0 overflow-hidden" style={{ width: relatedPanelWidth }}>
              <RelatedOutfitsPanel
                cloth={selectedPanelCloth}
                outfits={outfits}
                panelWidth={relatedPanelWidth}
                onClose={() => setRelatedPanelOpen(false)}
                onSelectOutfit={handleSelectOutfit}
              />
            </div>
          </>
        )}

        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20">
          <button
            onClick={() => setRelatedPanelOpen(prev => !prev)}
            className="flex flex-col items-center gap-1 px-1.5 py-3 rounded-l-xl bg-white/70 backdrop-blur-sm border border-r-0 border-gray-200/50 shadow-sm hover:bg-white/90 hover:shadow-md transition-all duration-300 group"
            title={relatedPanelOpen ? '收起关联搭配' : '展开关联搭配'}
          >
            <svg
              className={`w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-transform duration-300 ${relatedPanelOpen ? 'rotate-0' : 'rotate-180'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-[10px] tracking-widest text-gray-400 group-hover:text-gray-600" style={{ writingMode: 'vertical-rl' }}>
              关联搭配
            </span>
          </button>
        </div>
      </div>

        </>
      )}

      {showToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-slide-in">
          <div className="glass-card gallery-shadow rounded-full px-6 py-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span className="text-sm tracking-wide text-gray-700">{toastMessage}</span>
          </div>
        </div>
      )}

      <SaveModal open={showSaveModal} onClose={() => { setShowSaveModal(false); setPendingSaveItems(null) }} onConfirm={handleConfirmSave} outfitCategories={outfitCategories} />

      {uploadProgress && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/10 backdrop-blur-[2px] transition-all duration-300">
          <div className="glass-card gallery-shadow rounded-2xl px-8 py-6 flex flex-col items-center gap-4 animate-fade-in">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-sm tracking-wider text-gray-600 font-medium">
              正在处理第 <span className="text-gray-800 font-semibold">{uploadProgress.current}</span> / <span className="text-gray-800 font-semibold">{uploadProgress.total}</span> 张图片…
            </p>
            <div className="w-48 h-1 bg-gray-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
