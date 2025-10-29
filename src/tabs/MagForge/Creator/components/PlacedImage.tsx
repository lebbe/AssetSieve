import { useState, useRef, useEffect } from 'react'
import { PlacedImage as PlacedImageType } from '../types/page'
import './PlacedImage.css'

type Props = {
  placedImage: PlacedImageType
  isSelected: boolean
  onClick: () => void
  onUpdate: (updated: PlacedImageType) => void
  scale: number
}

export function PlacedImage({
  placedImage,
  isSelected,
  onClick,
  onUpdate,
  scale,
}: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, imageX: 0, imageY: 0 })
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      e.stopPropagation()
      onClick()
      setIsDragging(true)
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        imageX: placedImage.x,
        imageY: placedImage.y,
      }
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
    setIsResizing(true)
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: placedImage.width,
      height: placedImage.height,
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const dx = (e.clientX - dragStart.current.x) / scale
      const dy = (e.clientY - dragStart.current.y) / scale
      onUpdate({
        ...placedImage,
        x: dragStart.current.imageX + dx,
        y: dragStart.current.imageY + dy,
      })
    } else if (isResizing) {
      const dx = (e.clientX - resizeStart.current.x) / scale

      // Maintain aspect ratio
      // Use the current placed dimensions if original image dimensions are invalid (e.g., SVG)
      let aspectRatio = placedImage.image.width / placedImage.image.height
      if (!isFinite(aspectRatio) || aspectRatio <= 0) {
        aspectRatio = placedImage.width / placedImage.height
      }

      const newWidth = Math.max(50, resizeStart.current.width + dx)
      const newHeight = newWidth / aspectRatio

      onUpdate({
        ...placedImage,
        width: newWidth,
        height: newHeight,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
  }

  // Attach global mouse listeners when dragging/resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
    return undefined
  }, [isDragging, isResizing, scale])

  return (
    <div
      className={`placed-image ${isSelected ? 'placed-image--selected' : ''}`}
      style={{
        left: `${placedImage.x}px`,
        top: `${placedImage.y}px`,
        width: `${placedImage.width}px`,
        height: `${placedImage.height}px`,
        zIndex: placedImage.zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      <img
        src={placedImage.image.url}
        alt=""
        draggable={false}
        style={{ pointerEvents: 'none' }}
      />
      {isSelected && (
        <div className="resize-handle" onMouseDown={handleResizeMouseDown} />
      )}
    </div>
  )
}
