import jsPDF from 'jspdf'
import { FlippingBookPair } from '../hooks/useCombiner'

/**
 * Safely loads an image with CORS handling
 */
async function loadImageSafely(
  src: string,
  description: string
): Promise<HTMLImageElement> {
  const img = new Image()

  // Try different CORS settings
  const corsSettings = ['anonymous', 'use-credentials', '']

  for (const corsMode of corsSettings) {
    try {
      if (corsMode) {
        img.crossOrigin = corsMode
      }

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Timeout loading ${description}`))
        }, 10000)

        img.onload = () => {
          clearTimeout(timeout)
          resolve()
        }

        img.onerror = () => {
          clearTimeout(timeout)
          reject(new Error(`Failed to load ${description}`))
        }

        img.src = src
      })

      return img
    } catch (error) {
      console.warn(
        `Failed to load ${description} with CORS mode "${corsMode}":`,
        error
      )
      if (corsMode === '') {
        // Last attempt failed
        throw error
      }
    }
  }

  throw new Error(`Failed to load ${description} with all CORS modes`)
}

/**
 * Adds a new page to an existing jsPDF document by combining a WebP background image
 * and an SVG overlay using canvas rendering.
 */
export async function createNewPage(
  pdf: jsPDF,
  flippingBook: FlippingBookPair
): Promise<void> {
  // Original image dimensions in pixels
  const originalWidth = flippingBook.width
  const originalHeight = flippingBook.height

  // Calculate PDF page dimensions (fit within A4 landscape: 297x210mm = ~842x595 points at 72 DPI)
  const maxPdfWidth = 800 // points
  const maxPdfHeight = 600 // points

  // Calculate scaling to fit within max dimensions while maintaining aspect ratio
  const scaleX = maxPdfWidth / originalWidth
  const scaleY = maxPdfHeight / originalHeight
  const scale = Math.min(scaleX, scaleY)

  // Final PDF dimensions
  const pdfWidth = originalWidth * scale
  const pdfHeight = originalHeight * scale

  // High-resolution canvas for better quality (2x pixel density)
  const canvasScale = 2
  const canvasWidth = originalWidth * canvasScale
  const canvasHeight = originalHeight * canvasScale

  // Add a new page with the calculated PDF dimensions
  pdf.addPage([pdfWidth, pdfHeight])

  // Create high-resolution canvas for rendering
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas 2D context')
  }

  // Scale context for high-resolution rendering
  ctx.scale(canvasScale, canvasScale)

  // Clear canvas with white background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, originalWidth, originalHeight)

  // Load and draw WebP background
  const webpSrc = flippingBook.webp.base64
    ? `data:${flippingBook.webp.mimeType};base64,${flippingBook.webp.base64}`
    : flippingBook.webp.url

  const webpImg = await loadImageSafely(webpSrc, 'WebP background')
  ctx.drawImage(webpImg, 0, 0, originalWidth, originalHeight)

  // Load and draw SVG overlay if present
  if (flippingBook.svg) {
    try {
      let svgSrc: string
      if (flippingBook.svg.base64) {
        // Check if the "base64" field actually contains raw SVG text
        if (flippingBook.svg.base64.trim().startsWith('<svg')) {
          // Raw SVG content - encode it properly
          const encodedSvg = btoa(flippingBook.svg.base64)
          svgSrc = `data:${flippingBook.svg.mimeType};base64,${encodedSvg}`
        } else {
          // Actual base64 content
          svgSrc = `data:${flippingBook.svg.mimeType};base64,${flippingBook.svg.base64}`
        }
      } else {
        svgSrc = flippingBook.svg.url
      }

      const svgImg = await loadImageSafely(svgSrc, 'SVG overlay')
      ctx.drawImage(svgImg, 0, 0, originalWidth, originalHeight)
    } catch (error) {
      console.warn(
        'Failed to load SVG overlay, proceeding with WebP-only:',
        error
      )
    }
  }

  // Convert canvas to blob and add to PDF at the calculated dimensions
  const canvasDataUrl = canvas.toDataURL('image/jpeg', 0.8)
  pdf.addImage(canvasDataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight)
}
