import { ImageData } from '../../../hooks/useImageSniffer'
import '../../../components/Button.css'
import { jsPDF } from 'jspdf'
import { useMetadataExport } from '../../../hooks/useMetadataExport'
import { MetadataExport } from '../../../components/MetadataExport'
import {
  savePDFWithMetadata,
  handlePDFExportError,
  getImageFormatForPDF,
} from '../../../utils/pdfExport'

interface ExportProps {
  sortedImages: ImageData[]
}

export function Export({ sortedImages }: ExportProps) {
  const { pdfTitle, filename, author, creator, setters } = useMetadataExport()
  const getFileExtension = (mimeType: string, url: string) => {
    // Try to get extension from MIME type first
    const mimeExtensions: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'image/bmp': 'bmp',
      'image/tiff': 'tiff',
    }

    const fromMime = mimeExtensions[mimeType.toLowerCase()]
    if (fromMime) return fromMime

    // Fallback to URL extension
    const urlExt = url.split('.').pop()?.toLowerCase()
    return urlExt || 'jpg'
  }

  const getZeroPadding = (totalCount: number) => {
    return totalCount.toString().length
  }

  const downloadImage = async (image: ImageData, filename: string) => {
    if (!image.base64) {
      console.warn(`No base64 data for ${filename}`)
      return
    }

    try {
      // Convert base64 to blob
      const byteCharacters = atob(image.base64)
      const byteNumbers = Array.from(byteCharacters, (c) => c.charCodeAt(0))

      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: image.mimeType })

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'

      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Cleanup
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error(`Failed to download ${filename}:`, error)
    }
  }

  const handleExportAll = async () => {
    if (sortedImages.length === 0) {
      alert('No images to export')
      return
    }

    const totalImages = sortedImages.length
    const padding = getZeroPadding(totalImages)

    // Add a small delay between downloads to avoid overwhelming the browser
    for (let i = 0; i < sortedImages.length; i++) {
      const image = sortedImages[i]
      if (image === undefined) continue
      const sequenceNumber = (i + 1).toString().padStart(padding, '0')
      const extension = getFileExtension(image.mimeType, image.url)
      const originalFilename =
        image.url.split('/').pop()?.split('.')[0] || 'image'
      const filename = `${sequenceNumber}-${originalFilename}.${extension}`

      await downloadImage(image, filename)

      // Small delay to prevent browser from blocking downloads
      if (i < sortedImages.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }
  }

  const generatePDF = async () => {
    if (sortedImages.length === 0) {
      throw new Error('No images to export')
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [100, 100], // Will be updated for each page
      compress: true,
    })

    let isFirstPage = true

    for (const image of sortedImages) {
      if (!image.base64) {
        console.warn(`Skipping image without base64 data: ${image.url}`)
        continue
      }

      console.log(`Processing image: ${image.url}`, {
        mimeType: image.mimeType,
        hasBase64: !!image.base64,
        base64Length: image.base64?.length,
        base64Preview: image.base64?.substring(0, 50),
      })

      // Load image to get dimensions
      const img = new Image()
      img.crossOrigin = 'anonymous'

      // Special handling for SVG - check if base64 is actually raw SVG/XML text
      let dataUrl = `data:${image.mimeType};base64,${image.base64}`
      if (
        image.mimeType === 'image/svg+xml' &&
        (image.base64.trim().startsWith('<svg') ||
          image.base64.trim().startsWith('<?xml'))
      ) {
        // Raw SVG/XML text, need to encode it properly
        // Use TextEncoder to handle Unicode characters
        console.log('SVG detected as raw text, encoding...')
        const encoder = new TextEncoder()
        const uint8Array = encoder.encode(image.base64)
        const binaryString = Array.from(uint8Array, (byte) =>
          String.fromCharCode(byte),
        ).join('')
        const encodedSvg = btoa(binaryString)
        dataUrl = `data:${image.mimeType};base64,${encodedSvg}`
      }

      await new Promise<void>((resolve, reject) => {
        img.onload = async () => {
          try {
            const width = img.width || img.naturalWidth
            const height = img.height || img.naturalHeight

            if (!width || !height) {
              throw new Error(
                `Invalid image dimensions: ${width}x${height} for ${image.url}`,
              )
            }

            if (isFirstPage) {
              // For first page, delete the default page and create one with correct size
              pdf.deletePage(1)
              pdf.addPage([width, height])
              isFirstPage = false
            } else {
              // Add new page with image dimensions
              pdf.addPage([width, height])
            }

            // Convert SVG to PNG via canvas
            let imageDataUrl = dataUrl
            let format = getImageFormatForPDF(image.mimeType)

            if (image.mimeType === 'image/svg+xml') {
              try {
                // Create canvas and draw SVG on it
                const canvas = document.createElement('canvas')
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')

                if (!ctx) {
                  throw new Error('Failed to get canvas context')
                }

                ctx.drawImage(img, 0, 0, width, height)

                // Convert canvas to PNG data URL
                imageDataUrl = canvas.toDataURL('image/png')
                format = 'PNG'
              } catch (svgError) {
                console.error('Failed to convert SVG:', svgError)
                reject(new Error(`Failed to convert SVG: ${image.url}`))
                return
              }
            }

            // Add image to fill the entire page
            pdf.addImage(imageDataUrl, format, 0, 0, width, height)
            resolve()
          } catch (error) {
            reject(error)
          }
        }

        img.onerror = (error) => {
          console.error(`Failed to load image: ${image.url}`, error)
          reject(new Error(`Failed to load image: ${image.url}`))
        }

        img.src = dataUrl
      })
    }

    return pdf
  }

  const handleExportToPDF = async () => {
    if (sortedImages.length === 0) {
      alert('No images to export to PDF')
      return
    }

    try {
      const pdf = await generatePDF()
      savePDFWithMetadata(
        pdf,
        filename,
        { title: pdfTitle, author, creator },
        'AssetSieve Image Exporter',
      )
    } catch (error) {
      handlePDFExportError(error)
    }
  }

  return (
    <div className="export-container">
      <MetadataExport
        pdfTitle={pdfTitle}
        filename={filename}
        author={author}
        creator={creator}
        setters={setters}
      />
      <div className="export-buttons">
        <button
          onClick={handleExportAll}
          className="btn btn-green btn-lg"
          disabled={sortedImages.length === 0}
        >
          Download All Images ({sortedImages.length})
        </button>
        <button
          onClick={handleExportToPDF}
          className="btn btn-red btn-lg"
          disabled={sortedImages.length === 0}
        >
          Export to PDF ({sortedImages.length})
        </button>
      </div>
      <span className="export-info">
        Images will be numbered{' '}
        {sortedImages.length > 0
          ? `01-${sortedImages.length
              .toString()
              .padStart(getZeroPadding(sortedImages.length), '0')}`
          : ''}
      </span>
    </div>
  )
}
