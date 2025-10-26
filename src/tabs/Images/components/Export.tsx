import { ImageData } from '../../../hooks/useImageSniffer'
import '../../../components/Button.css'

interface ExportProps {
  sortedImages: ImageData[]
}

export function Export({ sortedImages }: ExportProps) {
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

  const generatePDFHTML = () => {
    const imageElements = sortedImages
      .map((image, index) => {
        return `
        <div class="image-page">
          <img src="data:${image.mimeType};base64,${image.base64}" 
               style="max-width: 100%; max-height: 100vh; object-fit: contain;" 
               alt="Image ${index + 1}" />
        </div>
      `
      })
      .join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>AssetSieve Export</title>
        <style>
          @page {
            margin: 0;
            size: A4;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .image-page {
            page-break-after: always;
            page-break-inside: avoid;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100vw;
            height: 100vh;
          }
          .image-page:last-child {
            page-break-after: avoid;
          }
          img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${imageElements}
      </body>
      </html>
    `
  }

  const handleExportToPDF = async () => {
    if (sortedImages.length === 0) {
      alert('No images to export to PDF')
      return
    }

    try {
      // Generate HTML content
      const htmlContent = generatePDFHTML()

      // Use chrome.devtools.inspectedWindow.eval to open a new window with the content
      const script = `
        (function() {
          const newWindow = window.open('', '_blank', 'width=800,height=600');
          if (!newWindow) {
            throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
          }
          
          newWindow.document.open();
          newWindow.document.write(\`${htmlContent
            .replace(/`/g, '\\`')
            .replace(/\$/g, '\\$')}\`);
          newWindow.document.close();
          
          // Wait for images to load then trigger print
          newWindow.addEventListener('load', function() {
            setTimeout(function() {
              newWindow.print();
            }, 1000);
          });
          
          return 'PDF export initiated';
        })()
      `

      chrome.devtools.inspectedWindow.eval(script, (_, isException) => {
        if (isException) {
          console.error('PDF export failed:', isException)
          alert(`PDF export failed: ${isException.value || 'Unknown error'}`)
        } else {
          // PDF export successful
        }
      })
    } catch (error) {
      console.error('PDF export failed:', error)
      alert(
        `PDF export failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  return (
    <div className="export-container">
      <div className="export-controls">
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
    </div>
  )
}
