import { useState } from 'react'
import { FlippingBookPair } from '../hooks/useCombiner'
import '../../../components/Button.css'

import { InputContainer } from '../../../components/InputContainer'
import './Export.css'
import { Spinner } from './Spinner'
import jsPDF from 'jspdf'
import { createNewPage } from '../utils/createNewPage'
import JSZip from 'jszip'

interface ExportProps {
  sortedImages: FlippingBookPair[]
}

export function Export({ sortedImages }: ExportProps) {
  const [pdfTitle, setPdfTitle] = useState('FlippingBook Export')
  const [filename, setFilename] = useState('flippingbook.pdf')
  const [author, setAuthor] = useState('')
  const [creator, setCreator] = useState('')
  const [exportedPages, setExportedPages] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  async function createPDF(
    flippingBookPages: FlippingBookPair[],
  ): Promise<jsPDF> {
    const pdf = new jsPDF()
    setExportedPages(0)

    // Process each page in the flipping book sequentially
    for (const flippingBook of flippingBookPages) {
      // Skip pages without WebP data
      if (!flippingBook.webp.base64 && !flippingBook.webp.url) {
        console.warn(
          `Skipping page ${flippingBook.filename}: missing WebP data`,
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

      // Set PDF metadata
      pdf.setProperties({
        title: pdfTitle,
        author: author || 'AssetSieve User',
        creator: creator || 'AssetSieve FlippingBook Exporter',
      })

      // Ensure filename has .pdf extension
      const finalFilename = filename.endsWith('.pdf')
        ? filename
        : `${filename}.pdf`

      pdf.save(finalFilename)
      setIsExporting(false)
    } catch (error) {
      alert(`PDF export failed, check console for more.`)
      console.error('PDF export failed:', {
        message:
          error instanceof Error
            ? error.message
            : error instanceof String
              ? error
              : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack available',
      })
    }
  }

  const handleDownloadUrls = () => {
    const urls = sortedImages
      .map((flippingBook) => flippingBook.webp.url)
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
   * - WebP files are stored as binary (decoded from base64).
   * - SVG files are stored as text (decoded from base64 to UTF-8).
   */
  async function handleDownloadEverything() {
    setIsDownloading(true)
    setDownloadProgress(0)

    const zip = new JSZip()
    const webpFolder = zip.folder('webp')
    const svgFolder = zip.folder('svg')

    if (!webpFolder || !svgFolder) {
      throw new Error('Failed to create ZIP folders')
    }

    let processed = 0
    const total = sortedImages.length

    try {
      for (const pair of sortedImages) {
        // Remove extension from filename to use as base name
        const baseName = pair.filename.replace(/\.[^/.]+$/, '')

        // 1. Add the WebP file with .webp extension
        if (pair.webp && pair.webp.base64) {
          const webpFilename = `${baseName}.webp`
          webpFolder.file(webpFilename, pair.webp.base64, { base64: true })
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
    setIsDownloading(true)
    setDownloadProgress(0)

    try {
      const zip = new JSZip()

      let processed = 0
      const total = sortedImages.length

      for (const flippingBook of sortedImages) {
        try {
          // Generate combined image by overlaying SVG on WebP
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

          // Load and draw WebP
          const webpImg = new Image()
          webpImg.crossOrigin = 'anonymous'

          const webpSrc = flippingBook.webp.base64
            ? `data:${flippingBook.webp.mimeType};base64,${flippingBook.webp.base64}`
            : flippingBook.webp.url

          await new Promise<void>((resolve, reject) => {
            webpImg.onload = () => resolve()
            webpImg.onerror = () => reject(new Error('Failed to load WebP'))
            webpImg.src = webpSrc
          })

          ctx.drawImage(webpImg, 0, 0, flippingBook.width, flippingBook.height)

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
          setDownloadProgress(Math.round((processed / total) * 95))
        } catch (error) {
          console.error(
            `Failed to create combined image for ${flippingBook.filename}:`,
            error,
          )
        }
      }

      setDownloadProgress(96)

      // Generate ZIP
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6,
        },
        streamFiles: true,
      })

      setDownloadProgress(100)

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
        setIsDownloading(false)
        setDownloadProgress(0)
      }, 1000)
    } catch (error) {
      console.error('Failed to create ZIP:', error)
      alert('Failed to create ZIP file. Check console for details.')
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }

  return (
    <div className="export-container">
      <div className="export-metadata">
        <InputContainer label="PDF Title">
          <input
            className="input"
            type="text"
            value={pdfTitle}
            onChange={(e) => setPdfTitle(e.target.value)}
            placeholder="FlippingBook Export"
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
            placeholder="flippingbook.pdf"
            title="Name of the downloaded PDF file (extension will be added automatically)"
          />
        </InputContainer>
      </div>

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
          title="Download all WebP and SVG files as ZIP"
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
          disabled={sortedImages.length === 0 || isDownloading}
          title="Download all combined PNGs as ZIP"
        >
          {isDownloading && downloadProgress < 100 ? (
            <>
              Generating... {downloadProgress}%
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
