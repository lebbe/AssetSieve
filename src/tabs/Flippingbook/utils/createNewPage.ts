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
async function createNewPage(
  pdf: jsPDF,
  flippingBook: FlippingBookPair
): Promise<void> {
  // Use the WebP dimensions for the page
  const width = flippingBook.width
  const height = flippingBook.height

  // Add a new page with the FlippingBook dimensions
  pdf.addPage([width, height])

  // Create canvas for rendering
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas 2D context')
  }

  // Clear canvas with white background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // Load and draw WebP background
  const webpSrc = flippingBook.webp.base64
    ? `data:${flippingBook.webp.mimeType};base64,${flippingBook.webp.base64}`
    : flippingBook.webp.url

  const webpImg = await loadImageSafely(webpSrc, 'WebP background')
  ctx.drawImage(webpImg, 0, 0, width, height)

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
      ctx.drawImage(svgImg, 0, 0, width, height)
    } catch (error) {
      console.warn(
        'Failed to load SVG overlay, proceeding with WebP-only:',
        error
      )
    }
  }

  // Convert canvas to blob and add to PDF
  const canvasDataUrl = canvas.toDataURL('image/png', 0.95)
  pdf.addImage(canvasDataUrl, 'PNG', 0, 0, width, height)
}

export async function createPDF(
  flippingBookPages: FlippingBookPair[]
): Promise<jsPDF> {
  const pdf = new jsPDF()

  // Process each page in the flipping book sequentially
  for (const flippingBook of flippingBookPages) {
    // Skip pages without WebP data
    if (!flippingBook.webp.base64 && !flippingBook.webp.url) {
      console.warn(`Skipping page ${flippingBook.filename}: missing WebP data`)
      continue
    }

    await createNewPage(pdf, flippingBook)
  }

  // Remove the initial blank page that jsPDF creates automatically
  if (pdf.getNumberOfPages() > 0) {
    pdf.deletePage(1) // Delete the first (blank) page
  }

  return pdf
}
