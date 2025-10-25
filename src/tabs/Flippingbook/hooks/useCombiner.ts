import { useMemo } from 'react'
import { ImageData } from '../../../hooks/useImageSniffer'

export interface FlippingBookPair {
  id: string
  webp: ImageData
  svg: ImageData
  filename: string
  webppath: string
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
  // For WebP files: "page0004_3.webp" -> "0004"

  // Match pattern like "0004" (4 digits)
  const directMatch = filename.match(/^(\d{4})$/)
  if (directMatch) {
    return directMatch[1]
  }

  // Match pattern like "page0004_3" -> extract "0004"
  const pageMatch = filename.match(/^page(\d{4})(?:_\d+)?$/)
  if (pageMatch) {
    return pageMatch[1]
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
  const flippingBookPairs = useMemo(() => {
    // Separate WebP and SVG files
    const webpFiles = images.filter((img) => img.mimeType === 'image/webp')
    const svgFiles = images.filter(
      (img) =>
        img.mimeType === 'image/svg+xml' ||
        img.url.toLowerCase().includes('.svg')
    )

    const pairs: FlippingBookPair[] = []
    const usedSvgUrls = new Set<string>()

    // Try to match WebP files with SVG files
    webpFiles.forEach((webp) => {
      const webpBasename = getBaseFilename(webp.url)
      const webpPath = getPathFromUrl(webp.url)
      const webpPageNumber = extractPageNumber(webpBasename)

      // Look for matching SVG file
      const matchingSvg = svgFiles.find((svg) => {
        if (usedSvgUrls.has(svg.url)) return false

        const svgBasename = getBaseFilename(svg.url)
        const svgPageNumber = extractPageNumber(svgBasename)

        // Match by page number (extracted from both filenames)
        // This handles cases like:
        // SVG: "0004.svg" -> page number "0004"
        // WebP: "page0004_3.webp" -> page number "0004"
        if (
          webpPageNumber &&
          svgPageNumber &&
          webpPageNumber === svgPageNumber
        ) {
          console.log(`[FlippingBook] Found matching pair:`)
          console.log(`  WebP: ${webp.url} -> page ${webpPageNumber}`)
          console.log(`  SVG: ${svg.url} -> page ${svgPageNumber}`)
          return true
        }
        return false
      })

      if (matchingSvg) {
        usedSvgUrls.add(matchingSvg.url)

        const displayFilename = webpPageNumber
          ? `page${webpPageNumber}`
          : webpBasename

        const pair: FlippingBookPair = {
          id: `${displayFilename}-${webpPath}`,
          webp,
          svg: matchingSvg,
          filename: displayFilename,
          webppath: webpPath,
          svgpath: getPathFromUrl(matchingSvg.url),
          size: webp.size + matchingSvg.size,
          width: webp.width,
          height: webp.height,
          mimeType: 'flippingbook/combined',
        }

        pairs.push(pair)
      }
    })

    return pairs
  }, [images])

  return { flippingBookPairs }
}
