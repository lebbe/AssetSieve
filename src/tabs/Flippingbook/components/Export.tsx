import { useState } from 'react'
import type jsPDF from 'jspdf'
import { FlippingBookPair } from '../hooks/useCombiner'
import '../../../components/Button.css'

import './Export.css'
import { Spinner } from './Spinner'
import { createNewPage } from '../utils/createNewPage'
import { useMetadataExport } from '../../../hooks/useMetadataExport'
import { MetadataExport } from '../../../components/MetadataExport'
import {
  savePDFWithMetadata,
  handlePDFExportError,
} from '../../../utils/pdfExport'

interface ExportProps {
  sortedImages: FlippingBookPair[]
}

/**
 * Dynamically loads jsPDF library
 */
async function loadJsPDF() {
  const jsPDFModule = await import('jspdf')
  return jsPDFModule.default
}

/**
 * Dynamically loads JSZip library
 */
async function loadJSZip() {
  const JSZipModule = await import('jszip')
  return JSZipModule.default
}

export function Export({ sortedImages }: ExportProps) {
  const { pdfTitle, filename, author, creator, setters } = useMetadataExport()
  const [exportedPages, setExportedPages] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [combinedProgress, setCombinedProgress] = useState(0)
  const [isGeneratingCombined, setIsGeneratingCombined] = useState(false)

  async function createPDF(
    flippingBookPages: FlippingBookPair[],
  ): Promise<jsPDF> {
    // Dynamically import jsPDF to reduce initial bundle size
    const jsPDF = await loadJsPDF()
    const pdf = new jsPDF()
    setExportedPages(0)

    // Process each page in the flipping book sequentially
    for (const flippingBook of flippingBookPages) {
      // Skip pages without background image data
      if (
        !flippingBook.backgroundImage.base64 &&
        !flippingBook.backgroundImage.url
      ) {
        console.warn(
          `Skipping page ${flippingBook.filename}: missing background image data`,
        )
        continue
      }

      await createNewPage(pdf, flippingBook)
      setExportedPages((prev) => prev + 1)
    }

    // Remove the initial blank page that jsPDF creates automatically
    if (pdf.getNumberOfPages() > 0) {
      pdf.deletePage(1) // Delete the first (blank) page
    }

    return pdf
  }

  async function handleExportToPDF() {
    setIsExporting(true)
    try {
      const pdf = await createPDF(sortedImages)
      savePDFWithMetadata(
        pdf,
        filename,
        { title: pdfTitle, author, creator },
        'AssetSieve FlippingBook Exporter',
      )
      setIsExporting(false)
    } catch (error) {
      handlePDFExportError(error)
      setIsExporting(false)
    }
  }

  const handleDownloadUrls = () => {
    const urls = sortedImages
      .map((flippingBook) => flippingBook.backgroundImage.url)
      .join('\n')
    const blob = new Blob([urls], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'flippingbook_urls.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  function base64ToUtf8(base64: string) {
    try {
      // 1. atob() decodes base64 into a "binary string" (bytes represented as chars)
      const binaryString = atob(base64)
      // 2. Convert this binary string into a byte array (Uint8Array)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      // 3. Decode the byte array as a UTF-8 string
      return new TextDecoder('utf-8').decode(bytes)
    } catch (e) {
      console.error(
        `Failed to decode base64 string: ${
          e instanceof Error ? e.message : JSON.stringify(e)
        }`,
      )
      return '' // Return empty string on failure
    }
  }

  // --- CORE FUNCTION ---

  /**
   * Creates a .zip file from the `sortedImages` array and triggers a download.
   * - Background images are stored as binary (decoded from base64).
   * - SVG files are stored as text (decoded from base64 to UTF-8).
   */
  async function handleDownloadEverything() {
    setIsDownloading(true)
    setDownloadProgress(0)

    // Dynamically import JSZip to reduce initial bundle size
    const JSZip = await loadJSZip()
    const zip = new JSZip()
    const imagesFolder = zip.folder('images')
    const svgFolder = zip.folder('svg')

    if (!imagesFolder || !svgFolder) {
      throw new Error('Failed to create ZIP folders')
    }

    let processed = 0
    const total = sortedImages.length

    try {
      for (const pair of sortedImages) {
        // Remove extension from filename to use as base name
        const baseName = pair.filename.replace(/\.[^/.]+$/, '')

        // 1. Add the background image file with proper extension
        if (pair.backgroundImage && pair.backgroundImage.base64) {
          // Get file extension from the background image URL
          const url = pair.backgroundImage.url
          const urlWithoutQuery = url.split('?')[0] || url
          const extension =
            urlWithoutQuery.substring(urlWithoutQuery.lastIndexOf('.') + 1) ||
            'jpg'
          const imageFilename = `${baseName}.${extension}`
          imagesFolder.file(imageFilename, pair.backgroundImage.base64, {
            base64: true,
          })
        }

        // 2. Add the SVG file (if it exists) with .svg extension
        if (pair.svg && pair.svg.base64) {
          const svgFilename = `${baseName}.svg`

          // Check if SVG base64 is raw XML text
          if (pair.svg.base64.trim().startsWith('<')) {
            // It's already raw SVG text, not base64 encoded
            svgFolder.file(svgFilename, pair.svg.base64)
          } else {
            // Decode the base64 to a UTF-8 string
            const svgContent = base64ToUtf8(pair.svg.base64)

            // Add the file to the zip as a text string
            if (svgContent) {
              svgFolder.file(svgFilename, svgContent)
            }
          }
        }

        processed++
        setDownloadProgress(Math.round((processed / total) * 95))
      }

      setDownloadProgress(96)

      // Generate the .zip file as a Blob
      const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6,
        },
      })

      setDownloadProgress(100)

      // Trigger the download
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = 'flippingbook_all_files.zip'
      document.body.appendChild(a)
      a.click()

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setIsDownloading(false)
        setDownloadProgress(0)
      }, 1000)
    } catch (error) {
      console.error('ZIP Generation Error:', error)
      alert('Failed to create ZIP file. Check console for details.')
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }

  /**
   * Downloads all combined PNGs as a ZIP archive
   * This generates combined images on-the-fly
   */
  async function handleDownloadAllCombined() {
    setIsGeneratingCombined(true)
    setCombinedProgress(0)

    try {
      // Dynamically import JSZip to reduce initial bundle size
      const JSZip = await loadJSZip()
      const zip = new JSZip()

      let processed = 0
      const total = sortedImages.length

      for (const flippingBook of sortedImages) {
        try {
          // Generate combined image by overlaying SVG on background image
          const canvas = document.createElement('canvas')
          canvas.width = flippingBook.width
          canvas.height = flippingBook.height
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            console.warn(
              `Failed to get canvas context for ${flippingBook.filename}`,
            )
            continue
          }

          // Load and draw background image
          const backgroundImg = new Image()
          backgroundImg.crossOrigin = 'anonymous'

          const backgroundSrc = flippingBook.backgroundImage.base64
            ? `data:${flippingBook.backgroundImage.mimeType};base64,${flippingBook.backgroundImage.base64}`
            : flippingBook.backgroundImage.url

          await new Promise<void>((resolve, reject) => {
            backgroundImg.onload = () => resolve()
            backgroundImg.onerror = () =>
              reject(new Error('Failed to load background image'))
            backgroundImg.src = backgroundSrc
          })

          ctx.drawImage(
            backgroundImg,
            0,
            0,
            flippingBook.width,
            flippingBook.height,
          )

          // Overlay SVG if present
          if (flippingBook.svg) {
            const svgImg = new Image()
            svgImg.crossOrigin = 'anonymous'

            let svgSrc: string
            if (flippingBook.svg.base64) {
              // Check if it's raw SVG text or actual base64
              if (flippingBook.svg.base64.trim().startsWith('<svg')) {
                const encodedSvg = btoa(flippingBook.svg.base64)
                svgSrc = `data:${flippingBook.svg.mimeType};base64,${encodedSvg}`
              } else {
                svgSrc = `data:${flippingBook.svg.mimeType};base64,${flippingBook.svg.base64}`
              }
            } else {
              svgSrc = flippingBook.svg.url
            }

            try {
              await new Promise<void>((resolve, reject) => {
                svgImg.onload = () => resolve()
                svgImg.onerror = () => reject(new Error('Failed to load SVG'))
                svgImg.src = svgSrc
              })

              ctx.drawImage(
                svgImg,
                0,
                0,
                flippingBook.width,
                flippingBook.height,
              )
            } catch (svgError) {
              console.warn(
                `Failed to overlay SVG for ${flippingBook.filename}:`,
                svgError,
              )
            }
          }

          // Convert canvas to PNG blob
          const pngBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to create blob'))
              }
            }, 'image/png')
          })

          // Add to ZIP
          const pngFilename = `${flippingBook.filename.replace(
            /\.[^/.]+$/,
            '',
          )}_combined.png`
          zip.file(pngFilename, pngBlob)

          processed++
          setCombinedProgress(Math.round((processed / total) * 95))
        } catch (error) {
          console.error(
            `Failed to create combined image for ${flippingBook.filename}:`,
            error,
          )
        }
      }

      setCombinedProgress(96)

      // Generate ZIP
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6,
        },
        streamFiles: true,
      })

      setCombinedProgress(100)

      // Download the ZIP
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'flippingbook_combined.zip'
      document.body.appendChild(a)
      a.click()

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setIsGeneratingCombined(false)
        setCombinedProgress(0)
      }, 1000)
    } catch (error) {
      console.error('Failed to create ZIP:', error)
      alert('Failed to create ZIP file. Check console for details.')
      setIsGeneratingCombined(false)
      setCombinedProgress(0)
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
          className="btn btn-green"
          disabled={sortedImages.length === 0}
          title={`Export all ${sortedImages.length} FlippingBooks to PDF`}
        >
          {isExporting ? (
            <>
              {exportedPages} / {sortedImages.length}
              <Spinner />
            </>
          ) : (
            'Export PDF'
          )}
        </button>

        <button
          onClick={handleDownloadUrls}
          className="btn btn-blue"
          disabled={sortedImages.length === 0}
          title="Download FlippingBook URLs as text file"
        >
          Download URLs
        </button>

        <button
          onClick={handleDownloadEverything}
          className="btn btn-grey"
          disabled={sortedImages.length === 0 || isDownloading}
          title="Download all background images and SVG files as ZIP"
        >
          {isDownloading && downloadProgress < 100 ? (
            <>
              Preparing... {downloadProgress}%
              <Spinner />
            </>
          ) : (
            'Download All Files (ZIP)'
          )}
        </button>
        <button
          onClick={handleDownloadAllCombined}
          className="btn btn-red"
          disabled={sortedImages.length === 0 || isGeneratingCombined}
          title="Download all combined PNGs as ZIP"
        >
          {isGeneratingCombined && combinedProgress < 100 ? (
            <>
              Generating... {combinedProgress}%
              <Spinner />
            </>
          ) : (
            'Download Combined PNGs (ZIP)'
          )}
        </button>
      </div>
    </div>
  )
}
