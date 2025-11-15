import { useMemo, useState } from 'react'
import { ImageData } from '../../../hooks/useImageSniffer'

export interface FlippingBookPair {
  id: string
  backgroundImage: ImageData
  svg: ImageData | null // SVG is now optional
  filename: string
  imagePath: string
  svgpath: string
  size: number
  width: number
  height: number
  mimeType: string
}

// Extract base filename without extension and path
function getBaseFilename(url: string): string {
  try {
    const urlObj = new URL(url)
    const filename = urlObj.pathname.split('/').pop() || ''
    // Remove extension
    return filename.replace(/\.[^/.]+$/, '')
  } catch {
    const filename = url.split('/').pop() || ''
    return filename.replace(/\.[^/.]+$/, '')
  }
}

// Extract FlippingBook page number from filename
function extractPageNumber(filename: string): string | null {
  // For SVG files: "0004.svg" -> "0004"
  // For image files: "page0004_3.jpg" -> "0004"

  // Match pattern like "0004" (4 digits)
  const directMatch = filename.match(/^(\d{4})$/)
  if (directMatch) {
    return directMatch[1] as string
  }

  // Match pattern like "page0004_3" -> extract "0004"
  const pageMatch = filename.match(/^page(\d{4})(?:_\d+)?$/)
  if (pageMatch) {
    return pageMatch[1] as string
  }

  return null
}

// Extract path from URL (excluding domain and filename)
function getPathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    // Remove empty string and filename (last part)
    return pathParts.slice(1, -1).join('/')
  } catch {
    return ''
  }
}

export function useCombiner(images: ImageData[]) {
  const [pagePattern, setPagePattern] = useState('page\\d{4}_5\\.jpg')
  const [removeDuplicates, setRemoveDuplicates] = useState(true)

  // First, create all pairs without deduplication
  const allFlippingBookPairs = useMemo(() => {
    // Create regex from pattern
    let pageRegex: RegExp
    try {
      pageRegex = new RegExp(pagePattern, 'i')
    } catch (error) {
      console.warn(
        '[FlippingBook] Invalid regex pattern, using default:',
        error,
      )
      pageRegex = /page\d{4}_5\.jpg/i
    }

    // Filter image files using the regex pattern
    const imageFiles = images.filter((img) => {
      const filename = img.url.split('/').pop() || ''
      return pageRegex.test(filename)
    })

    // Get all SVG files for potential matching
    const svgFiles = images.filter(
      (img) =>
        img.mimeType === 'image/svg+xml' ||
        img.url.toLowerCase().includes('.svg'),
    )

    const pairs: FlippingBookPair[] = []
    const usedSvgUrls = new Set<string>()

    // Pairing process starts

    // Create FlippingBook pairs for each matching image (SVG is optional)
    imageFiles.forEach((backgroundImg) => {
      const imgBasename = getBaseFilename(backgroundImg.url)
      const imgPath = getPathFromUrl(backgroundImg.url)
      const imgPageNumber = extractPageNumber(imgBasename)

      // Look for matching SVG file (optional)
      const matchingSvg = svgFiles.find((svg) => {
        if (usedSvgUrls.has(svg.url)) return false

        const svgBasename = getBaseFilename(svg.url)
        const svgPageNumber = extractPageNumber(svgBasename)

        // STRICT matching: Only match if both files have extractable page numbers AND they match
        if (imgPageNumber && svgPageNumber && imgPageNumber === svgPageNumber) {
          return true
        }

        // No fallback matching - we only pair files with matching page numbers
        return false
      })

      if (matchingSvg) {
        usedSvgUrls.add(matchingSvg.url)
      }

      const displayFilename = imgPageNumber
        ? `page${imgPageNumber}`
        : imgBasename

      const pair: FlippingBookPair = {
        id: `${displayFilename}-${imgPath}`,
        backgroundImage: backgroundImg,
        svg: matchingSvg || null,
        filename: displayFilename,
        imagePath: imgPath,
        svgpath: matchingSvg ? getPathFromUrl(matchingSvg.url) : '',
        size: backgroundImg.size + (matchingSvg?.size || 0),
        width: backgroundImg.width || 0,
        height: backgroundImg.height || 0,
        mimeType: matchingSvg
          ? 'flippingbook/combined'
          : 'flippingbook/image-only',
      }

      // Only add pairs with valid dimensions
      if (pair.width > 0 && pair.height > 0) {
        pairs.push(pair)
      } else {
        console.warn(
          `[FlippingBook] Skipping ${pair.filename} due to invalid dimensions: ${pair.width}x${pair.height}`,
        )
      }
    })

    return pairs
  }, [images, pagePattern])

  // Then, apply deduplication separately so it reacts to checkbox changes
  const flippingBookPairs = useMemo(() => {
    if (removeDuplicates) {
      const seenImagePaths = new Set<string>()
      const uniquePairs: FlippingBookPair[] = []

      for (const pair of allFlippingBookPairs) {
        // Use the full pathname (including filename) for deduplication, but without domain/query
        const fullPath = new URL(pair.backgroundImage.url).pathname
        if (!seenImagePaths.has(fullPath)) {
          seenImagePaths.add(fullPath)
          uniquePairs.push(pair)
        }
      }

      return uniquePairs
    }

    return allFlippingBookPairs
  }, [allFlippingBookPairs, removeDuplicates])

  return {
    flippingBookPairs,
    pagePattern,
    setPagePattern,
    removeDuplicates,
    setRemoveDuplicates,
  }
}
