import { FlippingBookPair } from '../hooks/useCombiner'
import '../../../components/Button.css'
import { createPDF } from '../utils/createNewPage'

interface ExportProps {
  sortedImages: FlippingBookPair[]
}

export function Export({ sortedImages }: ExportProps) {
  async function handleExportToPDF() {
    try {
      const pdf = await createPDF(sortedImages)
      pdf.save('flippingbook.pdf')
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

      <div className="export-info">
        <p className="export-note">
          FlippingBooks will be combined (WebP + SVG overlay) into a PDF
          document. Each page will contain one FlippingBook with properly
          layered images.
        </p>
      </div>
    </div>
  )
}
