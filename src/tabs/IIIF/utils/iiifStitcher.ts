import { IIIFImage, IIIFTile } from '../hooks/useIIIFDetector'

// Stitch IIIF tiles together into a single image
export async function stitchIIIFImage(iiifImage: IIIFImage): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create canvas with full dimensions
    const canvas = document.createElement('canvas')
    canvas.width = iiifImage.fullWidth
    canvas.height = iiifImage.fullHeight
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    // Filter tiles with data and sort by resolution (low-res first, high-res last)
    // This ensures high-res tiles are drawn on top of low-res ones
    const tilesWithData = iiifImage.tiles
      .filter((t) => t.imageData)
      .sort((a, b) => a.scaledWidth - b.scaledWidth)

    if (tilesWithData.length === 0) {
      reject(new Error('No image data available for tiles'))
      return
    }

    // Track loaded tiles
    let loadedCount = 0
    const totalTiles = tilesWithData.length

    // Draw each tile
    tilesWithData.forEach((tile: IIIFTile) => {
      const img = new Image()

      img.onload = () => {
        // Draw tile at its position
        ctx.drawImage(img, tile.x, tile.y, tile.width, tile.height)

        loadedCount++

        // When all tiles are loaded, convert to data URL
        if (loadedCount === totalTiles) {
          const dataUrl = canvas.toDataURL('image/png')
          resolve(dataUrl)
        }
      }

      img.onerror = () => {
        console.error('Failed to load tile:', tile.url)
        loadedCount++

        if (loadedCount === totalTiles) {
          // Still resolve even if some tiles failed
          const dataUrl = canvas.toDataURL('image/png')
          resolve(dataUrl)
        }
      }

      // Set image source
      const dataUrl = `data:${tile.imageData!.mimeType};base64,${tile.imageData!.base64}`
      img.src = dataUrl
    })
  })
}

// Download combined image
export function downloadIIIFImage(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
