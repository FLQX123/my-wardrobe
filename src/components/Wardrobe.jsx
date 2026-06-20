import { useState, useRef, useEffect, useCallback } from 'react'
import { useTouchDevice } from '../hooks/useTouchDevice'
import ImageMatteModal from './ImageMatteModal'

const categoryIcons = {
  '全部': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>),
  '上装': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6l6-3 6 3v2a6 6 0 01-12 0V6zM8 8v2a4 4 0 008 0V8" /></svg>),
  '下装': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4h10M9 4v16l3 2 3-2V4" /></svg>),
  '外套': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 4h12a2 2 0 012 2v1l-4 3v8a2 2 0 01-2 2h-4a2 2 0 01-2-2v-8L4 7V6a2 2 0 012-2z" /></svg>),
  '鞋子': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 14h2l1 6h3l1-10h4l2 6h3l1-2h2M5 10V8a4 4 0 014-4h6a4 4 0 014 4v2" /></svg>),
  '配饰': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h2a2 2 0 012 2v1a2 2 0 01-2 2h-2v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4H5a2 2 0 01-2-2V9a2 2 0 012-2h2V5.73A2 2 0 0110 4a2 2 0 012-2z" /></svg>),
}

const seasonIcons = {
  '全部': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>),
  '春季': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c-4 0-8 3.5-8 8 0 5 3 9 8 11 5-2 8-6 8-11 0-4.5-4-8-8-8zM12 8v1M12 14h.01" /></svg>),
  '夏季': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" strokeWidth={1.5} /><path strokeLinecap="round" strokeWidth={1.5} d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>),
  '秋季': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v6M10 4h4M8 14c0-2 2-3 4-3s4 1 4 3a4 4 0 01-8 0zM4 22l4-8M20 22l-4-8M12 14v8" /></svg>),
  '冬季': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v6M6 4l2 4M18 4l-2 4M12 8l-3 5h6l-3-5zM12 13v9M12 17l-4 2M12 17l4 2" /></svg>),
  '其他': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>),
}

export default function Wardrobe({
  clothes, logisticsItems = [], outfits, activeTab, onTabChange,
  onSelectCloth, onAddClothes, onBatchAddClothes, onUploadProgress,
  onSelectOutfit, onCloneOutfit, onDeleteOutfit,
  onUpdateClothCategory, onUpdateOutfit, onDeleteCloth,
  onBatchDeleteClothes, onBatchDeleteOutfits,
  clothCategories, outfitCategories,
  onAddClothCategory, onRenameClothCategory, onDeleteClothCategory,
  onAddOutfitCategory, onRenameOutfitCategory, onDeleteOutfitCategory,
  onUpdateOutfitShootStatus, onUpdateClothLogistics, onAddLogisticsItems, onDeleteLogisticsItem,
  onAddRealPhoto, onDeleteRealPhoto,
  tabPosition = 'top', isPortraitMode = false, hideTabBar = false,
}) {
  const [activeCategory, setActiveCategory] = useState('全部')
  const [activeOutfitCategory, setActiveOutfitCategory] = useState('全部')
  const [contextMenuId, setContextMenuId] = useState(null)
  const [outfitContextMenuId, setOutfitContextMenuId] = useState(null)
  const [lightboxOutfit, setLightboxOutfit] = useState(null) // { outfit, photoIndex }
  const realPhotoInputRef = useRef(null)
  const [addingRealPhotoFor, setAddingRealPhotoFor] = useState(null) // outfit id
  const [carouselPages, setCarouselPages] = useState({}) // { [outfitId]: currentPageIndex }
  const [editingOutfitId, setEditingOutfitId] = useState(null)
  const [editName, setEditName] = useState('')
  const fileInputRef = useRef(null)
  const editInputRef = useRef(null)
  const outfitClickTimerRef = useRef(null)

  const isTouchDevice = useTouchDevice()
  const [longPressedId, setLongPressedId] = useState(null)
  const longPressedIdRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const longPressStartPosRef = useRef(null)

  // Keep ref in sync for use in touch handlers (avoids stale closure)
  useEffect(() => { longPressedIdRef.current = longPressedId }, [longPressedId])

  const handleCardTouchStart = useCallback((e, cardId) => {
    if (!isTouchDevice) return
    // If menu is open for a different card, dismiss it (tapping elsewhere)
    if (longPressedIdRef.current && longPressedIdRef.current !== cardId) {
      setLongPressedId(null)
    }
    longPressTimerRef.current = setTimeout(() => {
      setLongPressedId(prev => prev === cardId ? null : cardId)
    }, 500)
    const touch = e.touches ? e.touches[0] : null
    if (touch) longPressStartPosRef.current = { x: touch.clientX, y: touch.clientY }
  }, [isTouchDevice])

  const handleCardTouchMove = useCallback((e) => {
    if (!longPressStartPosRef.current) return
    const touch = e.touches ? e.touches[0] : null
    if (!touch) return
    if (Math.abs(touch.clientX - longPressStartPosRef.current.x) > 10 || Math.abs(touch.clientY - longPressStartPosRef.current.y) > 10) {
      clearTimeout(longPressTimerRef.current)
      longPressStartPosRef.current = null
    }
  }, [])

  const handleCardTouchEnd = useCallback(() => {
    clearTimeout(longPressTimerRef.current)
    longPressStartPosRef.current = null
  }, [])

  const dismissLongPress = useCallback(() => {
    setLongPressedId(null)
  }, [])

  // Auto-dismiss long-press menu after 5 seconds
  useEffect(() => {
    if (!longPressedId) return
    const timer = setTimeout(() => setLongPressedId(null), 5000)
    return () => clearTimeout(timer)
  }, [longPressedId])

  const [isManageMode, setIsManageMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState([])
  const [isOutfitManageMode, setIsOutfitManageMode] = useState(false)
  const [selectedOutfits, setSelectedOutfits] = useState([])
  const [isLogisticsManageMode, setIsLogisticsManageMode] = useState(false)
  const [selectedLogistics, setSelectedLogistics] = useState([])
  const [isShootingManageMode, setIsShootingManageMode] = useState(false)
  const [selectedShootingOutfits, setSelectedShootingOutfits] = useState([])

  const [editingClothCat, setEditingClothCat] = useState(null)
  const [editingClothCatName, setEditingClothCatName] = useState('')
  const [editingOutfitCat, setEditingOutfitCat] = useState(null)
  const [editingOutfitCatName, setEditingOutfitCatName] = useState('')
  const [isAddingClothCat, setIsAddingClothCat] = useState(false)
  const [isAddingOutfitCat, setIsAddingOutfitCat] = useState(false)
  const [newClothCatName, setNewClothCatName] = useState('')
  const [newOutfitCatName, setNewOutfitCatName] = useState('')
  const clothCatAddRef = useRef(null)
  const outfitCatAddRef = useRef(null)
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null)
  const [confirmLeaving, setConfirmLeaving] = useState(false)

  const [shootFilter, setShootFilter] = useState('全部')
  const shotOutfitIds = useRef(new Set())

  // Budget — read from localStorage, default 1000
  const [budget, setBudget] = useState(() => {
    try {
      const saved = localStorage.getItem('wardrobe_budget')
      const n = saved ? parseInt(saved, 10) : null
      return (n && n > 0) ? n : 1000
    } catch { return 1000 }
  })
  const [editingBudget, setEditingBudget] = useState(false)
  const [editingBudgetValue, setEditingBudgetValue] = useState('')
  const budgetInputRef = useRef(null)

  useEffect(() => {
    if (editingBudget && budgetInputRef.current) {
      budgetInputRef.current.focus()
      budgetInputRef.current.select()
    }
  }, [editingBudget])

  const startEditBudget = () => {
    setEditingBudgetValue(String(budget))
    setEditingBudget(true)
  }

  const commitEditBudget = () => {
    const n = parseInt(editingBudgetValue, 10)
    if (n && n > 0) {
      setBudget(n)
      try { localStorage.setItem('wardrobe_budget', String(n)) } catch {}
    }
    setEditingBudget(false)
  }

  const handleBudgetKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEditBudget() }
    if (e.key === 'Escape') { setEditingBudget(false) }
  }

  const [logisticsFilter, setLogisticsFilter] = useState('全部')
const [logisticsSortOrder, setLogisticsSortOrder] = useState('desc')
const [cropperOpen, setCropperOpen] = useState(false)
const [cropperDataUrl, setCropperDataUrl] = useState('')
const [cropperFileName, setCropperFileName] = useState('')
const [cropperIndex, setCropperIndex] = useState(0)
const [cropperTotal, setCropperTotal] = useState(0)
const cropperResolveRef = useRef(null)
const [editingUrlId, setEditingUrlId] = useState(null)
const [editingUrlValue, setEditingUrlValue] = useState('')
const [dragOverStatus, setDragOverStatus] = useState(null)
const [draggedClothId, setDraggedClothId] = useState(null)
const [showImportModal, setShowImportModal] = useState(false)
const [importSelectedIds, setImportSelectedIds] = useState([])
const [importSearch, setImportSearch] = useState('')
const [importAnimatingIds, setImportAnimatingIds] = useState([])
const [logisticsToast, setLogisticsToast] = useState('')
const [showImportNames, setShowImportNames] = useState(false)

