import { useState, useEffect } from 'react'
import { IIIFImage } from '../hooks/useIIIFDetector'
import { stitchIIIFImage, downloadIIIFImage } from '../utils/iiifStitcher'
import './IIIFItem.css'

interface Props {
  iiifImage: IIIFImage
  size: 'small' | 'medium' | 'large'
  index: number
  onDragStart?: (index: number) => void
  onDragEnd?: () => void
  onDragOver?: (index: number) => void
  onDelete?: (baseUrl: string) => void
  onRename?: (baseUrl: string, newIdentifier: string) => void
  isDragging?: boolean
  dragOverIndex?: number | null
  onImageClick?: (imageUrl: string) => void
}

export function IIIFItem({
  iiifImage,
  size,
  index,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDelete,
  onRename,
  isDragging,
  dragOverIndex,
  onImageClick,
}: Props) {
  const [isDragEnabled, setIsDragEnabled] = useState(false)
  const [isStitching, setIsStitching] = useState(false)
  const [combinedPreview, setCombinedPreview] = useState<string | null>(
    iiifImage.combinedImage || null,
  )
  const [error, setError] = useState<string | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(iiifImage.identifier)

  const tilesWithData = iiifImage.tiles.filter((t) => t.imageData)
  const tilesReady = tilesWithData.length === iiifImage.tiles.length
  const progress =
    iiifImage.tiles.length > 0
      ? Math.round((tilesWithData.length / iiifImage.tiles.length) * 100)
      : 0

  // Create a stable identifier for the tile set (only changes when actual tiles change)
  const tilesSignature = iiifImage.tiles
    .map((t) => `${t.url}:${t.scaledWidth}`)
    .sort()
    .join('|')

  // Reset stitched image when tiles actually change (e.g., higher resolution tiles arrive)
  useEffect(() => {
    // If we have a preview but tiles changed, clear it to trigger re-stitch
    if (combinedPreview) {
      setCombinedPreview(null)
      setError(null)
    }
  }, [tilesSignature])

  // Automatically stitch when all tiles are ready
  useEffect(() => {
    if (tilesReady && !combinedPreview && !isStitching) {
      handleStitch()
    }
  }, [tilesReady, combinedPreview, isStitching])

  const handleStitch = async () => {
    setIsStitching(true)
    setError(null)

    try {
      const combined = await stitchIIIFImage(iiifImage)
      setCombinedPreview(combined)
      iiifImage.combinedImage = combined
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stitch image')
      console.error('Stitching error:', err)
    } finally {
      setIsStitching(false)
    }
  }

  const handleDownload = () => {
    if (combinedPreview) {
      const filename = `${iiifImage.identifier}.png`
      downloadIIIFImage(combinedPreview, filename)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete?.(iiifImage.baseUrl)
  }

  const handleNameClick = () => {
    setIsEditingName(true)
    setEditedName(iiifImage.identifier)
  }

  const handleNameBlur = () => {
    setIsEditingName(false)
    if (editedName.trim() && editedName !== iiifImage.identifier) {
      onRename?.(iiifImage.baseUrl, editedName.trim())
    }
  }

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      setEditedName(iiifImage.identifier)
      setIsEditingName(false)
    }
  }

  const handleImageClick = () => {
    if (combinedPreview) {
      onImageClick?.(combinedPreview)
    }
  }

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div
      className={`iiif-item ${isDragging ? 'iiif-item--dragging' : ''} ${
        dragOverIndex === index ? 'iiif-item--drag-over' : ''
      }`}
      draggable={isDragEnabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className="drag-handle"
        title="Drag to reorder"
        onMouseEnter={() => setIsDragEnabled(true)}
        onMouseLeave={() => setIsDragEnabled(false)}
      >
        ⋮⋮
      </div>
      <button
        className="btn btn-icon btn-red iiif-item__delete"
        onClick={handleDelete}
        title="Delete this image and all its tiles"
        aria-label="Delete image"
      >
        ×
      </button>

      {combinedPreview ? (
        <div
          className={`iiif-item__thumbnail iiif-item__thumbnail--${size}`}
          onClick={handleImageClick}
          title="Click to view full size"
        >
          <img
            src={combinedPreview}
            alt={iiifImage.identifier}
            className="iiif-item__image"
          />
        </div>
      ) : (
        <div className={`iiif-item__thumbnail iiif-item__thumbnail--${size}`}>
          <div className="iiif-item__placeholder">
            {isStitching ? (
              <div className="spinner">⟳</div>
            ) : (
              <span>{progress}%</span>
            )}
          </div>
        </div>
      )}

      <div className="iiif-item__info">
        {isEditingName ? (
          <input
            type="text"
            className="iiif-item__title-input"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            autoFocus
          />
        ) : (
          <div
            className="iiif-item__title"
            title={`${iiifImage.identifier} (click to rename)`}
            onClick={handleNameClick}
          >
            {iiifImage.identifier}
          </div>
        )}
        <div className="iiif-item__meta">
          <span className="meta-item">
            {iiifImage.fullWidth} × {iiifImage.fullHeight}px
          </span>
          <span className="meta-item meta-separator">•</span>
          <span className="meta-item">
            {tilesWithData.length}/{iiifImage.tiles.length} tiles
          </span>
          <span className="meta-item meta-separator">•</span>
          <span
            className={`meta-item ${tilesReady ? 'meta-ready' : 'meta-loading'}`}
          >
            {isStitching
              ? 'Stitching...'
              : tilesReady
                ? 'Ready'
                : `Loading ${progress}%`}
          </span>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={!combinedPreview}
        className="btn btn-green btn-sm iiif-item__download"
        title="Download as PNG"
      >
        Download
      </button>

      {error && <div className="iiif-item__error">{error}</div>}

      <details className="iiif-item__tile-details">
        <summary>Show tiles ({iiifImage.tiles.length})</summary>
        <ul className="iiif-item__tile-list">
          {iiifImage.tiles.map((tile, idx) => (
            <li key={idx} className="iiif-item__tile">
              <span className="tile-position">
                ({tile.x}, {tile.y})
              </span>
              <span className="tile-size">
                {tile.width}×{tile.height}
              </span>
              <span className="tile-scaled">→ {tile.scaledWidth}px</span>
              {tile.imageData ? (
                <span className="tile-status tile-status--loaded">✓</span>
              ) : (
                <span className="tile-status tile-status--pending">⏳</span>
              )}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
