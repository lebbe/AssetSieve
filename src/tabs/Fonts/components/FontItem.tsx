import { FontFileData } from '../../../hooks/useFontSniffer'
import { ShowDetails } from '../../../hooks/useDisplayOptions'
import { useEffect, useRef } from 'react'
import './FontItem.css'

interface FontItemProps {
  font: FontFileData
  showDetails: ShowDetails
  index: number
  onDragStart: (index: number) => void
  onDragEnd: () => void
  onDragOver: (index: number) => void
  onDelete: (url: string) => void
  isDragging: boolean
  dragOverIndex: number | null
}

export function FontItem({
  font,
  showDetails,
  index,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDelete,
  isDragging,
  dragOverIndex,
}: FontItemProps) {
  const styleRef = useRef<HTMLStyleElement | null>(null)

  // Generate a unique font family name for this font instance
  const fontFamilyName = `font-preview-${font.url.replace(/[^a-zA-Z0-9]/g, '-')}-${index}`

  // Inject font-face declaration
  useEffect(() => {
    // Create style element if it doesn't exist
    if (!styleRef.current) {
      styleRef.current = document.createElement('style')
      document.head.appendChild(styleRef.current)
    }

    // Create @font-face declaration
    const fontFaceCSS = `
      @font-face {
        font-family: '${fontFamilyName}';
        src: url(data:${font.mimeType};base64,${font.base64});
      }
    `

    styleRef.current.textContent = fontFaceCSS

    // Cleanup on unmount
    return () => {
      if (styleRef.current && styleRef.current.parentNode) {
        styleRef.current.parentNode.removeChild(styleRef.current)
        styleRef.current = null
      }
    }
  }, [font.base64, font.mimeType, fontFamilyName])
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getClassificationClass = (classification?: string) => {
    if (!classification) return ''
    if (classification.includes('Monospace'))
      return 'font-item__classification--monospace'
    if (classification.includes('Serif') && !classification.includes('Sans'))
      return 'font-item__classification--serif'
    if (classification.includes('Sans-serif'))
      return 'font-item__classification--sans-serif'
    if (classification.includes('Script'))
      return 'font-item__classification--script'
    return ''
  }

  let dragClass = ''
  if (isDragging) {
    dragClass = 'is-dragging'
  } else if (dragOverIndex === index) {
    dragClass = 'drag-over-before'
  } else if (dragOverIndex === index + 1) {
    dragClass = 'drag-over-after'
  }

  return (
    <div
      className={`font-item ${dragClass}`}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(index)
      }}
    >
      <div className="font-item__header">
        <div className="font-item__name">{font.metadata.name}</div>
        <button
          className="font-item__delete"
          onClick={() => onDelete(font.url)}
          title="Remove font"
        >
          ✕
        </button>
      </div>

      <div
        className="font-item__preview"
        style={{ fontFamily: `'${fontFamilyName}', sans-serif` }}
      >
        {font.metadata.sampleText ||
          'The quick brown fox jumps over the lazy dog'}
      </div>

      {showDetails !== 'none' && (
        <div className="font-item__details">
          {showDetails === 'full' && (
            <>
              {font.metadata.fontFamily && (
                <div className="font-item__detail">
                  <span className="font-item__detail-label">Family:</span>
                  <span className="font-item__detail-value">
                    {font.metadata.fontFamily}
                  </span>
                </div>
              )}
              {font.metadata.fontSubfamily && (
                <div className="font-item__detail">
                  <span className="font-item__detail-label">Subfamily:</span>
                  <span className="font-item__detail-value">
                    {font.metadata.fontSubfamily}
                  </span>
                </div>
              )}
              {font.metadata.classification && (
                <div className="font-item__detail">
                  <span className="font-item__detail-label">Type:</span>
                  <span
                    className={`font-item__classification ${getClassificationClass(font.metadata.classification)}`}
                  >
                    {font.metadata.classification}
                  </span>
                </div>
              )}
              <div className="font-item__detail">
                <span className="font-item__detail-label">Format:</span>
                <span className="font-item__detail-value">
                  {font.filename.split('.').pop()?.toUpperCase()}
                </span>
              </div>
              <div className="font-item__detail">
                <span className="font-item__detail-label">Size:</span>
                <span className="font-item__detail-value">
                  {formatFileSize(font.size)}
                </span>
              </div>
              <div className="font-item__detail">
                <span className="font-item__detail-label">Filename:</span>
                <span className="font-item__detail-value">{font.filename}</span>
              </div>
              {font.metadata.designer && (
                <div className="font-item__detail">
                  <span className="font-item__detail-label">Designer:</span>
                  <span className="font-item__detail-value">
                    {font.metadata.designer}
                  </span>
                </div>
              )}
              {font.metadata.version && (
                <div className="font-item__detail">
                  <span className="font-item__detail-label">Version:</span>
                  <span className="font-item__detail-value">
                    {font.metadata.version}
                  </span>
                </div>
              )}
            </>
          )}
          {showDetails === 'minimal' && (
            <>
              {font.metadata.classification && (
                <div className="font-item__detail">
                  <span className="font-item__detail-label">Type:</span>
                  <span
                    className={`font-item__classification ${getClassificationClass(font.metadata.classification)}`}
                  >
                    {font.metadata.classification}
                  </span>
                </div>
              )}
              <div className="font-item__detail">
                <span className="font-item__detail-label">Size:</span>
                <span className="font-item__detail-value">
                  {formatFileSize(font.size)}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
