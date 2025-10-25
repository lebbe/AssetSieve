import { FlippingBookPair } from '../hooks/useCombiner'
import '../../../components/Button.css'

interface ExportProps {
  sortedImages: FlippingBookPair[]
}

export function Export({ sortedImages }: ExportProps) {


  const generatePDFHTML = () => {
    const flippingBookPages = sortedImages
      .map((flippingBook, index) => {
        // WebP as background layer
        const webpSrc = flippingBook.webp.base64
          ? `data:${flippingBook.webp.mimeType};base64,${flippingBook.webp.base64}`
          : flippingBook.webp.url

        // SVG as overlay layer - handle both base64 and raw SVG content
        let svgSrc: string
        if (flippingBook.svg.base64) {
          // Check if the "base64" field actually contains raw SVG text
          if (flippingBook.svg.base64.trim().startsWith('<svg')) {
            // Raw SVG content - encode it properly
            const encodedSvg = btoa(flippingBook.svg.base64)
            svgSrc = `data:${flippingBook.svg.mimeType};base64,${encodedSvg}`
          } else {
            // Actual base64 content
            svgSrc = `data:${flippingBook.svg.mimeType};base64,${flippingBook.svg.base64}`
          }
        } else {
          svgSrc = flippingBook.svg.url
        }

        return `
        <div class="flippingbook-page">
          <div class="flippingbook-container">
            <img src="${webpSrc}" 
                 class="flippingbook-background"
                 alt="FlippingBook background ${index + 1}" />
            <img src="${svgSrc}" 
                 class="flippingbook-overlay"
                 alt="FlippingBook overlay ${index + 1}" />
          </div>
        </div>
      `
      })
      .join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>FlippingBook Export</title>
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
          .flippingbook-page {
            page-break-after: always;
            page-break-inside: avoid;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100vw;
            height: 100vh;
          }
          .flippingbook-page:last-child {
            page-break-after: avoid;
          }
          .flippingbook-container {
            position: relative;
            max-width: 100%;
            max-height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .flippingbook-background,
          .flippingbook-overlay {
            max-width: 100%;
            max-height: 100vh;
            object-fit: contain;
          }
          .flippingbook-background {
            display: block;
          }
          .flippingbook-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
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
        ${flippingBookPages}
      </body>
      </html>
    `
  }

  const handleExportToPDF = async () => {
    if (sortedImages.length === 0) {
      alert('No FlippingBooks to export to PDF')
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

      chrome.devtools.inspectedWindow.eval(script, (result, isException) => {
        if (isException) {
          console.error('PDF export failed:', isException)
          alert(`PDF export failed: ${isException.value || 'Unknown error'}`)
        } else {
          console.log('PDF export result:', result)
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
          Export to PDF ({sortedImages.length} FlippingBooks)
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
          FlippingBooks will be combined (WebP + SVG overlay) into a PDF document. 
          Each page will contain one FlippingBook with properly layered images.
        </p>
      </div>
    </div>
  )
}
