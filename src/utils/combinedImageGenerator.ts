import { FlippingBookPair } from '../tabs/Flippingbook/hooks/useCombiner'

export interface CombineImageOptions {
  format?: 'png' | 'jpeg' | 'webp'
  quality?: number
  filename?: string
}

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
        }, 10000) // 10 second timeout

        img.onload = () => {
          clearTimeout(timeout)
          console.log(
            `[FlippingBook] ${description} loaded with CORS: ${
              corsMode || 'none'
            }`
          )
          resolve()
        }

        img.onerror = (error) => {
          clearTimeout(timeout)
          reject(error)
        }

        img.src = src
      })

      return img // Success!
    } catch (error) {
      console.warn(
        `[FlippingBook] Failed to load ${description} with CORS ${corsMode}:`,
        error
      )
      // Try next CORS setting
    }
  }

  throw new Error(`Failed to load ${description} with any CORS setting`)
}

export async function generateCombinedImage(
  flippingBook: FlippingBookPair,
  options: CombineImageOptions = {}
): Promise<Blob> {
  const { format = 'png', quality = 0.95 } = options

  console.log(
    '[FlippingBook] Starting combined image generation for:',
    flippingBook.filename
  )

  // Validate FlippingBook data before processing
  if (!flippingBook.webp) {
    throw new Error(`Missing webp data for ${flippingBook.filename}`)
  }

  if (flippingBook.width <= 0 || flippingBook.height <= 0) {
    throw new Error(
      `Invalid dimensions ${flippingBook.width}x${flippingBook.height} for ${flippingBook.filename}`
    )
  }

  if (!flippingBook.webp.url && !flippingBook.webp.base64) {
    throw new Error(`No webp URL or base64 data for ${flippingBook.filename}`)
  }

  // SVG is optional - validate only if present
  if (flippingBook.svg && !flippingBook.svg.url && !flippingBook.svg.base64) {
    throw new Error(
      `SVG present but no URL or base64 data for ${flippingBook.filename}`
    )
  }

  console.log(
    `[FlippingBook] Validation passed for ${flippingBook.filename}:`,
    {
      dimensions: `${flippingBook.width}x${flippingBook.height}`,
      webpHasBase64: !!flippingBook.webp.base64,
      svgHasBase64: !!flippingBook.svg?.base64,
      webpUrl: flippingBook.webp.url?.substring(0, 50),
      svgUrl: flippingBook.svg?.url?.substring(0, 50),
      hasSvg: !!flippingBook.svg,
    }
  )

  // Create canvas element
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  // Set canvas dimensions to WebP dimensions
  canvas.width = flippingBook.width
  canvas.height = flippingBook.height

  console.log(
    '[FlippingBook] Canvas dimensions:',
    canvas.width,
    'x',
    canvas.height
  )

  // Prepare image sources
  const webpSrc = flippingBook.webp.base64
    ? `data:${flippingBook.webp.mimeType};base64,${flippingBook.webp.base64}`
    : flippingBook.webp.url

  // Load WebP image (required)
  console.log('[FlippingBook] Loading WebP:', webpSrc.substring(0, 100) + '...')
  const webpImg = await loadImageSafely(webpSrc, 'WebP background')

  // Draw WebP as background
  ctx.drawImage(webpImg, 0, 0, canvas.width, canvas.height)
  console.log('[FlippingBook] Drew WebP background')

  // Try to load and draw SVG overlay (optional)
  if (flippingBook.svg) {
    const svgSrc = flippingBook.svg.base64
      ? `data:${flippingBook.svg.mimeType};base64,${flippingBook.svg.base64}`
      : flippingBook.svg.url

    try {
      console.log(
        '[FlippingBook] Loading SVG:',
        svgSrc.substring(0, 100) + '...'
      )
      const svgImg = await loadImageSafely(svgSrc, 'SVG overlay')

      // Draw SVG as overlay on top
      ctx.drawImage(svgImg, 0, 0, canvas.width, canvas.height)
      console.log('[FlippingBook] Drew SVG overlay')
    } catch (svgError) {
      console.warn(
        `[FlippingBook] ⚠️ SVG overlay failed to load for ${flippingBook.filename}, proceeding with WebP-only:`,
        svgError
      )
      // Continue without SVG - we still have the WebP background
    }
  } else {
    console.log(
      '[FlippingBook] No SVG overlay for this FlippingBook - WebP only'
    )
  }

  // Convert canvas to blob
  return new Promise<Blob>((resolve, reject) => {
    const mimeType = `image/${format}`
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'))
        } else {
          resolve(blob)
        }
      },
      mimeType,
      quality
    )
  })
}

export async function downloadCombinedImage(
  flippingBook: FlippingBookPair,
  options: CombineImageOptions = {}
): Promise<void> {
  const { filename, format = 'png' } = options

  try {
    const blob = await generateCombinedImage(flippingBook, options)

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `${flippingBook.filename}_combined.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading combined FlippingBook image:', error)
    throw error
  }
}
