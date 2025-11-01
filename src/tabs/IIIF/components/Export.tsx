import { useState } from 'react'
import type jsPDF from 'jspdf'
import { IIIFImage } from '../hooks/useIIIFDetector'
import { useMetadataExport } from '../../../hooks/useMetadataExport'
import { MetadataExport } from '../../../components/MetadataExport'
import {
  savePDFWithMetadata,
  handlePDFExportError,
} from '../../../utils/pdfExport'
import { stitchIIIFImage } from '../utils/iiifStitcher'
import './Export.css'

interface ExportProps {
  images: IIIFImage[]
}

async function loadJsPDF() {
  const jsPDFModule = await import('jspdf')
  return jsPDFModule.default
}

// Compress and resize image to prevent PDF size issues
async function compressImageForPDF(
  dataUrl: string,
  maxWidth: number,
  maxHeight: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width
      let height = img.height

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = width * ratio
        height = height * ratio
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Convert to JPEG with compression to reduce size
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
      resolve(compressedDataUrl)
    }

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'))
    }

    img.src = dataUrl
  })
}

export function Export({ images }: ExportProps) {
  const { pdfTitle, filename, author, creator, setters } = useMetadataExport()
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStatus, setExportStatus] = useState('')

  const imagesWithData = images.filter((img) =>
    img.tiles.every((tile) => tile.imageData),
  )
  const readyToExport = imagesWithData.length > 0

  async function createPDF(iiifImages: IIIFImage[]): Promise<jsPDF> {
    const jsPDF = await loadJsPDF()

    // Create PDF with first image dimensions
    const firstImage = iiifImages[0]!
    const pdf = new jsPDF({
      orientation:
        firstImage.fullWidth > firstImage.fullHeight ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [firstImage.fullWidth, firstImage.fullHeight],
    })

    setExportProgress(0)

    for (let i = 0; i < iiifImages.length; i++) {
      const iiifImage = iiifImages[i]!

      setExportStatus(`Processing image ${i + 1} of ${iiifImages.length}...`)

      // Stitch image if not already done
      let imageDataUrl = iiifImage.combinedImage
      if (!imageDataUrl) {
        setExportStatus(`Stitching image ${i + 1}...`)
        imageDataUrl = await stitchIIIFImage(iiifImage)
        iiifImage.combinedImage = imageDataUrl
      }

      // Add new page with this image's dimensions (except for first image)
      if (i > 0) {
        pdf.addPage(
          [iiifImage.fullWidth, iiifImage.fullHeight],
          iiifImage.fullWidth > iiifImage.fullHeight ? 'landscape' : 'portrait',
        )
      }

      // Use full page dimensions (image fills entire page)
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      setExportStatus(`Compressing image ${i + 1}...`)

      // Compress image to prevent memory issues
      // Max 2000px width/height should be sufficient for PDF quality
      const compressedImageUrl = await compressImageForPDF(
        imageDataUrl,
        2000,
        2000,
      )

      setExportStatus(`Adding to PDF: ${i + 1} of ${iiifImages.length}...`)

      // Add image to PDF filling entire page (use JPEG format for smaller size)
      pdf.addImage(compressedImageUrl, 'JPEG', 0, 0, pageWidth, pageHeight)

      setExportProgress(Math.round(((i + 1) / iiifImages.length) * 100))
    }

    setExportStatus('Finalizing PDF...')
    return pdf
  }

  async function handleExportToPDF() {
    setIsExporting(true)
    setExportProgress(0)
    setExportStatus('Starting export...')

    try {
      const pdf = await createPDF(imagesWithData)
      setExportStatus('Saving PDF...')
      savePDFWithMetadata(
        pdf,
        filename,
        { title: pdfTitle, author, creator },
        'AssetSieve IIIF Exporter',
      )
      setExportStatus('Export complete!')
    } catch (error) {
      setExportStatus('Export failed!')
      handlePDFExportError(error)
    } finally {
      setTimeout(() => {
        setIsExporting(false)
        setExportProgress(0)
        setExportStatus('')
      }, 2000)
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

      <div className="export-actions">
        <button
          onClick={handleExportToPDF}
          disabled={!readyToExport || isExporting}
          className={`btn ${readyToExport ? 'btn-green' : ''}`}
        >
          {isExporting
            ? `Exporting... ${exportProgress}%`
            : `Export to PDF (${imagesWithData.length} images)`}
        </button>

        {!readyToExport && images.length > 0 && (
          <p className="export-warning">
            Some images are still loading tiles. Please wait for all images to
            complete before exporting.
          </p>
        )}
      </div>

      {isExporting && (
        <div className="export-progress">
          <div className="progress-bar">
            <div
              className="progress-bar__fill"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
          {exportStatus && <div className="export-status">{exportStatus}</div>}
        </div>
      )}
    </div>
  )
}
