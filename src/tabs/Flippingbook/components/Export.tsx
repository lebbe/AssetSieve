import { FlippingBookPair } from '../hooks/useCombiner'
import '../../../components/Button.css'

interface ExportProps {
  sortedImages: FlippingBookPair[]
}

export function Export({ sortedImages }: ExportProps) {
  const getZeroPadding = (totalCount: number) => {
    return totalCount.toString().length
  }

  const downloadFlippingBook = async (
    flippingBook: FlippingBookPair,
    filename: string
  ) => {
    // For now, download the WebP file (background)
    const webp = flippingBook.webp
    if (!webp.base64) {
      console.warn(`No base64 data for ${filename}`)
      return
    }

    try {
      // Convert base64 to blob
      const byteCharacters = atob(webp.base64)
      const byteNumbers = new Array(byteCharacters.length)

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }

      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: webp.mimeType })

      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading FlippingBook:', error)
    }
  }

  const handleDownloadAll = async () => {
    if (sortedImages.length === 0) return

    const zeroPadding = getZeroPadding(sortedImages.length)

    for (let i = 0; i < sortedImages.length; i++) {
      const flippingBook = sortedImages[i]
      const paddedIndex = (i + 1).toString().padStart(zeroPadding, '0')
      const filename = `flippingbook_${paddedIndex}.webp`

      await downloadFlippingBook(flippingBook, filename)

      // Add small delay to prevent overwhelming the browser
      if (i < sortedImages.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
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
          onClick={handleDownloadAll}
          className="btn btn-green"
          disabled={sortedImages.length === 0}
          title={`Download all ${sortedImages.length} FlippingBooks`}
        >
          Download All FlippingBooks ({sortedImages.length})
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
          FlippingBooks will be downloaded with sequential filenames
          (flippingbook_001.jpg, etc.)
        </p>
      </div>
    </div>
  )
}
