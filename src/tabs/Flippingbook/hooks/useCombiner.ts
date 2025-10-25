import { useMemo, useState } from 'react'
import { ImageData } from '../../../hooks/useImageSniffer'

export interface FlippingBookPair {
  id: string
  webp: ImageData
  svg: ImageData | null // SVG is now optional
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
  const [pagePattern, setPagePattern] = useState('page\\d{4}.*\\.webp')

  const flippingBookPairs = useMemo(() => {
    // Create regex from pattern
    let pageRegex: RegExp
    try {
      pageRegex = new RegExp(pagePattern, 'i')
    } catch (error) {
      console.warn(
        '[FlippingBook] Invalid regex pattern, using default:',
        error
      )
      pageRegex = /page\d{4}.*\.webp/i
    }

    // Filter WebP files using the regex pattern
    const webpFiles = images.filter((img) => {
      if (img.mimeType !== 'image/webp') return false
      const filename = img.url.split('/').pop() || ''
      return pageRegex.test(filename)
    })

    // Get all SVG files for potential matching
    const svgFiles = images.filter(
      (img) =>
        img.mimeType === 'image/svg+xml' ||
        img.url.toLowerCase().includes('.svg')
    )

    const pairs: FlippingBookPair[] = []
    const usedSvgUrls = new Set<string>()

    console.log(`[FlippingBook] Starting pairing process:`)
    console.log(`  Found ${webpFiles.length} WebP files matching pattern`)
    console.log(`  Found ${svgFiles.length} SVG files available`)

    // Log available SVG files for debugging
    svgFiles.forEach((svg) => {
      const svgBasename = getBaseFilename(svg.url)
      const svgPageNumber = extractPageNumber(svgBasename)
      console.log(
        `  SVG available: ${svgBasename} (page ${
          svgPageNumber || 'no-page-number'
        })`
      )
    })

    // Create FlippingBook pairs for each matching WebP (SVG is optional)
    webpFiles.forEach((webp) => {
      const webpBasename = getBaseFilename(webp.url)
      const webpPath = getPathFromUrl(webp.url)
      const webpPageNumber = extractPageNumber(webpBasename)

      // Look for matching SVG file (optional)
      const matchingSvg = svgFiles.find((svg) => {
        if (usedSvgUrls.has(svg.url)) return false

        const svgBasename = getBaseFilename(svg.url)
        const svgPageNumber = extractPageNumber(svgBasename)

        // STRICT matching: Only match if both files have extractable page numbers AND they match
        if (
          webpPageNumber &&
          svgPageNumber &&
          webpPageNumber === svgPageNumber
        ) {
          return true
        }

        // No fallback matching - we only pair files with matching page numbers
        return false
      })

      if (matchingSvg) {
        usedSvgUrls.add(matchingSvg.url)
        const svgBasename = getBaseFilename(matchingSvg.url)
        const svgPageNumber = extractPageNumber(svgBasename)
        console.log(`[FlippingBook] ✓ PAIRED:`)
        console.log(`  WebP: ${webpBasename} (page ${webpPageNumber})`)
        console.log(`  SVG:  ${svgBasename} (page ${svgPageNumber})`)
      } else {
        console.log(
          `[FlippingBook] ○ SOLO WebP: ${webpBasename} (page ${
            webpPageNumber || 'no-page-number'
          }) - no matching SVG found`
        )
      }

      const displayFilename = webpPageNumber
        ? `page${webpPageNumber}`
        : webpBasename

      const pair: FlippingBookPair = {
        id: `${displayFilename}-${webpPath}`,
        webp,
        svg: matchingSvg || null,
        filename: displayFilename,
        webppath: webpPath,
        svgpath: matchingSvg ? getPathFromUrl(matchingSvg.url) : '',
        size: webp.size + (matchingSvg?.size || 0),
        width: webp.width,
        height: webp.height,
        mimeType: matchingSvg
          ? 'flippingbook/combined'
          : 'flippingbook/webp-only',
      }

      pairs.push(pair)
    })

    return pairs
  }, [images, pagePattern])

  return { flippingBookPairs, pagePattern, setPagePattern }
}
