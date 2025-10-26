import { useState } from 'react'
import { FlippingBookPair } from '../hooks/useCombiner'
import { downloadCombinedImage } from '../../../utils/combinedImageGenerator'
import './FlippingbookItem.css'
import '../../../components/Button.css'

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getCleanFilename = (url: string): string => {
  try {
    const urlObj = new URL(url)
    return urlObj.pathname.split('/').pop() || url
  } catch {
    // Fallback for relative URLs or malformed URLs
    const filename = url.split('/').pop() || url
    return filename.split('?')[0] // Remove query parameters
  }
}

type Props = {
  flippingBook: FlippingBookPair
  size: 'small' | 'medium' | 'large'
  showDetails?: 'full' | 'minimal' | 'none'
  index: number
  onDragStart?: (index: number) => void
  onDragEnd?: () => void
  onDragOver?: (index: number) => void
  onDelete?: (url: string) => void
  isDragging?: boolean
  dragOverIndex?: number | null
}

export function FlippingbookItem({
  flippingBook,
  size,
  showDetails = 'full',
  index,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDelete,
  isDragging,
  dragOverIndex,
}: Props) {
  const [isDragEnabled, setIsDragEnabled] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    onDragStart?.(index)
  }

  const handleDragEnd = () => {
    onDragEnd?.()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    onDragOver?.(index)
  }

  const handleClick = async () => {
    try {
      await downloadCombinedImage(flippingBook, {
        format: 'png',
        quality: 0.95,
        filename: `${flippingBook.filename}_combined.png`,
      })
    } catch (error) {
      console.error('Failed to generate combined FlippingBook image:', error)
      // Fallback: open WebP URL
      window.open(flippingBook.webp.url, '_blank')
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(flippingBook.webp.url)
  }

  // WebP as background layer
  const webpSrc = flippingBook.webp.base64
    ? `data:${flippingBook.webp.mimeType};base64,${flippingBook.webp.base64}`
    : flippingBook.webp.url

  // SVG as overlay layer (optional)
  const svgSrc = flippingBook.svg
    ? flippingBook.svg.base64
      ? `data:${flippingBook.svg.mimeType};base64,${flippingBook.svg.base64}`
      : flippingBook.svg.url
    : null

  const itemClasses = [
    'flippingbook-item',
    `flippingbook-item--${size}`,
    isDragging ? 'flippingbook-item--dragging' : '',
    dragOverIndex === index ? 'flippingbook-item--drag-over' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={itemClasses}
      draggable={isDragEnabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div
        className="drag-handle"
        title="Drag to reorder"
        onMouseEnter={() => setIsDragEnabled(true)}
        onMouseLeave={() => setIsDragEnabled(false)}
      >
        ⋮⋮
      </div>
      <div className="flippingbook-preview">
        {/* WebP background layer */}
        <img
          src={webpSrc}
          alt={`FlippingBook: ${flippingBook.filename}`}
          className="flippingbook-thumbnail flippingbook-background"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
        {/* SVG overlay layer (optional) */}
        {svgSrc && (
          <img
            src={svgSrc}
            alt={`FlippingBook overlay: ${flippingBook.filename}`}
            className="flippingbook-thumbnail flippingbook-overlay"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        )}
      </div>

      {showDetails !== 'none' && (
        <div className="flippingbook-info">
          <div className="flippingbook-url">{flippingBook.filename}</div>

          {showDetails === 'full' && (
            <div className="flippingbook-details">
              <span
                className="flippingbook-type flippingbook-type--clickable"
                onClick={handleClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleClick()
                  }
                }}
                title={
                  flippingBook.svg
                    ? 'Click to download combined image'
                    : 'Click to open WebP image'
                }
              >
                {flippingBook.svg ? 'COMBINED' : 'WEBP-ONLY'}
              </span>
              <span className="flippingbook-size">
                {formatFileSize(flippingBook.size)}
              </span>
              {flippingBook.width && flippingBook.height && (
                <span className="flippingbook-dimensions">
                  {flippingBook.width}×{flippingBook.height}
                </span>
              )}
              <div className="flippingbook-files">
                <div className="flippingbook-file">
                  <span className="flippingbook-file-label">WebP:</span>
                  <span className="flippingbook-file-name">
                    {getCleanFilename(flippingBook.webp.url)}
                  </span>
                </div>
                {flippingBook.svg && (
                  <div className="flippingbook-file">
                    <span className="flippingbook-file-label">SVG:</span>
                    <span className="flippingbook-file-name">
                      {getCleanFilename(flippingBook.svg.url)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        className="flippingbook-delete btn btn-red btn--small"
        onClick={handleDelete}
        aria-label="Remove flippingbook"
        title="Remove flippingbook"
      >
        ×
      </button>
    </div>
  )
}
