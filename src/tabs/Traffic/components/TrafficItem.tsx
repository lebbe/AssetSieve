import { NetworkRequest } from '../../../hooks/useRequestSniffing'
import './TrafficItem.css'

interface TrafficItemProps {
  request: NetworkRequest
}

export function TrafficItem({ request }: TrafficItemProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusClass = (status: number) => {
    if (status >= 200 && status < 300) return 'status-success'
    if (status >= 300 && status < 400) return 'status-redirect'
    if (status >= 400 && status < 500) return 'status-client-error'
    if (status >= 500) return 'status-server-error'
    return 'status-unknown'
  }

  const getMethodClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'method-get'
      case 'POST':
        return 'method-post'
      case 'PUT':
        return 'method-put'
      case 'DELETE':
        return 'method-delete'
      case 'PATCH':
        return 'method-patch'
      default:
        return 'method-other'
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="traffic-item">
      <div className="traffic-item-header">
        <span className={`method-badge ${getMethodClass(request.method)}`}>
          {request.method}
        </span>
        <span className={`status-badge ${getStatusClass(request.status)}`}>
          {request.status}
        </span>
        <span className="size-info">{formatSize(request.size)}</span>
        <span className="mime-type">{request.mimeType}</span>
      </div>

      <div className="traffic-item-url">
        <button
          onClick={() => copyToClipboard(request.url)}
          className="url-button"
          title="Click to copy URL"
        >
          {request.url}
        </button>
      </div>

      {request.chromeRequest && (
        <details className="traffic-item-details">
          <summary>Request Details</summary>
          <div className="details-container">
            <div className="detail-row">
              <span className="detail-name">Time:</span>
              <span className="detail-value">{request.time.toFixed(2)}ms</span>
            </div>
            {request.chromeRequest.request?.url && (
              <div className="detail-row">
                <span className="detail-name">Full URL:</span>
                <span className="detail-value">
                  {request.chromeRequest.request.url}
                </span>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  )
}
