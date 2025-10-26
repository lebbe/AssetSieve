import { useState } from 'react'
import { FlippingBookPair } from '../hooks/useCombiner'
import '../../../components/Button.css'
import { createPDF } from '../utils/createNewPage'
import { InputContainer } from '../../../components/InputContainer'
import './Export.css'

interface ExportProps {
  sortedImages: FlippingBookPair[]
}

export function Export({ sortedImages }: ExportProps) {
  const [pdfTitle, setPdfTitle] = useState('FlippingBook Export')
  const [filename, setFilename] = useState('flippingbook.pdf')
  const [author, setAuthor] = useState('')
  const [creator, setCreator] = useState('')
  async function handleExportToPDF() {
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

  const handleCopyUrls = async () => {
    const urls = sortedImages
      .map((flippingBook) => flippingBook.webp.url)
      .join('\n')
    try {
      await navigator.clipboard.writeText(urls)
      // You might want to show a toast notification here
    } catch (error) {
      console.error('Failed to copy URLs to clipboard:', error)
    }
  }

  return (
    <div className="export-container">
      <div className="export-metadata">
        <InputContainer label="PDF Title">
          <input
            type="text"
            value={pdfTitle}
            onChange={(e) => setPdfTitle(e.target.value)}
            placeholder="FlippingBook Export"
            title="Title that will be embedded in the PDF metadata"
          />
        </InputContainer>

        <InputContainer label="Creator">
          <input
            type="text"
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            placeholder="Your name (optional)"
            title="Creator name that will be embedded in the PDF metadata"
          />
        </InputContainer>

        <InputContainer label="Author">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name (optional)"
            title="Author name that will be embedded in the PDF metadata"
          />
        </InputContainer>

        <InputContainer label="Filename">
          <input
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
          Export PDF
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
          onClick={handleCopyUrls}
          className="btn"
          disabled={sortedImages.length === 0}
          title="Copy FlippingBook URLs to clipboard"
        >
          Copy URLs
        </button>
      </div>
    </div>
  )
}
