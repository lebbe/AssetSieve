import { Page, PlacedTextBox } from '../types/page'

type PDFMetadata = {
  width: number
  height: number
  magazineName: string
  creatorName: string
}

type PDFExportData = {
  metadata: PDFMetadata
  pages: Page[]
}

// Constants for text rendering
const TEXT_PADDING = 8
const LINE_HEIGHT_MULTIPLIER = 1.2
const UNDERLINE_OFFSET = 2
const MIN_UNDERLINE_WIDTH = 1
const UNDERLINE_WIDTH_DIVISOR = 16

// Helper function to render text box to canvas
const renderTextBoxToCanvas = async (
  textBox: PlacedTextBox,
  targetWidth: number,
  targetHeight: number,
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(targetWidth)
    canvas.height = Math.round(targetHeight)
    const ctx = canvas.getContext('2d', { alpha: true })

    if (!ctx) {
      resolve('')
      return
    }

    // Clear with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background if not transparent
    if (textBox.backgroundColor !== 'transparent') {
      ctx.fillStyle = textBox.backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Set up text styling
    const fontWeight = textBox.isBold ? '700' : '400'
    const fontStyle = textBox.isItalic ? 'italic' : 'normal'
    ctx.font = `${fontStyle} ${fontWeight} ${textBox.fontSize}px "${textBox.fontFamily}"`
    ctx.fillStyle = textBox.color
    ctx.textBaseline = 'top'

    // Handle underline
    const lineHeight = textBox.fontSize * LINE_HEIGHT_MULTIPLIER
    const lines = textBox.text.split('\n')

    lines.forEach((line, index) => {
      const y = TEXT_PADDING + index * lineHeight

      // Draw text
      ctx.fillText(line, TEXT_PADDING, y)

      // Draw underline if needed
      if (textBox.isUnderline && line.length > 0) {
        const metrics = ctx.measureText(line)
        ctx.beginPath()
        ctx.strokeStyle = textBox.color
        ctx.lineWidth = Math.max(
          MIN_UNDERLINE_WIDTH,
          textBox.fontSize / UNDERLINE_WIDTH_DIVISOR,
        )
        ctx.moveTo(TEXT_PADDING, y + textBox.fontSize + UNDERLINE_OFFSET)
        ctx.lineTo(
          TEXT_PADDING + metrics.width,
          y + textBox.fontSize + UNDERLINE_OFFSET,
        )
        ctx.stroke()
      }
    })

    // Convert to PNG
    const pngDataUrl = canvas.toDataURL('image/png')
    resolve(pngDataUrl)
  })
}