const showToast = (msg) => {
  setLogisticsToast(msg)
  setTimeout(() => setLogisticsToast(''), 2000)
}

  const TAB_NAMES_KEY = 'wardrobe_tab_names'
  const DEFAULT_TAB_NAMES = { wardrobe: '我的单品', outfits: '搭配手册', shooting: '拍摄看板', logistics: '物流管理' }

  const loadTabNames = () => {
    try {
      const saved = localStorage.getItem(TAB_NAMES_KEY)
      if (saved) return { ...DEFAULT_TAB_NAMES, ...JSON.parse(saved) }
    } catch {}
    return { ...DEFAULT_TAB_NAMES }
  }

  const [tabNames, setTabNames] = useState(loadTabNames)
  const [editingTabKey, setEditingTabKey] = useState(null)
  const [editingTabName, setEditingTabName] = useState('')
  const tabEditRef = useRef(null)

  const saveTabNames = (names) => {
    try { localStorage.setItem(TAB_NAMES_KEY, JSON.stringify(names)) } catch {}
  }

  const startEditTabName = (tabKey) => {
    setEditingTabKey(tabKey)
    setEditingTabName(tabNames[tabKey] || DEFAULT_TAB_NAMES[tabKey])
  }

  const commitEditTabName = () => {
    if (editingTabKey && editingTabName.trim()) {
      const newNames = { ...tabNames, [editingTabKey]: editingTabName.trim() }
      setTabNames(newNames)
      saveTabNames(newNames)
    }
    setEditingTabKey(null)
    setEditingTabName('')
  }

  const handleTabNameKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEditTabName() }
    if (e.key === 'Escape') { setEditingTabKey(null); setEditingTabName('') }
  }

  useEffect(() => {
    if (editingTabKey && tabEditRef.current) {
      tabEditRef.current.focus()
      tabEditRef.current.select()
    }
  }, [editingTabKey])

  const LOGISTICS_LABELS_KEY = 'wardrobe_logistics_labels'
  const DEFAULT_LOGISTICS_LABELS = {
    '待买': '待买',
    '已购买': '已购',
    '已到货（待拍摄）': '已到',
    '已拍摄（待退货）': '已拍',
    '已退货': '在退',
    '已退款': '已退',
  }

  const loadLogisticsLabels = () => {
    try {
      const saved = localStorage.getItem(LOGISTICS_LABELS_KEY)
      if (saved) return { ...DEFAULT_LOGISTICS_LABELS, ...JSON.parse(saved) }
    } catch {}
    return { ...DEFAULT_LOGISTICS_LABELS }
  }

  const saveLogisticsLabels = (labels) => {
    try { localStorage.setItem(LOGISTICS_LABELS_KEY, JSON.stringify(labels)) } catch {}
  }

  const [logisticsLabels, setLogisticsLabels] = useState(loadLogisticsLabels)
  const [editingLogisticsStatus, setEditingLogisticsStatus] = useState(null)
  const [editingLogisticsLabel, setEditingLogisticsLabel] = useState('')
  const logisticsLabelEditRef = useRef(null)

  const startEditLogisticsLabel = (status) => {
    setEditingLogisticsStatus(status)
    setEditingLogisticsLabel(logisticsLabels[status] || DEFAULT_LOGISTICS_LABELS[status] || status)
  }

  const commitEditLogisticsLabel = () => {
    if (editingLogisticsStatus && editingLogisticsLabel.trim()) {
      const newLabels = { ...logisticsLabels, [editingLogisticsStatus]: editingLogisticsLabel.trim() }
      setLogisticsLabels(newLabels)
      saveLogisticsLabels(newLabels)
    }
    setEditingLogisticsStatus(null)
    setEditingLogisticsLabel('')
  }

  const handleLogisticsLabelKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEditLogisticsLabel() }
    if (e.key === 'Escape') { setEditingLogisticsStatus(null); setEditingLogisticsLabel('') }
  }

  useEffect(() => {
    if (editingLogisticsStatus && logisticsLabelEditRef.current) {
      logisticsLabelEditRef.current.focus()
      logisticsLabelEditRef.current.select()
    }
  }, [editingLogisticsStatus])

  const filteredClothes = activeCategory === '全部'
    ? clothes
    : clothes.filter((cloth) => cloth.category === activeCategory)

  const filteredOutfits = activeOutfitCategory === '全部'
    ? outfits
    : outfits.filter((o) => o.season === activeOutfitCategory)

  useEffect(() => {
    if (editingOutfitId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingOutfitId])

  useEffect(() => {
    if (isAddingClothCat && clothCatAddRef.current) { clothCatAddRef.current.focus() }
  }, [isAddingClothCat])

  useEffect(() => {
    if (isAddingOutfitCat && outfitCatAddRef.current) { outfitCatAddRef.current.focus() }
  }, [isAddingOutfitCat])

  const getDefaultClothCategory = () => {
    const realCats = clothCategories.filter(c => c !== '全部')
    return realCats.length > 0 ? realCats[0] : ''
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) { e.target.value = ''; return }

    const targetCategory = activeCategory === '全部' ? getDefaultClothCategory() : activeCategory

    // Read all files first
    const fileData = []
    for (const file of files) {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      fileData.push({ dataUrl, name: file.name })
    }

    // Process each file through the cropper modal
    const results = []
    for (let i = 0; i < fileData.length; i++) {
      const { dataUrl, name } = fileData[i]
      const processedUrl = await new Promise((resolve) => {
        cropperResolveRef.current = resolve
        setCropperDataUrl(dataUrl)
        setCropperFileName(name)
        setCropperIndex(i)
        setCropperTotal(fileData.length)
        setCropperOpen(true)
      })
      results.push({ dataUrl: processedUrl, name })
    }

    const newClothes = results.map(({ dataUrl, name }, index) => ({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2) + index,
      name,
      category: targetCategory,
      image: dataUrl,
      price: 0,
      link: '',
      logisticsStatus: '待买',
      createdAt: new Date().toISOString(),
    }))

    if (onBatchAddClothes) {
      onBatchAddClothes(newClothes)
    } else if (onAddClothes) {
      newClothes.forEach(c => onAddClothes(c))
    }

    e.target.value = ''
  }

  const handleCropperConfirm = useCallback((processedDataUrl) => {
    setCropperOpen(false)
    if (cropperResolveRef.current) {
      cropperResolveRef.current(processedDataUrl)
      cropperResolveRef.current = null
    }
  }, [])

  const handleCropperSkip = useCallback(() => {
    setCropperOpen(false)
    if (cropperResolveRef.current) {
      cropperResolveRef.current(cropperDataUrl)
      cropperResolveRef.current = null
    }
  }, [cropperDataUrl])

  const handleCategoryMenu = (e, clothId) => {
    e.stopPropagation()
    setContextMenuId(contextMenuId === clothId ? null : clothId)
  }

  const handleChangeCategory = (e, clothId, newCategory) => {
    e.stopPropagation()
    if (onUpdateClothCategory) onUpdateClothCategory(clothId, newCategory)
    setContextMenuId(null)
  }

  const handleOutfitSeasonMenu = (e, outfitId) => {
    e.stopPropagation()
    setOutfitContextMenuId(outfitContextMenuId === outfitId ? null : outfitId)
  }

  const handleChangeOutfitSeason = (e, outfitId, newSeason) => {
    e.stopPropagation()
    if (onUpdateOutfit) onUpdateOutfit(outfitId, { season: newSeason })
    setOutfitContextMenuId(null)
  }

  const startEditOutfitName = (e, outfit) => {
    e.stopPropagation()
    setEditingOutfitId(outfit.id)
    setEditName(outfit.name)
  }

  const commitEditOutfitName = () => {
    if (editingOutfitId && editName.trim() && onUpdateOutfit) {
      onUpdateOutfit(editingOutfitId, { name: editName.trim() })
    }
    setEditingOutfitId(null)
    setEditName('')
  }

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEditOutfitName() }
    if (e.key === 'Escape') { setEditingOutfitId(null); setEditName('') }
  }

  const handleToggleManage = () => {
    if (isManageMode) { setIsManageMode(false); setSelectedItems([]) }
    else setIsManageMode(true)
  }

  const handleToggleSelectItem = (e, clothId) => {
    if (e && e.stopPropagation) e.stopPropagation()
    setSelectedItems(prev =>
      prev.includes(clothId) ? prev.filter(id => id !== clothId) : [...prev, clothId]
    )
  }

  const handleBatchDelete = () => {
    if (selectedItems.length === 0) return
    if (onBatchDeleteClothes) onBatchDeleteClothes(selectedItems)
    setSelectedItems([])
    setIsManageMode(false)
  }

  const handleToggleOutfitManage = () => {
    if (isOutfitManageMode) { setIsOutfitManageMode(false); setSelectedOutfits([]) }
    else setIsOutfitManageMode(true)
  }

  const handleToggleSelectOutfit = (e, outfitId) => {
    if (e && e.stopPropagation) e.stopPropagation()
    setSelectedOutfits(prev =>
      prev.includes(outfitId) ? prev.filter(id => id !== outfitId) : [...prev, outfitId]
    )
  }

  const handleBatchDeleteOutfits = () => {
    if (selectedOutfits.length === 0) return
    if (onBatchDeleteOutfits) onBatchDeleteOutfits(selectedOutfits)
    setSelectedOutfits([])
    setIsOutfitManageMode(false)
  }

  const handleToggleLogisticsManage = () => {
    if (isLogisticsManageMode) { setIsLogisticsManageMode(false); setSelectedLogistics([]) }
    else setIsLogisticsManageMode(true)
  }

  const handleToggleSelectLogistics = (e, clothId) => {
    if (e && e.stopPropagation) e.stopPropagation()
    setSelectedLogistics(prev =>
      prev.includes(clothId) ? prev.filter(id => id !== clothId) : [...prev, clothId]
    )
  }

  const handleBatchDeleteLogistics = () => {
    if (selectedLogistics.length === 0) return
    if (onBatchDeleteClothes) onBatchDeleteClothes(selectedLogistics)
    setSelectedLogistics([])
    setIsLogisticsManageMode(false)
  }

  const handleToggleShootingManage = () => {
    if (isShootingManageMode) { setIsShootingManageMode(false); setSelectedShootingOutfits([]) }
    else setIsShootingManageMode(true)
  }

  const handleToggleSelectShooting = (e, outfitId) => {
    if (e && e.stopPropagation) e.stopPropagation()
    setSelectedShootingOutfits(prev =>
      prev.includes(outfitId) ? prev.filter(id => id !== outfitId) : [...prev, outfitId]
    )
  }

  const handleBatchDeleteShooting = () => {
    if (selectedShootingOutfits.length === 0) return
    if (onBatchDeleteOutfits) onBatchDeleteOutfits(selectedShootingOutfits)
    setSelectedShootingOutfits([])
    setIsShootingManageMode(false)
  }

  const startEditClothCat = (cat) => {
    setEditingClothCat(cat)
    setEditingClothCatName(cat)
  }

  const commitEditClothCat = (newName) => {
    if (editingClothCat && newName && newName.trim() && newName.trim() !== editingClothCat) {
      if (onRenameClothCategory) onRenameClothCategory(editingClothCat, newName.trim())
      if (activeCategory === editingClothCat) setActiveCategory(newName.trim())
    }
    setEditingClothCat(null)
    setEditingClothCatName('')
  }

  const handleClothCatKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEditClothCat(e.target.value) }
    if (e.key === 'Escape') { setEditingClothCat(null); setEditingClothCatName('') }
  }

  const startAddClothCat = () => {
    setIsAddingClothCat(true)
    setNewClothCatName('')
  }

  const commitAddClothCat = () => {
    if (newClothCatName.trim() && onAddClothCategory) {
      onAddClothCategory(newClothCatName.trim())
      setActiveCategory(newClothCatName.trim())
    }
    setIsAddingClothCat(false)
    setNewClothCatName('')
  }

  const handleNewClothCatKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitAddClothCat() }
    if (e.key === 'Escape') { setIsAddingClothCat(false); setNewClothCatName('') }
  }

  const startEditOutfitCat = (cat) => {
    setEditingOutfitCat(cat)
    setEditingOutfitCatName(cat)
  }

  const commitEditOutfitCat = (newName) => {
    if (editingOutfitCat && newName && newName.trim() && newName.trim() !== editingOutfitCat) {
      if (onRenameOutfitCategory) onRenameOutfitCategory(editingOutfitCat, newName.trim())
      if (activeOutfitCategory === editingOutfitCat) setActiveOutfitCategory(newName.trim())
    }
    setEditingOutfitCat(null)
    setEditingOutfitCatName('')
  }

  const handleOutfitCatKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEditOutfitCat(e.target.value) }
    if (e.key === 'Escape') { setEditingOutfitCat(null); setEditingOutfitCatName('') }
  }

  const startAddOutfitCat = () => {
    setIsAddingOutfitCat(true)
    setNewOutfitCatName('')
  }

  const commitAddOutfitCat = () => {
    if (newOutfitCatName.trim() && onAddOutfitCategory) {
      onAddOutfitCategory(newOutfitCatName.trim())
      setActiveOutfitCategory(newOutfitCatName.trim())
    }
    setIsAddingOutfitCat(false)
    setNewOutfitCatName('')
  }

  const handleNewOutfitCatKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitAddOutfitCat() }
    if (e.key === 'Escape') { setIsAddingOutfitCat(false); setNewOutfitCatName('') }
  }

  const requestDeleteCat = (name, type) => {
    setConfirmDeleteCat({ name, type })
    setConfirmLeaving(false)
  }

  const handleConfirmDeleteCat = () => {
    if (!confirmDeleteCat) return
    const { name, type } = confirmDeleteCat
    setConfirmLeaving(true)
    setTimeout(() => {
      if (type === 'cloth' && onDeleteClothCategory) onDeleteClothCategory(name)
      if (type === 'outfit' && onDeleteOutfitCategory) onDeleteOutfitCategory(name)
      setConfirmDeleteCat(null)
      setConfirmLeaving(false)
    }, 200)
  }

  const closeConfirmDialog = () => {
    setConfirmLeaving(true)
    setTimeout(() => {
      setConfirmDeleteCat(null)
      setConfirmLeaving(false)
    }, 200)
  }

  const categoryCounts = {}
  clothes.forEach((c) => { categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1 })
  const totalCount = clothes.length

  const seasonCounts = {}
  outfits.forEach((o) => { const s = o.season || ''; if (s) seasonCounts[s] = (seasonCounts[s] || 0) + 1 })
  const totalOutfitCount = outfits.length

  const unshotOutfits = outfits.filter(o => o.shootStatus !== '已拍摄')
  const shotOutfits = outfits.filter(o => o.shootStatus === '已拍摄')
  const filteredShotOutfits = shootFilter === '全部'
    ? unshotOutfits
    : unshotOutfits.filter(o => (o.season || '') === shootFilter)

  const logisticsStatuses = ['待买', '已购买', '已到货（待拍摄）', '已拍摄（待退货）', '已退货', '已退款']
  const logisticsStatusBgColors = {
    '待买': '#F8F9FA',
    '已购买': '#F0F9FF',
    '已到货（待拍摄）': '#FAF5FF',
    '已拍摄（待退货）': '#FFF7ED',
    '已退货': '#FFF5F5',
    '已退款': '#F0FDF4',
  }
  const logisticsFilteredClothes = (() => {
    let items = logisticsFilter === '全部'
      ? logisticsItems.filter(c => c.logisticsStatus)
      : logisticsItems.filter(c => c.logisticsStatus === logisticsFilter)
    return logisticsSortOrder === 'desc' ? [...items].reverse() : items
  })()

  const spentAmount = logisticsItems.reduce((sum, c) => {
    const status = c.logisticsStatus || '待买'
    if (['已购买', '已到货（待拍摄）', '已拍摄（待退货）', '已退货'].includes(status) || (status === '待买' && c.price)) {
      return sum + (Number(c.price) || 0)
    }
    return sum
  }, 0)
  const remaining = budget - spentAmount

  const handleMarkShot = (outfitId) => {
    shotOutfitIds.current.add(outfitId)
    setTimeout(() => {
      if (onUpdateOutfitShootStatus) onUpdateOutfitShootStatus(outfitId, '已拍摄')
      shotOutfitIds.current.delete(outfitId)
    }, 300)
  }

  const handleUnmarkShot = (outfitId) => {
    if (onUpdateOutfitShootStatus) onUpdateOutfitShootStatus(outfitId, '未拍摄')
  }

  const handleSelectOutfitFromShooting = (outfit) => {
    onSelectOutfit(outfit)
  }

  const handleOutfitClick = (outfit) => {
    if (outfitClickTimerRef.current) {
      clearTimeout(outfitClickTimerRef.current)
      outfitClickTimerRef.current = null
      return
    }
    outfitClickTimerRef.current = setTimeout(() => {
      outfitClickTimerRef.current = null
      onSelectOutfit(outfit)
    }, 300)
  }

  const handleOutfitDoubleClick = (outfit) => {
    if (outfitClickTimerRef.current) {
      clearTimeout(outfitClickTimerRef.current)
      outfitClickTimerRef.current = null
    }
    onCloneOutfit(outfit)
  }

  const handleRealPhotoFileChange = (e) => {
    const file = e.target.files?.[0]
    const outfitId = addingRealPhotoFor
    if (!file || !outfitId || !onAddRealPhoto) return
    const reader = new FileReader()
    reader.onload = () => {
      onAddRealPhoto(outfitId, reader.result)
      setAddingRealPhotoFor(null)
    }
    reader.readAsDataURL(file)
    // Reset so same file can be selected again
    e.target.value = ''
  }

  const startEditUrl = (cloth) => {
    setEditingUrlId(cloth.id)
    setEditingUrlValue(cloth.link || '')
  }

  const saveEditUrl = (clothId) => {
    if (onUpdateClothLogistics) {
      onUpdateClothLogistics(clothId, { link: editingUrlValue.trim() })
    }
    setEditingUrlId(null)
    setEditingUrlValue('')
  }

  const cancelEditUrl = () => {
    setEditingUrlId(null)
    setEditingUrlValue('')
  }

  const handleUrlKeyDown = (e, clothId) => {
    if (e.key === 'Enter') { e.preventDefault(); saveEditUrl(clothId) }
    if (e.key === 'Escape') { cancelEditUrl() }
  }

  const handlePriceChange = (clothId, priceStr) => {
    if (onUpdateClothLogistics) {
      onUpdateClothLogistics(clothId, { price: parseFloat(priceStr) || 0 })
    }
  }

  const handleChangeLogisticsStatus = (clothId, status) => {
    if (onUpdateClothLogistics) onUpdateClothLogistics(clothId, { logisticsStatus: status })
  }

  const handleDragStart = (e, clothId) => {
    setDraggedClothId(clothId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', clothId)
  }

  const handleDragEnd = () => {
    setDraggedClothId(null)
    setDragOverStatus(null)
  }

  const handleSidebarDragOver = (e, status) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStatus(status)
  }

  const handleSidebarDragLeave = () => {
    setDragOverStatus(null)
  }

  const handleSidebarDrop = (e, targetStatus) => {
    e.preventDefault()
    const clothId = e.dataTransfer.getData('text/plain') || draggedClothId
    if (clothId && onUpdateClothLogistics) {
      setImportAnimatingIds(prev => [...prev, clothId])
      setTimeout(() => {
        onUpdateClothLogistics(clothId, { logisticsStatus: targetStatus })
        setImportAnimatingIds(prev => prev.filter(id => id !== clothId))
      }, 250)
    }
    setDragOverStatus(null)
    setDraggedClothId(null)
  }

  const handleImportConfirm = () => {
    if (importSelectedIds.length === 0) return
    const itemsToImport = clothes.filter(c => importSelectedIds.includes(c.id))
    const newLogisticsItems = itemsToImport.map((item, index) => ({
      ...item,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2) + index,
      logisticsStatus: '待买',
      price: item.price || 0,
      link: item.link || '',
    }))
    if (onAddLogisticsItems) onAddLogisticsItems(newLogisticsItems)
    setShowImportModal(false)
    setImportSelectedIds([])
    setImportSearch('')
    showToast(`已导入 ${newLogisticsItems.length} 件单品到物流管理`)
  }

  const toggleImportSelect = (clothId) => {
    setImportSelectedIds(prev =>
      prev.includes(clothId) ? prev.filter(id => id !== clothId) : [...prev, clothId]
    )
  }

  const importModalClothes = importSearch
    ? clothes.filter(c => c.name && c.name.includes(importSearch))
    : clothes.filter(c => c.image && c.name)

  const renderSidebar = ({
    items, active, onSelect, icons, counts, total,
    editingId, editingName, onStartEdit, onCommitEdit, onKeyDown, onRequestDelete,
    isAdding, newName, onStartAdd, onCommitAdd, onAddKeyDown, onAddNameChange,
  }) => (
    <div className="w-[80px] shrink-0 border-r border-gray-200/30 flex flex-col items-center py-4 gap-1 overflow-y-auto subtle-scroll">
      {items.map((item) => (
        <div key={item} className="w-full relative group">
          {editingId === item ? (
            <div className="w-full flex flex-col items-center gap-1 py-2 px-1">
              <div className="w-8 h-8 rounded-full bg-gray-100/60 flex items-center justify-center">
                {icons[item] || icons['全部']}
              </div>
              <input
                 type="text"
                 defaultValue={editingName}
                 onKeyDown={onKeyDown}
                 onBlur={(e) => onCommitEdit(e.target.value)}
                 className="w-full text-center text-[10px] tracking-wide bg-white/80 border border-gray-200/50 rounded-md px-1 py-0.5 outline-none focus:border-gray-400/50"
              />
            </div>
          ) : (
            <button
              onClick={() => onSelect(item)}
              className={`w-full flex flex-col items-center gap-1 py-3 transition-all duration-200 relative ${active === item ? 'text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
              onDoubleClick={() => item !== '全部' && onStartEdit && onStartEdit(item)}
            >
              {active === item && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gray-500 rounded-full" />}
              {icons[item] || icons['全部']}
              <span className="text-[11px] tracking-wider font-medium">{item}</span>
              <span className="text-[10px] text-gray-300 font-light">
                {item === '全部' ? total : (counts[item] || 0)}
              </span>
            </button>
          )}
          {item !== '全部' && editingId !== item && onRequestDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onRequestDelete(item) }}
              className="absolute top-0 right-0 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-300 hover:text-red-400 hover:bg-red-50/60 flex items-center justify-center"
              title="删除分类"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      ))}
      {isAdding ? (
        <div className="w-full flex flex-col items-center gap-1 py-2 px-1">
          <div className="w-8 h-8 rounded-full bg-gray-100/60 flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
          </div>
          <input
            ref={onAddNameChange ? clothCatAddRef : outfitCatAddRef}
            type="text"
            value={newName}
            onChange={(e) => onAddNameChange && onAddNameChange(e.target.value)}
            onKeyDown={onAddKeyDown}
            onBlur={onCommitAdd}
            placeholder="分类名"
            className="w-full text-center text-[10px] tracking-wide bg-white/80 border border-gray-300/60 rounded-md px-1 py-0.5 outline-none focus:border-gray-400/50 placeholder:text-gray-300"
          />
        </div>
      ) : (
        <button
          onClick={onStartAdd}
          className="w-full flex flex-col items-center gap-1 py-2.5 transition-all duration-200 text-gray-300 hover:text-gray-500"
          title="添加分类"
        >
          <span className="w-8 h-8 rounded-full bg-gray-50/80 hover:bg-gray-100/60 flex items-center justify-center transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
          </span>
          <span className="text-[10px] tracking-wider">添加</span>
        </button>
      )}
    </div>
  )

  const renderTab = (tabKey, onClick, badge) => {
    const isActive = activeTab === tabKey
    const isEditing = editingTabKey === tabKey
    const displayName = tabNames[tabKey] || DEFAULT_TAB_NAMES[tabKey]

    return (
      <div key={tabKey} className="flex-1 relative">
        {isEditing ? (
          <div className="flex items-center justify-center py-4 px-2">
            <input
              ref={tabEditRef}
              type="text"
              value={editingTabName}
              onChange={(e) => setEditingTabName(e.target.value)}
              onKeyDown={handleTabNameKeyDown}
              onBlur={commitEditTabName}
              className="w-full text-center text-xs tracking-widest bg-white/80 border border-gray-300/60 rounded-md px-1 py-0.5 outline-none focus:border-gray-400/50"
            />
          </div>
        ) : (
          <button
            onClick={onClick}
            onDoubleClick={(e) => { e.preventDefault(); startEditTabName(tabKey) }}
            className={`w-full py-4 text-xs tracking-widest transition-all duration-300 relative ${isActive ? 'text-gray-800 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {displayName}
            {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gray-500 rounded-full" />}
            {badge}
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className={(isPortraitMode || tabPosition === 'bottom') ? 'h-full flex flex-col' : 'h-full flex flex-col glass-card gallery-shadow rounded-3xl ml-4 mr-1 mt-4 mb-4 overflow-hidden'}>
      {!hideTabBar && tabPosition !== 'bottom' && (
      <div className="flex border-b border-gray-200/40 shrink-0">
        {renderTab('wardrobe', () => { onTabChange('wardrobe'); setEditingOutfitId(null); setIsManageMode(false); setSelectedItems([]) })}
        {renderTab('outfits', () => { onTabChange('outfits'); setEditingOutfitId(null); setOutfitContextMenuId(null); setIsOutfitManageMode(false); setSelectedOutfits([]) })}
        {renderTab('shooting', () => { onTabChange('shooting'); setEditingOutfitId(null); setOutfitContextMenuId(null) })}
        {renderTab('logistics', () => { onTabChange('logistics'); setEditingOutfitId(null) })}
      </div>
      )}
      {activeTab === 'wardrobe' && (
        <div className="flex-1 flex min-h-0">
          {!isPortraitMode && renderSidebar({
            items: clothCategories, active: activeCategory,
            onSelect: (cat) => { setActiveCategory(cat); setContextMenuId(null) },
            icons: categoryIcons, counts: categoryCounts, total: totalCount,
            editingId: editingClothCat, editingName: editingClothCatName,
            onStartEdit: startEditClothCat, onCommitEdit: commitEditClothCat,
            onKeyDown: handleClothCatKeyDown, onRequestDelete: onDeleteClothCategory ? (cat) => requestDeleteCat(cat, 'cloth') : null,
            isAdding: isAddingClothCat, newName: newClothCatName,
            onStartAdd: startAddClothCat, onCommitAdd: commitAddClothCat,
            onAddKeyDown: handleNewClothCatKeyDown, onAddNameChange: setNewClothCatName,
          })}

          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />

          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-4 py-3 border-b border-gray-200/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs tracking-widest uppercase text-gray-400 font-medium">{activeCategory}</h2>
                <span className="text-[11px] text-gray-300">{activeCategory === '全部' ? `${totalCount} 件` : `${categoryCounts[activeCategory] || 0} 件`}</span>
              </div>
              <div className="flex items-center gap-2">
                {isManageMode ? (
                  <>
                    {selectedItems.length > 0 && (
                      <button onClick={handleBatchDelete} className="px-3 py-1.5 rounded-lg text-xs tracking-wide text-red-500 hover:bg-red-50/50 transition-all duration-200 font-medium">
                        删除 ({selectedItems.length})
                      </button>
                    )}
                    <button onClick={handleToggleManage} className="px-3 py-1.5 rounded-lg text-xs tracking-wide text-gray-500 hover:bg-gray-100/50 hover:text-gray-700 transition-all duration-200">
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleToggleManage} onTouchStart={(e) => e.stopPropagation()} className="px-2.5 py-1.5 rounded-lg text-[11px] tracking-wide text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-all duration-200">
                      管理
                    </button>
                    {activeCategory === '全部' ? (
                      <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-lg hover:bg-gray-100/50 transition-all duration-200 text-gray-400 hover:text-gray-600" title="导入图片">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                      </button>
                    ) : (
                      <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 rounded-lg text-[11px] tracking-wide text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 transition-all duration-200 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        <span>导入</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {isPortraitMode && (
              <div className="flex gap-1 overflow-x-auto px-3 py-2 flex-shrink-0 subtle-scroll items-center">
                {clothCategories.map(cat => (
                  editingClothCat === cat ? (
                    <input
                      key={cat}
                      type="text"
                      defaultValue={editingClothCatName}
                      onKeyDown={handleClothCatKeyDown}
                      onBlur={(e) => commitEditClothCat(e.target.value)}
                      className="h-7 w-[70px] rounded-full text-[11px] tracking-wide bg-white/80 border border-gray-300/60 px-2.5 outline-none focus:border-gray-400/50 flex-shrink-0"
                      autoFocus
                    />
                  ) : (
                    <button key={cat}
                      onClick={() => setActiveCategory(cat)}
                      onDoubleClick={cat !== '全部' ? (e) => { e.preventDefault(); startEditClothCat(cat) } : undefined}
                      className={`px-3 py-1 rounded-full text-[11px] tracking-wide whitespace-nowrap transition-colors flex-shrink-0 ${activeCategory === cat ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {cat}
                    </button>
                  )
                ))}
                {isAddingClothCat ? (
                  <input
                    ref={clothCatAddRef}
                    type="text"
                    value={newClothCatName}
                    onChange={(e) => setNewClothCatName(e.target.value)}
                    onKeyDown={handleNewClothCatKeyDown}
                    onBlur={commitAddClothCat}
                    placeholder="分类名"
                    className="h-7 w-[70px] rounded-full text-[11px] tracking-wide bg-white/80 border border-gray-300/60 px-2.5 outline-none focus:border-gray-400/50 placeholder:text-gray-300 flex-shrink-0"
                  />
                ) : (
                  <button
                    onClick={startAddClothCat}
                    className="w-7 h-7 rounded-full border border-dashed border-gray-300 text-gray-400 hover:text-gray-500 hover:border-gray-400 flex items-center justify-center flex-shrink-0 transition-colors"
                    title="添加分类"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                  </button>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 subtle-scroll">
              {filteredClothes.length > 0 || activeCategory !== '全部' ? (
                <div className={isPortraitMode ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-2 gap-2.5'}>
                  {filteredClothes.map((cloth) => {
                    const isItemSelected = selectedItems.includes(cloth.id)
                    return (
                    <div key={cloth.id} className={`relative ${isTouchDevice ? '' : 'group'}`}
                      onTouchStart={(e) => handleCardTouchStart(e, cloth.id)}
                      onTouchMove={handleCardTouchMove}
                      onTouchEnd={handleCardTouchEnd}>
                      <div
                        onClick={(e) => isManageMode ? (e.stopPropagation(), handleToggleSelectItem(e, cloth.id)) : onSelectCloth(cloth)}
                        className={`aspect-square bg-white/60 backdrop-blur-sm rounded-xl p-2 cursor-pointer transition-all duration-300 border ${isManageMode && isItemSelected ? 'hover:shadow-md ring-[2px] ring-gray-800/40 bg-white/40' : 'hover:shadow-md hover:scale-[1.02] border-white/50'}`}
                      >
                        {isManageMode && isItemSelected && (
                          <div className="absolute inset-0 bg-black/10 rounded-xl z-[2]" />
                        )}
                        <img src={cloth.image} alt={cloth.name} className="w-full h-full object-contain relative z-[1]" draggable={false} />
                      </div>

                      {isManageMode ? (
                        <button
                          onClick={(e) => handleToggleSelectItem(e, cloth.id)}
                          className={`absolute top-1.5 left-1.5 w-[22px] h-[22px] rounded-[5px] flex items-center justify-center z-10 transition-all duration-200 ${isItemSelected ? 'bg-gray-800 text-white' : 'bg-white/80 border-2 border-gray-300/60 text-transparent hover:border-gray-400'}`}
                        >
                          {isItemSelected && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          )}
                        </button>
                      ) : (
                        <>
                          <button onClick={(e) => handleCategoryMenu(e, cloth.id)} className={`absolute top-1 right-1 w-5 h-5 rounded-full bg-white/80 hover:bg-white shadow-sm flex items-center justify-center transition-all duration-200 text-gray-400 hover:text-gray-600 z-30 ${isTouchDevice ? (longPressedId === cloth.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none') : 'opacity-0 group-hover:opacity-100'}`} title="更改分类">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); if (onDeleteCloth) onDeleteCloth(cloth.id) }} className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white/80 hover:bg-red-400/80 shadow-sm flex items-center justify-center transition-all duration-200 text-gray-400 hover:text-white z-30 ${isTouchDevice ? (longPressedId === cloth.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none') : 'opacity-0 group-hover:opacity-100'}`} title="删除">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          {isTouchDevice && (
                            <button onClick={(e) => { e.stopPropagation(); setLongPressedId(prev => prev === cloth.id ? null : cloth.id) }}
                              className={`absolute bottom-1 right-1 w-6 h-6 rounded-full bg-white/90 shadow-sm flex items-center justify-center z-30 transition-all duration-200 text-gray-400 hover:text-gray-600 ${longPressedId === cloth.id ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`} title="更多操作">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                            </button>
                          )}
                        </>
                      )}

                      {!isManageMode && contextMenuId === cloth.id && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setContextMenuId(null)} />
                          <div className="absolute top-6 right-1 z-30 glass-card rounded-lg py-1 shadow-lg animate-fade-in min-w-[72px]">
                            {clothCategories.filter(c => c !== '全部').map((cat) => (
                              <button key={cat} onClick={(e) => handleChangeCategory(e, cloth.id, cat)} className={`w-full px-3 py-1.5 text-left text-[11px] tracking-wide transition-colors ${cloth.category === cat ? 'text-gray-800 bg-gray-50/50 font-medium' : 'text-gray-500 hover:bg-gray-50/30 hover:text-gray-700'}`}>{cat}</button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )})}
                </div>
              ) : activeCategory === '全部' ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-300">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    <p className="text-xs tracking-wider font-light">衣橱为空</p>
                    <p className="text-[11px] mt-1 opacity-50">点击 + 导入图片</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center h-full w-full group"
                >
                  <div className="text-center text-gray-300 group-hover:text-gray-400 transition-colors duration-200">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl border-2 border-dashed border-gray-200/60 group-hover:border-gray-300/60 flex items-center justify-center transition-all duration-200 group-hover:bg-gray-50/20">
                      <svg className="w-8 h-8 opacity-30 group-hover:opacity-50 transition-all duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <p className="text-xs tracking-wider font-light">「{activeCategory}」暂无单品</p>
                    <p className="text-[11px] mt-1.5 tracking-wide">点击此处导入到当前分类</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'outfits' && (
        <div className="flex-1 flex min-h-0">
          {!isPortraitMode && renderSidebar({
            items: outfitCategories, active: activeOutfitCategory,
            onSelect: (cat) => { setActiveOutfitCategory(cat); setEditingOutfitId(null); setOutfitContextMenuId(null) },
            icons: seasonIcons, counts: seasonCounts, total: totalOutfitCount,
            editingId: editingOutfitCat, editingName: editingOutfitCatName,
            onStartEdit: startEditOutfitCat, onCommitEdit: commitEditOutfitCat,
            onKeyDown: handleOutfitCatKeyDown, onRequestDelete: onDeleteOutfitCategory ? (cat) => requestDeleteCat(cat, 'outfit') : null,
            isAdding: isAddingOutfitCat, newName: newOutfitCatName,
            onStartAdd: startAddOutfitCat, onCommitAdd: commitAddOutfitCat,
            onAddKeyDown: handleNewOutfitCatKeyDown, onAddNameChange: setNewOutfitCatName,
          })}

          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-4 py-3 border-b border-gray-200/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs tracking-widest uppercase text-gray-400 font-medium">{activeOutfitCategory}</h2>
                <span className="text-[11px] text-gray-300">{activeOutfitCategory === '全部' ? `${totalOutfitCount} 套` : `${seasonCounts[activeOutfitCategory] || 0} 套`}</span>
              </div>
              <div className="flex items-center gap-2">
                {isOutfitManageMode ? (
                  <>
                    {selectedOutfits.length > 0 && (
                      <button onClick={handleBatchDeleteOutfits} className="px-3 py-1.5 rounded-lg text-xs tracking-wide text-red-500 hover:bg-red-50/50 transition-all duration-200 font-medium">
                        删除 ({selectedOutfits.length})
                      </button>
                    )}
                    <button onClick={handleToggleOutfitManage} className="px-3 py-1.5 rounded-lg text-xs tracking-wide text-gray-500 hover:bg-gray-100/50 hover:text-gray-700 transition-all duration-200">
                      取消
                    </button>
                  </>
                ) : (
                  <button onClick={handleToggleOutfitManage} onTouchStart={(e) => e.stopPropagation()} className="px-2.5 py-1.5 rounded-lg text-[11px] tracking-wide text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-all duration-200">
                    管理
                  </button>
                )}
              </div>
            </div>

            {isPortraitMode && (
              <div className="flex gap-1 overflow-x-auto px-3 py-2 flex-shrink-0 subtle-scroll items-center">
                {outfitCategories.map(cat => (
                  editingOutfitCat === cat ? (
                    <input
                      key={cat}
                      type="text"
                      defaultValue={editingOutfitCatName}
                      onKeyDown={handleOutfitCatKeyDown}
                      onBlur={(e) => commitEditOutfitCat(e.target.value)}
                      className="h-7 w-[70px] rounded-full text-[11px] tracking-wide bg-white/80 border border-gray-300/60 px-2.5 outline-none focus:border-gray-400/50 flex-shrink-0"
                      autoFocus
                    />
                  ) : (
                    <button key={cat}
                      onClick={() => setActiveOutfitCategory(cat)}
                      onDoubleClick={cat !== '全部' ? (e) => { e.preventDefault(); startEditOutfitCat(cat) } : undefined}
                      className={`px-3 py-1 rounded-full text-[11px] tracking-wide whitespace-nowrap transition-colors flex-shrink-0 ${activeOutfitCategory === cat ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {cat}
                    </button>
                  )
                ))}
                {isAddingOutfitCat ? (
                  <input
                    ref={outfitCatAddRef}
                    type="text"
                    value={newOutfitCatName}
                    onChange={(e) => setNewOutfitCatName(e.target.value)}
                    onKeyDown={handleNewOutfitCatKeyDown}
                    onBlur={commitAddOutfitCat}
                    placeholder="分类名"
                    className="h-7 w-[70px] rounded-full text-[11px] tracking-wide bg-white/80 border border-gray-300/60 px-2.5 outline-none focus:border-gray-400/50 placeholder:text-gray-300 flex-shrink-0"
                  />
                ) : (
                  <button
                    onClick={startAddOutfitCat}
                    className="w-7 h-7 rounded-full border border-dashed border-gray-300 text-gray-400 hover:text-gray-500 hover:border-gray-400 flex items-center justify-center flex-shrink-0 transition-colors"
                    title="添加分类"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                  </button>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 subtle-scroll">
              {filteredOutfits.length > 0 ? (
                <div className={isPortraitMode ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-2 gap-2.5'}>
                  {filteredOutfits.map((outfit) => {
                    const isOutfitSelected = selectedOutfits.includes(outfit.id)
                    return (
                      <div key={outfit.id} className={`relative animate-fade-in ${isTouchDevice ? '' : 'group'}`}
                        onTouchStart={(e) => handleCardTouchStart(e, outfit.id)}
                        onTouchMove={handleCardTouchMove}
                        onTouchEnd={handleCardTouchEnd}>
                      <div
                        onClick={(e) => isOutfitManageMode ? (e.stopPropagation(), handleToggleSelectOutfit(e, outfit.id)) : handleOutfitClick(outfit)}
                        onDoubleClick={() => !isOutfitManageMode && handleOutfitDoubleClick(outfit)}
                        className={`relative w-full bg-white/60 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer transition-transform duration-200 border ${isOutfitManageMode && isOutfitSelected ? 'hover:shadow-md ring-[2px] ring-gray-800/40 bg-white/40' : 'hover:shadow-md hover:scale-[1.02] border-white/50'}`}
                        style={{ paddingBottom: '100%' }}
                      >
                        {isOutfitManageMode && isOutfitSelected && (
                          <div className="absolute inset-0 bg-black/10 rounded-xl z-[2]" />
                        )}
                        {outfit.realPhotos?.length > 0 ? (
                          <>
                            {/* Scroll-snap carousel: real photos first, outfit screenshot last */}
                            <div
                              className="absolute inset-0 overflow-x-auto snap-x snap-mandatory flex rounded-xl"
                              onScroll={(e) => {
                                const container = e.currentTarget
                                const page = Math.round(container.scrollLeft / container.clientWidth)
                                setCarouselPages(prev => prev[outfit.id] === page ? prev : { ...prev, [outfit.id]: page })
                              }}
                            >
                              {outfit.realPhotos.map((photo, idx) => (
                                <div key={`rp-${idx}`} className="snap-start flex-shrink-0 w-full h-full">
                                  <img src={photo.dataUrl} alt={`实物照 ${idx + 1}`} className="w-full h-full object-cover" draggable={false} />
                                </div>
                              ))}
                              <div className="snap-start flex-shrink-0 w-full h-full">
                                <img src={outfit.screenshot} alt={outfit.name} className="w-full h-full object-contain" draggable={false} />
                              </div>
                            </div>
                            {/* Page dots indicator */}
                            {(() => {
                              const totalPages = outfit.realPhotos.length + 1
                              const currentPage = carouselPages[outfit.id] ?? 0
                              return (
                                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-[5] pointer-events-none">
                                  {Array.from({ length: totalPages }, (_, i) => (
                                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentPage ? 'bg-white' : 'bg-white/40'}`} />
                                  ))}
                                </div>
                              )
                            })()}
                          </>
                        ) : (
                          <img src={outfit.screenshot} alt={outfit.name} className="absolute inset-0 w-full h-full object-contain" draggable={false} />
                        )}
                      </div>

                      {isOutfitManageMode ? (
                        <button
                          onClick={(e) => handleToggleSelectOutfit(e, outfit.id)}
                          className={`absolute top-1.5 left-1.5 w-[22px] h-[22px] rounded-[5px] flex items-center justify-center z-10 transition-all duration-200 ${isOutfitSelected ? 'bg-gray-800 text-white' : 'bg-white/80 border-2 border-gray-300/60 text-transparent hover:border-gray-400'}`}
                        >
                          {isOutfitSelected && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          )}
                        </button>
                      ) : (
                        <>
                          <button onClick={(e) => handleOutfitSeasonMenu(e, outfit.id)} className={`absolute top-1 right-1 w-5 h-5 rounded-full bg-white/80 hover:bg-white shadow-sm flex items-center justify-center transition-all duration-200 text-gray-400 hover:text-gray-600 z-30 ${isTouchDevice ? (longPressedId === outfit.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none') : 'opacity-0 group-hover:opacity-100'}`} title="更改分类">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); onDeleteOutfit(outfit.id) }} className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-black/15 hover:bg-red-400/80 flex items-center justify-center text-[10px] text-white transition-all duration-200 z-30 ${isTouchDevice ? (longPressedId === outfit.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none') : 'opacity-0 group-hover:opacity-100'}`} title="删除">×</button>
                          {isTouchDevice && (
                            <button onClick={(e) => { e.stopPropagation(); setLongPressedId(prev => prev === outfit.id ? null : outfit.id) }}
                              className={`absolute bottom-1 right-1 w-6 h-6 rounded-full bg-white/90 shadow-sm flex items-center justify-center z-30 transition-all duration-200 text-gray-400 hover:text-gray-600 ${longPressedId === outfit.id ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`} title="更多操作">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                            </button>
                          )}
                          {/* Add real photo button — visible when long-press menu is open */}
                          {longPressedId === outfit.id && onAddRealPhoto && (
                            <button onClick={(e) => { e.stopPropagation(); setAddingRealPhotoFor(outfit.id); realPhotoInputRef.current?.click() }}
                              className="absolute bottom-9 right-1 w-6 h-6 rounded-full bg-white/90 shadow-sm flex items-center justify-center z-30 transition-all duration-200 text-blue-400 hover:text-blue-600" title="添加实物照">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v-3m0 0V9m0 3h3m-3 0H9" /></svg>
                            </button>
                          )}
                          {longPressedId === outfit.id && outfit.realPhotos?.length > 0 && onDeleteRealPhoto && (
                            <button onClick={(e) => { e.stopPropagation(); onDeleteRealPhoto(outfit.id, 0) }}
                              className="absolute bottom-16 right-1 w-6 h-6 rounded-full bg-red-50 shadow-sm flex items-center justify-center z-30 transition-all duration-200 text-red-400 hover:text-red-600" title="删除实物照">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </>
                      )}

                      {outfitContextMenuId === outfit.id && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setOutfitContextMenuId(null)} />
                          <div className="absolute top-6 right-1 z-30 glass-card rounded-lg py-1 shadow-lg animate-fade-in min-w-[64px]">
                            {outfitCategories.filter(c => c !== '全部').map((cat) => (
                              <button key={cat} onClick={(e) => handleChangeOutfitSeason(e, outfit.id, cat)} className={`w-full px-3 py-1.5 text-left text-[11px] tracking-wide transition-colors ${(outfit.season || '') === cat ? 'text-gray-800 bg-gray-50/50 font-medium' : 'text-gray-500 hover:bg-gray-50/30 hover:text-gray-700'}`}>{cat}</button>
                            ))}
                          </div>
                        </>
                      )}

                      {!isOutfitManageMode && (
                        <>
                        <div className="mt-1.5 px-0.5 flex items-center gap-1 min-w-0 hidden">
                          {editingOutfitId === outfit.id ? (
                            <input ref={editInputRef} type="text" value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={handleEditKeyDown} onBlur={commitEditOutfitName} className="flex-1 min-w-0 text-[11px] tracking-wide text-gray-700 bg-white/70 border border-gray-200/50 rounded-md px-1.5 py-0.5 outline-none focus:border-gray-400/50" />
                          ) : (
                            <>
                              <span className="flex-1 text-[11px] tracking-wide text-gray-600 truncate cursor-default" title={outfit.name}>{outfit.name}</span>
                              <button onClick={(e) => startEditOutfitName(e, outfit)} className={`w-4 h-4 rounded hover:bg-gray-100/60 flex items-center justify-center flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors z-30 ${isTouchDevice ? (longPressedId === outfit.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none') : 'opacity-0 group-hover:opacity-100'}`} title="重命名">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                            </>
                          )}
                        </div>
                        <div className="mt-1 px-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (onUpdateOutfitShootStatus) {
                                onUpdateOutfitShootStatus(outfit.id, outfit.shootStatus === '已拍摄' ? '未拍摄' : '已拍摄')
                              }
                            }}
                            className={`text-[9px] tracking-wider px-1.5 py-0.5 rounded-full transition-all duration-200 ${
                              outfit.shootStatus === '已拍摄'
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                            }`}
                            title="点击切换拍摄状态"
                          >
                            {outfit.shootStatus === '已拍摄' ? '已拍摄' : '未拍摄'}
                          </button>
                        </div>
                      </>)}

                      {outfit.palette && outfit.palette.length > 0 && (
                        <div className="mt-1 px-0.5 flex items-center">
                          {outfit.palette.map((hex, i) => (
                            <span key={i} className="inline-block rounded-full border border-gray-300/60 shadow-sm transition-transform duration-200 hover:scale-125 hover:z-10"
                              style={{ width: '13px', height: '13px', backgroundColor: hex, marginLeft: i > 0 ? '-3px' : '0' }} title={hex} />
                          ))}
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-300">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-xs tracking-wider font-light">暂无搭配方案</p>
                    <p className="text-[11px] mt-1 opacity-50">在画布中搭配后保存</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'shooting' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-gray-200/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs tracking-widest uppercase text-gray-400 font-medium">待拍摄</h2>
              <span className="text-[11px] text-gray-300">{filteredShotOutfits.length} 套</span>
            </div>
            <div className="flex items-center gap-2">
              {isShootingManageMode ? (
                <>
                  {selectedShootingOutfits.length > 0 && (
                    <button onClick={handleBatchDeleteShooting} className="px-3 py-1.5 rounded-lg text-xs tracking-wide text-red-500 hover:bg-red-50/50 transition-all duration-200 font-medium">
                      删除 ({selectedShootingOutfits.length})
                    </button>
                  )}
                  <button onClick={handleToggleShootingManage} className="px-3 py-1.5 rounded-lg text-xs tracking-wide text-gray-500 hover:bg-gray-100/50 hover:text-gray-700 transition-all duration-200">
                    取消
                  </button>
                </>
              ) : (
                <button onClick={handleToggleShootingManage} onTouchStart={(e) => e.stopPropagation()} className="px-2.5 py-1.5 rounded-lg text-[11px] tracking-wide text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-all duration-200">
                  管理
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 subtle-scroll">
            {filteredShotOutfits.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredShotOutfits.map((outfit) => {
                  const isShooting = shotOutfitIds.current.has(outfit.id)
                  const isSelected = selectedShootingOutfits.includes(outfit.id)
                  return (
                    <div key={outfit.id} className={`relative group transition-all duration-300 ${isShooting ? 'opacity-0 scale-90' : ''}`}>
                      <div
                        onClick={() => isShootingManageMode ? handleToggleSelectShooting(null, outfit.id) : handleSelectOutfitFromShooting(outfit)}
                        className={`aspect-square bg-white/60 backdrop-blur-sm rounded-xl overflow-hidden border cursor-pointer transition-all duration-300 ${isShootingManageMode && isSelected ? 'border-gray-800 ring-[2px] ring-gray-800/40 bg-white/40' : 'border-white/50 hover:shadow-lg hover:scale-[1.03]'}`}
                      >
                        {isShootingManageMode && isSelected && (
                          <div className="absolute inset-0 bg-black/10 rounded-xl z-[2]" />
                        )}
                        <img src={outfit.screenshot} alt={outfit.name} className="w-full h-full object-contain relative z-[1]" draggable={false} />
                      </div>
                      {isShootingManageMode ? (
                        <button
                          onClick={() => handleToggleSelectShooting(null, outfit.id)}
                          className={`absolute top-1.5 left-1.5 w-[22px] h-[22px] rounded-[5px] flex items-center justify-center z-10 transition-all duration-200 ${isSelected ? 'bg-gray-800 text-white' : 'bg-white/80 border-2 border-gray-300/60 text-transparent hover:border-gray-400'}`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          )}
                        </button>
                      ) : (
                        <div className="mt-1 flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMarkShot(outfit.id) }}
                            className="flex-1 py-1 rounded-lg text-[10px] tracking-wide bg-amber-400/20 text-amber-700 hover:bg-amber-400/40 transition-all duration-200"
                          >
                            <svg className="w-3 h-3 inline mr-0.5 -mt-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            完成拍摄
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-300">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  <p className="text-xs tracking-wider font-light">全部拍摄完成</p>
                  <p className="text-[11px] mt-1 opacity-50">没有待拍摄的方案了</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'logistics' && (
        <div className="flex-1 flex min-h-0">
          {!isPortraitMode && (
          <div className="w-[80px] shrink-0 border-r border-gray-200/30 flex flex-col items-center py-4 gap-1 overflow-y-auto subtle-scroll">
            <div
              onClick={() => setLogisticsFilter('全部')}
              onDragOver={(e) => handleSidebarDragOver(e, null)}
              onDragLeave={handleSidebarDragLeave}
              className={`w-full flex flex-col items-center gap-1 py-3 transition-all duration-200 relative cursor-pointer ${logisticsFilter === '全部' ? 'text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {logisticsFilter === '全部' && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gray-500 rounded-full" />}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" /></svg>
              <span className="text-[11px] tracking-wider font-medium">全部</span>
              <span className="text-[10px] text-gray-300 font-light">{logisticsItems.filter(c => c.logisticsStatus).length}</span>
            </div>
            {logisticsStatuses.map((status) => {
              const count = logisticsItems.filter(c => c.logisticsStatus === status).length
              const iconMap = {
                '待买': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>),
                '已购买': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>),
                '已到货（待拍摄）': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>),
                '已拍摄（待退货）': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>),
                '已退货': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>),
                '已退款': (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
              }
              const isDropZone = dragOverStatus === status
              return (
                <div key={status}
                  onClick={() => setLogisticsFilter(status)}
                  onDragOver={(e) => handleSidebarDragOver(e, status)}
                  onDragLeave={handleSidebarDragLeave}
                  onDrop={(e) => handleSidebarDrop(e, status)}
                  className={`w-full flex flex-col items-center gap-1 py-3 transition-all duration-200 relative cursor-pointer ${isDropZone ? 'bg-blue-50 text-blue-600 scale-105 rounded-lg' : logisticsFilter === status ? 'text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {logisticsFilter === status && !isDropZone && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gray-500 rounded-full" />}
                  {iconMap[status] || iconMap['待买']}
                  <div className="flex flex-col items-center gap-0">
                    {status.includes('（') ? (
                      <>
                        <span className="text-[11px] tracking-wider font-medium">{status.split('（')[0]}</span>
                        <span className="text-[9px] tracking-wider font-medium">（{status.split('（')[1]}</span>
                      </>
                    ) : (
                      <span className="text-[11px] tracking-wider font-medium">{status}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 font-light">{count}</span>
                </div>
              )
            })}
          </div>
          )}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-4 py-3 border-b border-gray-200/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-xs tracking-widest uppercase text-gray-400 font-medium whitespace-nowrap">
                  {isPortraitMode && logisticsFilter !== '全部' ? (logisticsLabels[logisticsFilter] || logisticsFilter) : logisticsFilter}
                </h2>
                <span className="text-[11px] text-gray-300 whitespace-nowrap">{logisticsFilteredClothes.length} 件</span>
                <span className="text-[11px] tracking-wide whitespace-nowrap">
                  <span className={`font-medium ${remaining < 0 ? 'text-red-500' : remaining < 200 ? 'text-amber-600' : 'text-gray-700'}`}>¥{remaining}</span>
                  {editingBudget ? (
                    <input
                      ref={budgetInputRef}
                      type="number"
                      value={editingBudgetValue}
                      onChange={(e) => setEditingBudgetValue(e.target.value)}
                      onKeyDown={handleBudgetKeyDown}
                      onBlur={commitEditBudget}
                      className="w-[60px] text-[11px] text-center bg-white/80 border border-gray-300/60 rounded-md px-1 py-0 outline-none focus:border-gray-400/50"
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => { e.preventDefault(); startEditBudget() }}
                      className="text-gray-300 cursor-default hover:bg-gray-100/60 rounded px-1 -mx-1 transition-colors"
                      title="双击修改预算"
                    >/¥{budget}</span>
                  )}
                </span>
                <button
                  onClick={() => setLogisticsSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${logisticsSortOrder === 'desc' ? 'bg-blue-50 text-blue-500' : 'bg-gray-100/60 text-gray-400 hover:text-gray-600'}`}
                  title={logisticsSortOrder === 'desc' ? '最新在上（点击切换）' : '最旧在上（点击切换）'}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {logisticsSortOrder === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    )}
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isLogisticsManageMode ? (
                  <>
                    {selectedLogistics.length > 0 && (
                      <button onClick={handleBatchDeleteLogistics} className="px-3 py-1.5 rounded-lg text-xs tracking-wide text-red-500 hover:bg-red-50/50 transition-all duration-200 font-medium">
                        删除 ({selectedLogistics.length})
                      </button>
                    )}
                    <button onClick={handleToggleLogisticsManage} className="px-3 py-1.5 rounded-lg text-xs tracking-wide text-gray-500 hover:bg-gray-100/50 hover:text-gray-700 transition-all duration-200">
                      取消
                    </button>
                  </>
                ) : (
                  <button onClick={handleToggleLogisticsManage} onTouchStart={(e) => e.stopPropagation()} className="px-2.5 py-1.5 rounded-lg text-[11px] tracking-wide text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-all duration-200">
                    管理
                  </button>
                )}
                <button
                  onClick={() => setShowImportModal(true)}
                  className={isPortraitMode
                    ? 'p-1.5 rounded-lg hover:bg-gray-100/50 transition-all duration-200 text-gray-400 hover:text-gray-600'
                    : 'flex items-center gap-1 text-[11px] tracking-wide text-gray-500 hover:text-gray-700 bg-white/60 hover:bg-white/80 border border-gray-200/40 rounded-lg px-2.5 py-1.5 transition-all duration-200'
                  }
                  title={isPortraitMode ? '从单品库导入' : undefined}
                >
                  <svg className={isPortraitMode ? 'w-4 h-4' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isPortraitMode ? 1.5 : 2} d="M12 4v16m8-8H4" /></svg>
                  {!isPortraitMode && <span>从单品库导入</span>}
                </button>
              </div>
            </div>

            {isPortraitMode && (
              <div className="flex gap-1 overflow-x-auto px-3 py-2 flex-shrink-0 subtle-scroll">
                <button
                  onClick={() => setLogisticsFilter('全部')}
                  className={`px-3 py-1 rounded-full text-[11px] tracking-wide whitespace-nowrap transition-colors flex-shrink-0 ${logisticsFilter === '全部' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  全部
                </button>
                {logisticsStatuses.map(status => {
                  const label = logisticsLabels[status] || status
                  const isEditing = editingLogisticsStatus === status
                  if (isEditing) {
                    return (
                      <input
                        key={status}
                        ref={logisticsLabelEditRef}
                        type="text"
                        value={editingLogisticsLabel}
                        onChange={(e) => setEditingLogisticsLabel(e.target.value)}
                        onKeyDown={handleLogisticsLabelKeyDown}
                        onBlur={commitEditLogisticsLabel}
                        className="px-3 py-1 rounded-full text-[11px] tracking-wide bg-white/80 border border-gray-300/60 outline-none focus:border-gray-400/50 flex-shrink-0 w-[60px] text-center"
                      />
                    )
                  }
                  return (
                    <button
                      key={status}
                      onClick={() => setLogisticsFilter(status)}
                      onDoubleClick={(e) => { e.preventDefault(); startEditLogisticsLabel(status) }}
                      className={`px-3 py-1 rounded-full text-[11px] tracking-wide whitespace-nowrap transition-colors flex-shrink-0 ${logisticsFilter === status ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 subtle-scroll">
              {logisticsFilteredClothes.length > 0 ? (
                <div className={isPortraitMode ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-2 gap-2.5'}>
                  {logisticsFilteredClothes.map((cloth) => {
                    const isAnimating = importAnimatingIds.includes(cloth.id)
                    const isLogisticsSelected = selectedLogistics.includes(cloth.id)
                    const canDrag = !isLogisticsManageMode && (logisticsFilter === '全部' || logisticsFilter === '待买')
                    return (
                      <div key={cloth.id}
                        draggable={canDrag}
                        onDragStart={canDrag ? (e) => handleDragStart(e, cloth.id) : undefined}
                        onDragEnd={handleDragEnd}
                        onTouchStart={canDrag ? undefined : (e) => handleCardTouchStart(e, cloth.id)}
                        onTouchMove={canDrag ? undefined : handleCardTouchMove}
                        onTouchEnd={canDrag ? undefined : handleCardTouchEnd}
                        onClick={isLogisticsManageMode ? (e) => handleToggleSelectLogistics(e, cloth.id) : undefined}
                        className={`relative ${isTouchDevice ? '' : 'group'} bg-white/60 backdrop-blur-sm rounded-xl border transition-all duration-300 overflow-hidden ${isAnimating ? 'opacity-0 scale-75' : ''} ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${isLogisticsManageMode ? (isLogisticsSelected ? 'border-gray-800 ring-[2px] ring-gray-800/40 bg-white/40 cursor-pointer' : 'border-white/50 hover:shadow-md cursor-pointer') : 'border-white/50 hover:shadow-md'}`}
                      >
                        {isLogisticsManageMode && (
                          <button
                            onClick={(e) => handleToggleSelectLogistics(e, cloth.id)}
                            className={`absolute top-1.5 left-1.5 w-[22px] h-[22px] rounded-[5px] flex items-center justify-center z-10 transition-all duration-200 ${isLogisticsSelected ? 'bg-gray-800 text-white' : 'bg-white/80 border-2 border-gray-300/60 text-transparent hover:border-gray-400'}`}
                          >
                            {isLogisticsSelected && (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            )}
                          </button>
                        )}
                        {isLogisticsManageMode && isLogisticsSelected && (
                          <div className="absolute inset-0 bg-black/10 rounded-xl z-[2]" />
                        )}
                        {!isLogisticsManageMode && onDeleteLogisticsItem && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteLogisticsItem(cloth.id) }}
                            className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/80 shadow-sm flex items-center justify-center transition-all duration-200 text-gray-400 z-30 ${isTouchDevice ? (longPressedId === cloth.id ? 'opacity-100 !bg-red-400/80 !text-white scale-110 pointer-events-auto' : 'opacity-50 pointer-events-none') : 'opacity-50 group-hover:opacity-100 group-hover:!bg-red-400/80 group-hover:!text-white group-hover:scale-110'}`}
                            title="删除"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                        <div className="aspect-square bg-white/40 flex items-center justify-center p-3">
                          <img src={cloth.image} alt={cloth.name} className="max-w-full max-h-full object-contain relative z-[1]" draggable={false} />
                        </div>
                        {!isLogisticsManageMode && (
                        <div className="px-3 pb-3 pt-0">
                          {/* Row 1: Price + Status */}
                          <div className="flex items-center gap-2 pt-2">
                            <div className="flex items-center gap-0.5 border-b border-gray-200 focus-within:border-gray-400 transition-colors flex-1 min-w-0">
                              <span className="text-xs text-gray-300">¥</span>
                              <input
                                type="number"
                                defaultValue={cloth.price || ''}
                                onBlur={(e) => handlePriceChange(cloth.id, e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                                placeholder="0"
                                className="w-full text-xs bg-transparent outline-none text-gray-600 placeholder-gray-300 pb-0.5"
                              />
                            </div>
                            <select
                              value={cloth.logisticsStatus || '待买'}
                              onChange={(e) => handleChangeLogisticsStatus(cloth.id, e.target.value)}
                              className="text-[11px] tracking-wide bg-transparent hover:bg-gray-50/40 pl-4 pr-1.5 py-1 outline-none appearance-none cursor-pointer text-gray-500 transition-colors flex-shrink-0 border-b border-gray-200"
                              style={{
                                backgroundColor: logisticsStatusBgColors[cloth.logisticsStatus] || logisticsStatusBgColors['待买'],
                                backgroundImage: `radial-gradient(circle at 6px center, ${logisticsStatusBgColors[cloth.logisticsStatus] || logisticsStatusBgColors['待买']} 3px, transparent 3px)`,
                                backgroundSize: '6px 6px',
                                backgroundRepeat: 'no-repeat'
                              }}
                            >
                              {logisticsStatuses.map(s => (
                                <option key={s} value={s} className="bg-white text-gray-600">{logisticsLabels[s] || s}</option>
                              ))}
                            </select>
                          </div>
                          {/* Row 2: Link */}
                          <div className="pt-2 mt-1 border-b border-gray-100/80">
                            {editingUrlId === cloth.id ? (
                              <input
                                type="text"
                                value={editingUrlValue}
                                onChange={(e) => setEditingUrlValue(e.target.value)}
                                onBlur={() => saveEditUrl(cloth.id)}
                                onKeyDown={(e) => handleUrlKeyDown(e, cloth.id)}
                                placeholder="粘贴链接..."
                                className="w-full text-[11px] bg-gray-50/50 rounded px-2 py-1 outline-none text-gray-600 placeholder-gray-300"
                                autoFocus
                              />
                            ) : (
                              <div
                                onClick={() => {
                                  if (cloth.link) {
                                    window.open(cloth.link, '_blank')
                                  } else {
                                    startEditUrl(cloth)
                                  }
                                }}
                                className="flex items-center gap-1.5 cursor-pointer py-1"
                              >
                                <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 17l9.2-9.2M17 17V7H7" /></svg>
                                {cloth.link ? (
                                  <span className="text-[11px] text-gray-500 truncate">{cloth.link}</span>
                                ) : (
                                  <span className="text-[11px] text-gray-300">添加购买链接</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-300">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                    <p className="text-xs tracking-wider font-light">该分类下暂无单品</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm" onClick={() => { setShowImportModal(false); setImportSelectedIds([]); setImportSearch('') }} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto glass-card gallery-shadow rounded-2xl p-5 w-[95vw] max-w-[520px] max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm tracking-wider font-medium text-gray-700">从单品库导入</h3>
                  <button
                    onClick={() => setShowImportNames(!showImportNames)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${showImportNames ? 'bg-blue-50 text-blue-500' : 'bg-gray-100/60 text-gray-400 hover:text-gray-600'}`}
                    title={showImportNames ? '隐藏名称' : '显示名称'}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showImportNames ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      )}
                    </svg>
                  </button>
                </div>
                <button
                  onClick={() => { setShowImportModal(false); setImportSelectedIds([]); setImportSearch('') }}
                  className="w-7 h-7 rounded-full hover:bg-gray-100/60 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  value={importSearch}
                  onChange={(e) => setImportSearch(e.target.value)}
                  placeholder="搜索单品名称..."
                  className="w-full text-[12px] bg-white/60 border border-gray-200/40 rounded-lg px-3 py-2 outline-none focus:border-gray-400/50 tracking-wide"
                />
              </div>
              <div className="flex-1 overflow-y-auto subtle-scroll mb-4 -mx-1 px-1">
                {importModalClothes.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {importModalClothes.map((cloth) => {
                      const isSelected = importSelectedIds.includes(cloth.id)
                      return (
                        <div key={cloth.id}
                          onClick={() => toggleImportSelect(cloth.id)}
                          className={`relative aspect-square bg-white/60 backdrop-blur-sm rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 ${isSelected ? 'border-blue-400 ring-1 ring-blue-400/30 shadow-md' : 'border-white/50 hover:shadow-sm'}`}
                        >
                          <div className="w-full h-full flex items-center justify-center p-2">
                            <img src={cloth.image} alt={cloth.name} className="max-w-full max-h-full object-contain" draggable={false} />
                          </div>
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                          )}
                          {showImportNames && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-1.5">
                              <span className="text-[9px] text-white truncate block">{cloth.name}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center text-gray-300">
                      <svg className="w-10 h-10 mx-auto mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="text-xs tracking-wider font-light">无匹配单品</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400 tracking-wide">
                  {importSelectedIds.length > 0 ? `已选 ${importSelectedIds.length} 件` : '点击图片选择要导入的单品'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowImportModal(false); setImportSelectedIds([]); setImportSearch('') }}
                    className="text-[11px] tracking-wide text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100/60 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleImportConfirm}
                    disabled={importSelectedIds.length === 0}
                    className={`text-[11px] tracking-wide px-4 py-1.5 rounded-lg transition-all duration-200 ${importSelectedIds.length > 0 ? 'bg-gray-700 text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                    确定导入
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {logisticsToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-fade-in-down">
          <div className="bg-gray-800/90 backdrop-blur-sm text-white text-[12px] tracking-wide px-4 py-2 rounded-full shadow-lg">
            {logisticsToast}
          </div>
        </div>
      )}

      {!hideTabBar && tabPosition === 'bottom' && (
        <div className="flex border-t border-gray-200/40 shrink-0">
          {renderTab('wardrobe', () => { onTabChange('wardrobe'); setEditingOutfitId(null); setIsManageMode(false); setSelectedItems([]) })}
          {renderTab('outfits', () => { onTabChange('outfits'); setEditingOutfitId(null); setOutfitContextMenuId(null); setIsOutfitManageMode(false); setSelectedOutfits([]) })}
          {renderTab('shooting', () => { onTabChange('shooting'); setEditingOutfitId(null); setOutfitContextMenuId(null) })}
          {renderTab('logistics', () => { onTabChange('logistics'); setEditingOutfitId(null) })}
        </div>
      )}
    </div>

    {/* Hidden file input for real photos — placed outside tab sections so it's always in the DOM */}
    <input ref={realPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleRealPhotoFileChange} />

    {confirmDeleteCat && (
      <>
        <div className={`fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm transition-opacity duration-200 ${confirmLeaving ? 'opacity-0' : 'opacity-100'}`} onClick={closeConfirmDialog} />
        <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none">
          <div className={`pointer-events-auto glass-card gallery-shadow rounded-2xl p-6 w-[300px] transition-all duration-200 ${confirmLeaving ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100'}`}>
            <h3 className="text-sm tracking-wider text-gray-700 font-medium mb-1">删除分类</h3>
            <p className="text-xs text-gray-400 tracking-wide mb-5 leading-relaxed">确定要删除分类「{confirmDeleteCat.name}」吗？<br/>该分类下的内容将退回「全部」。</p>
            <div className="flex gap-2">
              <button onClick={closeConfirmDialog} className="flex-1 py-2.5 rounded-xl text-xs tracking-wide text-gray-400 hover:text-gray-600 hover:bg-gray-50/50 transition-all duration-200">取消</button>
              <button onClick={handleConfirmDeleteCat} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs tracking-widest hover:bg-red-400 transition-all duration-200 shadow-sm">确认删除</button>
            </div>
          </div>
        </div>
      </>
    )}

    {/* Real photo lightbox */}
    {lightboxOutfit && (() => {
      const outfit = outfits.find(o => o.id === lightboxOutfit.outfitId)
      if (!outfit?.realPhotos?.length) { setLightboxOutfit(null); return null }
      const idx = Math.min(Math.max(0, lightboxOutfit.photoIndex), outfit.realPhotos.length - 1)
      const photo = outfit.realPhotos[idx]
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setLightboxOutfit(null)}>
          <button onClick={() => setLightboxOutfit(null)}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {outfit.realPhotos.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs tracking-wider">
              {idx + 1} / {outfit.realPhotos.length}
            </div>
          )}
          {idx > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setLightboxOutfit(prev => ({ ...prev, photoIndex: prev.photoIndex - 1 })) }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          {idx < outfit.realPhotos.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setLightboxOutfit(prev => ({ ...prev, photoIndex: prev.photoIndex + 1 })) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
          {onDeleteRealPhoto && (
            <button onClick={(e) => { e.stopPropagation(); onDeleteRealPhoto(outfit.id, idx); if (outfit.realPhotos.length <= 1) setLightboxOutfit(null); else if (idx >= outfit.realPhotos.length - 1) setLightboxOutfit(prev => ({ ...prev, photoIndex: idx - 1 })) }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white text-xs tracking-wider transition-colors">
              删除此照片
            </button>
          )}
          <img src={photo.dataUrl} alt="实物照" className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} />
        </div>
      )
    })()}

    <ImageMatteModal
      open={cropperOpen}
      imageDataUrl={cropperDataUrl}
      fileName={cropperFileName}
      index={cropperIndex}
      total={cropperTotal}
      onConfirm={handleCropperConfirm}
      onSkip={handleCropperSkip}
    />
    </>
  )
}
