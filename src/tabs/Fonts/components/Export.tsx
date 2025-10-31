import { FontFileData } from '../../../hooks/useFontSniffer'
import '../../../components/Button.css'

interface ExportProps {
  sortedFonts: FontFileData[]
}

export function Export({ sortedFonts }: ExportProps) {
  const handleExportAsZip = async () => {
    if (sortedFonts.length === 0) {
      alert('No fonts to export')
      return
    }

    try {
      // Dynamically import jszip
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      // Add each font to the zip
      for (const font of sortedFonts) {
        if (!font.base64) {
          console.warn(`Skipping font without base64 data: ${font.filename}`)
          continue
        }

        // Convert base64 to binary
        const binaryString = atob(font.base64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        // Add file to zip
        zip.file(font.filename, bytes)
      }

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' })

      // Create download link
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `fonts-${Date.now()}.zip`
      link.style.display = 'none'

      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Cleanup
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to create ZIP file:', error)
      alert('Failed to export fonts. Please try again.')
    }
  }

  return (
    <div className="export-container">
      <div className="export-buttons">
        <button
          onClick={handleExportAsZip}
          className="btn btn-green btn-lg"
          disabled={sortedFonts.length === 0}
        >
          Export All as ZIP ({sortedFonts.length})
        </button>
      </div>
    </div>
  )
}
