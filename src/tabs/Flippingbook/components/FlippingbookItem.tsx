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
    return filename.split('?')[0] as string // Remove query parameters
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

  const handleDownloadWebP = (e: React.MouseEvent) => {
    e.stopPropagation()
    const link = document.createElement('a')
    link.href = flippingBook.webp.url
    link.download = `${flippingBook.filename}.webp`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadSVG = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!flippingBook.svg) return

    const link = document.createElement('a')
    link.href = flippingBook.svg.url
    link.download = `${flippingBook.filename}.svg`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleDownloadBoth(e: React.MouseEvent) {
    handleDownloadWebP(e)
    // Download SVG if available
    if (flippingBook.svg) {
      await new Promise((resolve) => setTimeout(resolve, 100)) // Small delay to avoid browser blocking multiple downloads
      handleDownloadSVG(e)
    }
  }

  async function handleAllDownloads(e: React.MouseEvent) {
    await handleDownloadBoth(e)
    await new Promise((resolve) => setTimeout(resolve, 150)) // Small delay
    handleClick()
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

      <div className="flippingbook-info">
        {showDetails !== 'none' && (
          <>
            <div className="flippingbook-url">{flippingBook.filename}</div>

            {showDetails === 'full' && (
              <>
                <span className="flippingbook-size">
                  {formatFileSize(flippingBook.size)}
                </span>
                {flippingBook.width && flippingBook.height && (
                  <span className="flippingbook-dimensions">
                    {flippingBook.width}×{flippingBook.height}
                  </span>
                )}
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
              </>
            )}
          </>
        )}
      </div>

      <div className="downloadButtons">
        <button
          className="btn btn-sm btn-blue"
          data-testid="download-combined-button"
          onClick={handleClick}
          aria-label="Download WebP file"
          title="Download WebP file"
        >
          Combined
        </button>
        <button
          className="btn btn-sm btn-blue"
          onClick={handleDownloadWebP}
          aria-label="Download WebP file"
          title="Download WebP file"
        >
          WebP
        </button>

        {flippingBook.svg && (
          <>
            <button
              className="btn btn-sm btn-green"
              onClick={handleDownloadSVG}
              aria-label="Download SVG file"
              title="Download SVG file"
            >
              SVG
            </button>
            <button
              className="btn btn-sm"
              onClick={handleDownloadBoth}
              aria-label="Download both WebP and SVG files"
              title="Download both WebP and SVG files"
            >
              Both
            </button>
          </>
        )}

        <button
          className="btn btn-sm btn-green"
          data-testid="download-all-button"
          onClick={handleAllDownloads}
          aria-label="Download both WebP, SVG and combined png"
          title="Download both WebP, SVG and combined png"
        >
          All
        </button>
      </div>

      <div className="flippingbook-actions">
        <button
          className="flippingbook-delete btn btn-red btn-sm"
          onClick={handleDelete}
          aria-label="Remove flippingbook"
          title="Remove flippingbook"
        >
          ×
        </button>
      </div>
    </div>
  )
}