export async function createPDF(data: PDFExportData): Promise<void> {
  const { metadata, pages } = data
  const { width, height, magazineName, creatorName } = metadata

  // Dynamically import jsPDF to reduce initial bundle size
  const { jsPDF: JsPDF } = await import('jspdf')

  // Helper function to convert unsupported formats (including SVG) to PNG with alpha
  // targetWidth/targetHeight are the desired output dimensions in the PDF
  // sourceX/sourceY/sourceWidth/sourceHeight are the crop region within the source image
  const convertImageToPNG = async (
    imageUrl: string,
    targetWidth: number,
    targetHeight: number,
    sourceX: number = 0,
    sourceY: number = 0,
    sourceWidth?: number,
    sourceHeight?: number,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        // Ensure we have valid dimensions
        let canvasWidth = Math.round(targetWidth)
        let canvasHeight = Math.round(targetHeight)

        // Fallback to natural size if target dimensions are invalid
        if (canvasWidth <= 0 || canvasHeight <= 0) {
          console.warn(
            `Invalid target dimensions ${targetWidth}x${targetHeight}, using natural size`,
          )
          canvasWidth = img.naturalWidth || 100
          canvasHeight = img.naturalHeight || 100
        }

        // Use full image dimensions if crop dimensions not specified
        const srcWidth = sourceWidth ?? img.naturalWidth
        const srcHeight = sourceHeight ?? img.naturalHeight

        console.log(
          `Rendering ${imageUrl} to canvas at ${canvasWidth}x${canvasHeight} from source region (${sourceX}, ${sourceY}, ${srcWidth}, ${srcHeight})`,
        )

        const canvas = document.createElement('canvas')
        canvas.width = canvasWidth
        canvas.height = canvasHeight
        const ctx = canvas.getContext('2d', { alpha: true })
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Clear canvas with transparent background
        ctx.clearRect(0, 0, canvasWidth, canvasHeight)

        // Draw the cropped portion of the image
        // Parameters: image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          srcWidth,
          srcHeight,
          0,
          0,
          canvasWidth,
          canvasHeight,
        )

        // Convert to PNG (preserves alpha channel)
        const pngDataUrl = canvas.toDataURL('image/png')
        console.log(`Successfully converted ${imageUrl} to PNG`)
        resolve(pngDataUrl)
      }

      img.onerror = (error) => {
        console.error(`Failed to load image ${imageUrl}:`, error)
        reject(new Error(`Failed to load image: ${imageUrl}`))
      }

      // For SVG, use the URL directly; for others with base64, construct data URL
      console.log(`Loading image from URL: ${imageUrl}`)
      img.src = imageUrl
    })
  }

  // Convert pixels to points (72 points = 1 inch, assuming 96 DPI for web)
  const widthInPoints = (width * 72) / 96
  const heightInPoints = (height * 72) / 96

  // Create PDF with custom dimensions
  const pdf = new JsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [widthInPoints, heightInPoints],
  })

  // Set metadata
  if (magazineName) {
    pdf.setProperties({
      title: magazineName,
      subject: magazineName,
      author: creatorName || 'AssetSieve',
      creator: 'AssetSieve - MagForge',
    })
  }

  // Process each page
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex]
    if (!page) continue

    // Add new page (except for the first one which is already created)
    if (pageIndex > 0) {
      pdf.addPage([widthInPoints, heightInPoints])
    }

    // Load and place each image on the page
    for (const placedImage of page.images) {
      try {
        // Get crop values (use full dimensions if not cropped)
        const croppedWidth = placedImage.croppedWidth ?? placedImage.width
        const croppedHeight = placedImage.croppedHeight ?? placedImage.height
        const croppedX = placedImage.croppedX ?? 0
        const croppedY = placedImage.croppedY ?? 0

        // Convert pixel coordinates to points (use cropped dimensions)
        const xInPoints = (placedImage.x * 72) / 96
        const yInPoints = (placedImage.y * 72) / 96
        const widthInPoints = (croppedWidth * 72) / 96
        const heightInPoints = (croppedHeight * 72) / 96

        const mimeType = placedImage.image.mimeType
        const isSVG = mimeType.includes('svg')

        // Check if format is supported by jsPDF (SVG is not directly supported)
        const isSupported =
          !isSVG &&
          (mimeType.includes('jpeg') ||
            mimeType.includes('jpg') ||
            mimeType.includes('png') ||
            mimeType.includes('webp'))

        let imageDataUrl: string
        let format: 'JPEG' | 'PNG' | 'WEBP' = 'PNG'

        // Calculate scaling factor between placed dimensions and actual image dimensions
        const actualImageWidth = placedImage.image.width || placedImage.width
        const actualImageHeight = placedImage.image.height || placedImage.height
        const scaleX = actualImageWidth / placedImage.width
        const scaleY = actualImageHeight / placedImage.height

        // Scale crop coordinates to actual image space
        const actualCroppedX = croppedX * scaleX
        const actualCroppedY = croppedY * scaleY
        const actualCroppedWidth = croppedWidth * scaleX
        const actualCroppedHeight = croppedHeight * scaleY

        if (!isSupported) {
          // Convert unsupported formats (SVG, AVIF, etc.) to PNG with alpha
          // Use the cropped dimensions for rendering
          console.log(
            `Converting ${mimeType} to PNG at ${croppedWidth}x${croppedHeight} (cropped from ${actualCroppedX}, ${actualCroppedY}, ${actualCroppedWidth}x${actualCroppedHeight}) for ${placedImage.image.url}`,
          )
          imageDataUrl = await convertImageToPNG(
            placedImage.image.url,
            croppedWidth,
            croppedHeight,
            actualCroppedX,
            actualCroppedY,
            actualCroppedWidth,
            actualCroppedHeight,
          )
          format = 'PNG'
        } else {
          // For supported formats, we need to crop them if necessary
          if (
            croppedX > 0 ||
            croppedY > 0 ||
            croppedWidth < placedImage.width ||
            croppedHeight < placedImage.height
          ) {
            // Image is cropped, convert to PNG with cropping
            console.log(
              `Cropping ${mimeType} to PNG at ${croppedWidth}x${croppedHeight} (cropped from ${actualCroppedX}, ${actualCroppedY}, ${actualCroppedWidth}x${actualCroppedHeight})`,
            )
            imageDataUrl = await convertImageToPNG(
              `data:${mimeType};base64,${placedImage.image.base64}`,
              croppedWidth,
              croppedHeight,
              actualCroppedX,
              actualCroppedY,
              actualCroppedWidth,
              actualCroppedHeight,
            )
            format = 'PNG'
          } else {
            // Use original base64 data for supported formats when not cropped
            imageDataUrl = `data:${mimeType};base64,${placedImage.image.base64}`

            if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
              format = 'JPEG'
            } else if (mimeType.includes('webp')) {
              format = 'WEBP'
            }
          }
        }

        // Add image to PDF (using cropped dimensions)
        pdf.addImage(
          imageDataUrl,
          format,
          xInPoints,
          yInPoints,
          widthInPoints,
          heightInPoints,
        )
      } catch (error) {
        console.error(
          `Failed to add image ${placedImage.image.url} to PDF:`,
          error,
        )
      }
    }

    // Load and place each text box on the page
    for (const textBox of page.textBoxes) {
      try {
        // Convert pixel coordinates to points
        const xInPoints = (textBox.x * 72) / 96
        const yInPoints = (textBox.y * 72) / 96
        const widthInPoints = (textBox.width * 72) / 96
        const heightInPoints = (textBox.height * 72) / 96

        // Render text box to canvas with alpha
        const textBoxDataUrl = await renderTextBoxToCanvas(
          textBox,
          textBox.width,
          textBox.height,
        )

        if (textBoxDataUrl) {
          // Add text box image to PDF
          pdf.addImage(
            textBoxDataUrl,
            'PNG',
            xInPoints,
            yInPoints,
            widthInPoints,
            heightInPoints,
          )
        }
      } catch (error) {
        console.error(`Failed to add text box to PDF:`, error)
      }
    }
  }

  // Generate filename
  const filename = magazineName
    ? `${magazineName.replace(/[^a-z0-9]/gi, '_')}.pdf`
    : 'magazine.pdf'

  // Save the PDF
  pdf.save(filename)
}
