import localforage from 'localforage'

localforage.config({
  name: 'MyWardrobe',
  version: 1.0,
  storeName: 'wardrobe',
  description: '存储个人虚拟衣橱数据',
})

const CLOTHES_KEY = 'wardrobe_clothes'
const OUTFITS_KEY = 'wardrobe_outfits'
const CLOTH_CATEGORIES_KEY = 'wardrobe_cloth_categories'
const OUTFIT_CATEGORIES_KEY = 'wardrobe_outfit_categories'
const LOGISTICS_KEY = 'wardrobe_logistics_items'

const DEFAULT_CLOTH_CATEGORIES = ['全部', '上装', '下装', '外套', '鞋子', '配饰']
const DEFAULT_OUTFIT_CATEGORIES = ['全部', '春季', '夏季', '秋季', '冬季', '其他']

export async function saveClothes(clothes) {
  await localforage.setItem(CLOTHES_KEY, clothes)
}

export async function getClothes() {
  const clothes = await localforage.getItem(CLOTHES_KEY)
  return clothes || []
}

export async function saveOutfits(outfits) {
  await localforage.setItem(OUTFITS_KEY, outfits)
}

export async function getOutfits() {
  const outfits = await localforage.getItem(OUTFITS_KEY)
  return outfits || []
}

export async function saveClothCategories(categories) {
  await localforage.setItem(CLOTH_CATEGORIES_KEY, categories)
}

export async function getClothCategories() {
  const cats = await localforage.getItem(CLOTH_CATEGORIES_KEY)
  if (cats && Array.isArray(cats) && cats.length > 0) return cats
  return [...DEFAULT_CLOTH_CATEGORIES]
}

export async function saveOutfitCategories(categories) {
  await localforage.setItem(OUTFIT_CATEGORIES_KEY, categories)
}

export async function getOutfitCategories() {
  const cats = await localforage.getItem(OUTFIT_CATEGORIES_KEY)
  if (cats && Array.isArray(cats) && cats.length > 0) return cats
  return [...DEFAULT_OUTFIT_CATEGORIES]
}

export async function saveLogisticsItems(items) {
  await localforage.setItem(LOGISTICS_KEY, items)
}

export async function getLogisticsItems() {
  const items = await localforage.getItem(LOGISTICS_KEY)
  return items || []
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
