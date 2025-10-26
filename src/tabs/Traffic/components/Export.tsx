import { PanelCard } from '../../../components/PanelCard'
import { NetworkRequest } from '../../../hooks/useRequestSniffing'
import './Export.css'

interface ExportProps {
  requests: NetworkRequest[]
}

export function Export({ requests }: ExportProps) {
  const exportAsJSON = () => {
    const data = requests.map((request) => ({
      url: request.url,
      method: request.method,
      status: request.status,
      mimeType: request.mimeType,
      size: request.size,
      time: request.time,
    }))

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `traffic-export-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportAsCSV = () => {
    const headers = [
      'URL',
      'Method',
      'Status',
      'Content Type',
      'Size (bytes)',
      'Time (ms)',
    ]
    const csvData = [
      headers.join(','),
      ...requests.map((request) =>
        [
          `"${request.url.replace(/"/g, '""')}"`,
          request.method,
          request.status,
          `"${request.mimeType.replace(/"/g, '""')}"`,
          request.size,
          request.time.toFixed(2),
        ].join(','),
      ),
    ].join('\n')

    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `traffic-export-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, '-')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async () => {
    const data = requests
      .map(
        (request) =>
          `${request.method} ${request.status} ${request.url} (${request.mimeType}, ${request.size} bytes)`,
      )
      .join('\n')

    try {
      await navigator.clipboard.writeText(data)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  return (
    <PanelCard title="Export Traffic Data">
      <div className="traffic-export-container">
        <div className="export-buttons">
          <button
            onClick={exportAsJSON}
            className="export-btn"
            disabled={requests.length === 0}
          >
            Export JSON
          </button>
          <button
            onClick={exportAsCSV}
            className="export-btn"
            disabled={requests.length === 0}
          >
            Export CSV
          </button>
          <button
            onClick={copyToClipboard}
            className="export-btn"
            disabled={requests.length === 0}
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </PanelCard>
  )
}
