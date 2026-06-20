import { getPalette } from 'colorthief'

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

export function extractPalette(dataUrl, count = 4) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const palette = getPalette(img, count)
        const hexPalette = palette.map(([r, g, b]) => rgbToHex(r, g, b))
        resolve(hexPalette)
      } catch {
        resolve([])
      }
    }
    img.onerror = () => resolve([])
    img.src = dataUrl
  })
}
