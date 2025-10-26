import { useState } from 'react'
import { ImageData } from '../../../hooks/useImageSniffer'
import '../../../components/Button.css'
import { jsPDF } from 'jspdf'
import { InputContainer } from '../../../components/InputContainer'

interface ExportProps {
  sortedImages: ImageData[]
}

export function Export({ sortedImages }: ExportProps) {
  const [pdfTitle, setPdfTitle] = useState('AssetSieve Image Export')
  const [filename, setFilename] = useState('images.pdf')
  const [author, setAuthor] = useState('')
  const [creator, setCreator] = useState('')
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

      // Load image to get dimensions
      const img = new Image()
      const dataUrl = `data:${image.mimeType};base64,${image.base64}`

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const width = img.width
          const height = img.height

          if (isFirstPage) {
            // For first page, delete the default page and create one with correct size
            pdf.deletePage(1)
            pdf.addPage([width, height])
            isFirstPage = false
          } else {
            // Add new page with image dimensions
            pdf.addPage([width, height])
          }

          // Add image to fill the entire page
          pdf.addImage(dataUrl, 'JPEG', 0, 0, width, height)
          resolve()
        }

        img.onerror = () => {
          console.error(`Failed to load image: ${image.url}`)
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

      // Set PDF metadata
      pdf.setProperties({
        title: pdfTitle,
        author: author || 'AssetSieve User',
        creator: creator || 'AssetSieve Image Exporter',
      })

      // Ensure filename has .pdf extension
      const finalFilename = filename.endsWith('.pdf')
        ? filename
        : `${filename}.pdf`

      pdf.save(finalFilename)
    } catch (error) {
      console.error('PDF export failed:', error)
      alert(
        `PDF export failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      )
    }
  }

  return (
    <div className="export-container">
      <div className="export-controls">
        <InputContainer label="PDF Title">
          <input
            className="input"
            type="text"
            value={pdfTitle}
            onChange={(e) => setPdfTitle(e.target.value)}
            placeholder="AssetSieve Image Export"
            title="Title that will be embedded in the PDF metadata"
          />
        </InputContainer>

        <InputContainer label="Creator">
          <input
            className="input"
            type="text"
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            placeholder="Your name (optional)"
            title="Creator name that will be embedded in the PDF metadata"
          />
        </InputContainer>

        <InputContainer label="Author">
          <input
            className="input"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name (optional)"
            title="Author name that will be embedded in the PDF metadata"
          />
        </InputContainer>

        <InputContainer label="Filename">
          <input
            className="input"
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="images.pdf"
            title="Name of the downloaded PDF file (extension will be added automatically)"
          />
        </InputContainer>
      </div>
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
