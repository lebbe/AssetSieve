import { useEffect, useState, useMemo } from 'react'
import { NetworkRequest } from '../../../hooks/useRequestSniffing'
import { ImageData } from '../../../hooks/useImageSniffer'

export interface IIIFTile {
  url: string
  x: number
  y: number
  width: number
  height: number
  scaledWidth: number
  rotation: number
  quality: string
  imageData?: ImageData
}

export interface IIIFImage {
  baseUrl: string
  identifier: string
  fullWidth: number
  fullHeight: number
  tiles: IIIFTile[]
  combinedImage?: string // base64 data URL of combined image
}

// Parse IIIF Image API URL
// Format: {scheme}://{server}{/prefix}/{identifier}/{region}/{size}/{rotation}/{quality}.{format}
function parseIIIFUrl(url: string): IIIFTile | null {
  try {
    // Match IIIF Image API pattern
    const iiifPattern =
      /^(.+\/)([^/]+)\/([0-9]+,[0-9]+,[0-9]+,[0-9]+)\/([^/]+)\/([0-9]+)\/([^/.]+)\.(jpg|jpeg|png|webp|gif|tif|tiff)$/i

    const match = url.match(iiifPattern)
    if (!match) return null

    const region = match[3]
    const size = match[4]
    const rotation = parseInt(match[5]!)
    const quality = match[6]!

    // Parse region: x,y,width,height
    const regionParts = region!.split(',').map(Number)
    const x = regionParts[0]!
    const y = regionParts[1]!
    const width = regionParts[2]!
    const height = regionParts[3]!

    // Parse size to get scaled width (format can be "w,", "w,h", "pct:n", "!w,h", "^w,", "^w,h")
    let scaledWidth = width
    if (size!.includes(',')) {
      const sizeMatch = size!.match(/^!?(\^)?([0-9]+),/)
      if (sizeMatch) {
        scaledWidth = parseInt(sizeMatch[2]!)
      }
    } else if (size!.match(/^[0-9]+$/)) {
      scaledWidth = parseInt(size!)
    }

    return {
      url,
      x,
      y,
      width,
      height,
      scaledWidth,
      rotation,
      quality,
    }
  } catch (error) {
    console.error('Error parsing IIIF URL:', url, error)
    return null
  }
}

// Group tiles by base URL and identifier
function groupTilesByImage(tiles: IIIFTile[]): Map<string, IIIFTile[]> {
  const groups = new Map<string, IIIFTile[]>()

  tiles.forEach((tile) => {
    // Extract base URL (everything before the region parameter)
    const urlParts = tile.url.split('/')
    const baseUrl = urlParts.slice(0, -4).join('/')

    if (!groups.has(baseUrl)) {
      groups.set(baseUrl, [])
    }
    groups.get(baseUrl)!.push(tile)
  })

  return groups
}

// Calculate full image dimensions from tiles
function calculateImageDimensions(tiles: IIIFTile[]): {
  width: number
  height: number
} {
  let maxWidth = 0
  let maxHeight = 0

  tiles.forEach((tile) => {
    const rightEdge = tile.x + tile.width
    const bottomEdge = tile.y + tile.height

    if (rightEdge > maxWidth) maxWidth = rightEdge
    if (bottomEdge > maxHeight) maxHeight = bottomEdge
  })

  return { width: maxWidth, height: maxHeight }
}

// Find tiles with highest resolution for each base URL
function selectHighestResolution(
  groups: Map<string, IIIFTile[]>,
): Map<string, IIIFTile[]> {
  const result = new Map<string, IIIFTile[]>()

  groups.forEach((tiles, baseUrl) => {
    // Group by position (x,y) to find highest resolution for each position
    const byPosition = new Map<string, IIIFTile>()

    tiles.forEach((tile) => {
      const posKey = `${tile.x},${tile.y},${tile.width},${tile.height}`
      const existing = byPosition.get(posKey)

      // Keep tile with highest scaled width (best resolution)
      if (!existing || tile.scaledWidth > existing.scaledWidth) {
        byPosition.set(posKey, tile)
      }
    })

    result.set(baseUrl, Array.from(byPosition.values()))
  })

  return result
}

export function useIIIFDetector(
  requests: NetworkRequest[],
  images: ImageData[],
) {
  const [iiifImages, setIIIFImages] = useState<IIIFImage[]>([])

  // Detect IIIF tiles from requests
  const detectedTiles = useMemo(() => {
    const tiles: IIIFTile[] = []

    requests.forEach((request) => {
      const tile = parseIIIFUrl(request.url)
      if (tile) {
        // Try to find corresponding image data
        const imageData = images.find((img) => img.url === request.url)
        if (imageData) {
          tile.imageData = imageData
        }
        tiles.push(tile)
      }
    })

    return tiles
  }, [requests, images])

  // Group and process tiles
  useEffect(() => {
    if (detectedTiles.length === 0) {
      setIIIFImages([])
      return
    }

    const grouped = groupTilesByImage(detectedTiles)
    const highestRes = selectHighestResolution(grouped)

    const processedImages: IIIFImage[] = []

    highestRes.forEach((tiles, baseUrl) => {
      const dimensions = calculateImageDimensions(tiles)
      const urlParts = baseUrl.split('/')
      const identifier = urlParts[urlParts.length - 1] || 'unknown'

      processedImages.push({
        baseUrl,
        identifier,
        fullWidth: dimensions.width,
        fullHeight: dimensions.height,
        tiles: tiles.sort((a, b) => {
          // Sort by y first, then x (top to bottom, left to right)
          if (a.y !== b.y) return a.y - b.y
          return a.x - b.x
        }),
      })
    })

    setIIIFImages(processedImages)
  }, [detectedTiles])

  return { iiifImages, detectedTiles }
}
