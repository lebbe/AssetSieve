import { useState, useRef, useEffect, useCallback } from 'react'
import { PlacedImage as PlacedImageType } from '../types/page'
import './PlacedImage.css'

type Props = {
  placedImage: PlacedImageType
  isSelected: boolean
  onClick: () => void
  onUpdate: (updated: PlacedImageType) => void
  scale: number
}

type EditMode = 'move' | 'crop-right' | 'crop-bottom' | 'rotate' | 'drag-image' | null

export function PlacedImage({
  placedImage,
  isSelected,
  onClick,
  onUpdate,
  scale,
}: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editMode, setEditMode] = useState<EditMode>(null)
  const [cursorType, setCursorType] = useState('grab')
  const dragStart = useRef({ x: 0, y: 0, imageX: 0, imageY: 0, croppedX: 0, croppedY: 0, width: 0, height: 0, croppedWidth: 0, croppedHeight: 0, rotation: 0, centerX: 0, centerY: 0 })

  // Get effective dimensions (cropped or full)
  const effectiveWidth = placedImage.croppedWidth ?? placedImage.width
  const effectiveHeight = placedImage.croppedHeight ?? placedImage.height
  const croppedX = placedImage.croppedX ?? 0
  const croppedY = placedImage.croppedY ?? 0
  const rotation = placedImage.rotation ?? 0

  // Detect which part of the image the mouse is over
  const detectEditZone = (e: React.MouseEvent<HTMLDivElement>): EditMode => {
    if (!isEditing) return null

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const edgeThreshold = 10

    // Check corners first (for rotation)
    const isNearCorner = 
      (x < edgeThreshold && y < edgeThreshold) || // top-left
      (x > rect.width - edgeThreshold && y < edgeThreshold) || // top-right
      (x < edgeThreshold && y > rect.height - edgeThreshold) || // bottom-left
      (x > rect.width - edgeThreshold && y > rect.height - edgeThreshold) // bottom-right

    if (isNearCorner) {
      return 'rotate'
    }

    // Check right edge (for horizontal crop)
    if (x > rect.width - edgeThreshold && x < rect.width) {
      return 'crop-right'
    }

    // Check bottom edge (for vertical crop)
    if (y > rect.height - edgeThreshold && y < rect.height) {
      return 'crop-bottom'
    }

    // If cropped, allow dragging the image within the crop area
    if (placedImage.croppedWidth || placedImage.croppedHeight) {
      return 'drag-image'
    }

    return 'move'
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isSelected) {
      onClick()
      setIsEditing(false) // Reset editing mode when selecting
    } else if (!isEditing) {
      // Enter editing mode on second click
      setIsEditing(true)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    
    const mode = detectEditZone(e)
    if (!mode) return

    setEditMode(mode)
    
    const centerX = placedImage.x + effectiveWidth / 2
    const centerY = placedImage.y + effectiveHeight / 2

    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      imageX: placedImage.x,
      imageY: placedImage.y,
      croppedX,
      croppedY,
      width: placedImage.width,
      height: placedImage.height,
      croppedWidth: effectiveWidth,
      croppedHeight: effectiveHeight,
      rotation,
      centerX,
      centerY,
    }
  }

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const edgeThreshold = 10

    // Check corners first (for rotation)
    const isNearCorner = 
      (x < edgeThreshold && y < edgeThreshold) || // top-left
      (x > rect.width - edgeThreshold && y < edgeThreshold) || // top-right
      (x < edgeThreshold && y > rect.height - edgeThreshold) || // bottom-left
      (x > rect.width - edgeThreshold && y > rect.height - edgeThreshold) // bottom-right

    if (isNearCorner) {
      setCursorType('crosshair')
    } else if (x > rect.width - edgeThreshold && x < rect.width) {
      // Right edge
      setCursorType('ew-resize')
    } else if (y > rect.height - edgeThreshold && y < rect.height) {
      // Bottom edge
      setCursorType('ns-resize')
    } else if (placedImage.croppedWidth || placedImage.croppedHeight) {
      // Cropped, allow dragging image
      setCursorType('move')
    } else {
      setCursorType('grab')
    }
  }, [isEditing, placedImage.croppedWidth, placedImage.croppedHeight])

  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!editMode) return

      const dx = (e.clientX - dragStart.current.x) / scale
      const dy = (e.clientY - dragStart.current.y) / scale

      if (editMode === 'move') {
        // Move the entire image
        onUpdate({
          ...placedImage,
          x: dragStart.current.imageX + dx,
          y: dragStart.current.imageY + dy,
        })
      } else if (editMode === 'crop-right') {
        // Crop from the right edge
        const newCroppedWidth = Math.max(50, Math.min(dragStart.current.croppedWidth + dx, dragStart.current.width - dragStart.current.croppedX))
        onUpdate({
          ...placedImage,
          croppedWidth: newCroppedWidth,
        })
      } else if (editMode === 'crop-bottom') {
        // Crop from the bottom edge
        const newCroppedHeight = Math.max(50, Math.min(dragStart.current.croppedHeight + dy, dragStart.current.height - dragStart.current.croppedY))
        onUpdate({
          ...placedImage,
          croppedHeight: newCroppedHeight,
        })
      } else if (editMode === 'rotate') {
        // Calculate rotation angle based on mouse position relative to center
        const centerX = dragStart.current.centerX
        const centerY = dragStart.current.centerY
        const mouseX = placedImage.x + (e.clientX - dragStart.current.x) / scale
        const mouseY = placedImage.y + (e.clientY - dragStart.current.y) / scale
        
        const angle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI)
        onUpdate({
          ...placedImage,
          rotation: angle,
        })
      } else if (editMode === 'drag-image') {
        // Drag the image within the cropped area
        const newCroppedX = Math.max(0, Math.min(dragStart.current.croppedX - dx, dragStart.current.width - dragStart.current.croppedWidth))
        const newCroppedY = Math.max(0, Math.min(dragStart.current.croppedY - dy, dragStart.current.height - dragStart.current.croppedHeight))
        onUpdate({
          ...placedImage,
          croppedX: newCroppedX,
          croppedY: newCroppedY,
        })
      }
    },
    [editMode, scale, placedImage, onUpdate],
  )

  const handleMouseUp = useCallback(() => {
    setEditMode(null)
  }, [])

  // Attach global mouse listeners when in edit mode
  useEffect(() => {
    if (editMode) {
      window.addEventListener('mousemove', handleGlobalMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
    return undefined
  }, [editMode, handleGlobalMouseMove, handleMouseUp])

  return (
    <div
      className={`placed-image ${isSelected ? 'placed-image--selected' : ''} ${isEditing ? 'placed-image--editing' : ''}`}
      style={{
        left: `${placedImage.x}px`,
        top: `${placedImage.y}px`,
        width: `${effectiveWidth}px`,
        height: `${effectiveHeight}px`,
        zIndex: placedImage.zIndex,
        cursor: editMode ? 'grabbing' : cursorType,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'center',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      <img
        src={placedImage.image.url}
        alt=""
        draggable={false}
        style={{
          width: `${placedImage.width}px`,
          height: `${placedImage.height}px`,
          objectFit: 'none',
          objectPosition: `-${croppedX}px -${croppedY}px`,
          pointerEvents: 'none',
        }}
      />
      {isSelected && !isEditing && (
        <div className="edit-hint">Click to edit</div>
      )}
    </div>
  )
}
