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

type InteractionMode =
  | 'none'
  | 'dragging'
  | 'resizing'
  | 'cropping-right'
  | 'cropping-bottom'
  | 'panning'
  | 'rotating-tl'
  | 'rotating-tr'
  | 'rotating-bl'
  | 'rotating-br'

export function PlacedImage({
  placedImage,
  isSelected,
  onClick,
  onUpdate,
  scale,
}: Props) {
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('none')
  const [cursor, setCursor] = useState('grab')
  const dragStart = useRef({
    x: 0,
    y: 0,
    imageX: 0,
    imageY: 0,
    width: 0,
    height: 0,
    croppedX: 0,
    croppedY: 0,
    croppedWidth: 0,
    croppedHeight: 0,
    rotation: 0,
    centerX: 0,
    centerY: 0,
  })

  // Get current crop values or defaults
  const getCropValues = () => {
    return {
      croppedWidth: placedImage.croppedWidth ?? placedImage.width,
      croppedHeight: placedImage.croppedHeight ?? placedImage.height,
      croppedX: placedImage.croppedX ?? 0,
      croppedY: placedImage.croppedY ?? 0,
      maxWidth: placedImage.width,
      maxHeight: placedImage.height,
    }
  }

  const getInteractionZone = (e: React.MouseEvent, rect: DOMRect): InteractionMode => {
    if (!placedImage.isEditing) {
      return 'none'
    }

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const edgeThreshold = 10 // pixels
    const cornerThreshold = 15 // pixels

    const isNearRight = x >= rect.width - edgeThreshold
    const isNearBottom = y >= rect.height - edgeThreshold
    const isNearLeft = x <= cornerThreshold
    const isNearTop = y <= cornerThreshold

    // Check corners first (for rotation)
    if (isNearLeft && isNearTop) return 'rotating-tl'
    if (isNearRight && isNearTop) return 'rotating-tr'
    if (isNearLeft && isNearBottom) return 'rotating-bl'
    if (isNearRight && isNearBottom) return 'rotating-br'

    // Check edges (for cropping)
    if (isNearRight) return 'cropping-right'
    if (isNearBottom) return 'cropping-bottom'

    // Center area (for panning if cropped)
    const cropValues = getCropValues()
    if (cropValues.croppedWidth < cropValues.maxWidth || cropValues.croppedHeight < cropValues.maxHeight) {
      return 'panning'
    }

    return 'none'
  }

  const updateCursor = (zone: InteractionMode) => {
    const cursorMap: Record<InteractionMode, string> = {
      none: 'default',
      dragging: 'grabbing',
      resizing: 'nwse-resize',
      'cropping-right': 'ew-resize',
      'cropping-bottom': 'ns-resize',
      panning: 'move',
      'rotating-tl': 'alias', // Using alias as a rotation cursor approximation
      'rotating-tr': 'alias',
      'rotating-bl': 'alias',
      'rotating-br': 'alias',
    }
    setCursor(cursorMap[zone] || 'default')
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (interactionMode === 'none') return

      const dx = (e.clientX - dragStart.current.x) / scale
      const dy = (e.clientY - dragStart.current.y) / scale

      if (interactionMode === 'dragging') {
        // Normal dragging (move entire image)
        onUpdate({
          ...placedImage,
          x: dragStart.current.imageX + dx,
          y: dragStart.current.imageY + dy,
        })
      } else if (interactionMode === 'resizing') {
        // Normal resizing (scale entire image)
        let aspectRatio = placedImage.image.width / placedImage.image.height
        if (!isFinite(aspectRatio) || aspectRatio <= 0) {
          aspectRatio = placedImage.width / placedImage.height
        }

        const newWidth = Math.max(50, dragStart.current.width + dx)
        const newHeight = newWidth / aspectRatio

        onUpdate({
          ...placedImage,
          width: newWidth,
          height: newHeight,
        })
      } else if (interactionMode === 'cropping-right') {
        // Crop from right edge
        const newCroppedWidth = Math.max(
          50,
          Math.min(dragStart.current.croppedWidth + dx, dragStart.current.width),
        )
        onUpdate({
          ...placedImage,
          croppedWidth: newCroppedWidth,
        })
      } else if (interactionMode === 'cropping-bottom') {
        // Crop from bottom edge
        const newCroppedHeight = Math.max(
          50,
          Math.min(dragStart.current.croppedHeight + dy, dragStart.current.height),
        )
        onUpdate({
          ...placedImage,
          croppedHeight: newCroppedHeight,
        })
      } else if (interactionMode === 'panning') {
        // Pan the image within the cropped area
        const maxOffsetX = dragStart.current.width - dragStart.current.croppedWidth
        const maxOffsetY = dragStart.current.height - dragStart.current.croppedHeight

        const newCroppedX = Math.max(0, Math.min(dragStart.current.croppedX - dx, maxOffsetX))
        const newCroppedY = Math.max(0, Math.min(dragStart.current.croppedY - dy, maxOffsetY))

        onUpdate({
          ...placedImage,
          croppedX: newCroppedX,
          croppedY: newCroppedY,
        })
      } else if (
        interactionMode === 'rotating-tl' ||
        interactionMode === 'rotating-tr' ||
        interactionMode === 'rotating-bl' ||
        interactionMode === 'rotating-br'
      ) {
        // Calculate rotation based on mouse position relative to center
        const mouseX = e.clientX / scale
        const mouseY = e.clientY / scale
        const centerX = dragStart.current.centerX
        const centerY = dragStart.current.centerY

        const angle = Math.atan2(mouseY - centerY, mouseX - centerX)
        const rotation = (angle * 180) / Math.PI

        onUpdate({
          ...placedImage,
          rotation,
        })
      }
    },
    [interactionMode, scale, placedImage, onUpdate],
  )

  const handleMouseUp = useCallback(() => {
    setInteractionMode('none')
    setCursor('grab')
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()

    const rect = e.currentTarget.getBoundingClientRect()
    const zone = getInteractionZone(e, rect)

    if (placedImage.isEditing && zone !== 'none') {
      // Advanced editing mode
      const cropValues = getCropValues()
      const centerX = placedImage.x + placedImage.width / 2
      const centerY = placedImage.y + placedImage.height / 2

      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        imageX: placedImage.x,
        imageY: placedImage.y,
        width: placedImage.width,
        height: placedImage.height,
        croppedX: cropValues.croppedX,
        croppedY: cropValues.croppedY,
        croppedWidth: cropValues.croppedWidth,
        croppedHeight: cropValues.croppedHeight,
        rotation: placedImage.rotation ?? 0,
        centerX,
        centerY,
      }

      setInteractionMode(zone)
      updateCursor(zone)
    } else if (isSelected && !placedImage.isEditing) {
      // Image is selected but not in editing mode - enter editing mode
      onUpdate({
        ...placedImage,
        isEditing: true,
      })
    } else if (!isSelected) {
      // Select the image first
      onClick()

      // Start dragging
      setInteractionMode('dragging')
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        imageX: placedImage.x,
        imageY: placedImage.y,
        width: placedImage.width,
        height: placedImage.height,
        croppedX: 0,
        croppedY: 0,
        croppedWidth: placedImage.width,
        croppedHeight: placedImage.height,
        rotation: 0,
        centerX: 0,
        centerY: 0,
      }
      setCursor('grabbing')
    }
  }

  const handleHover = (e: React.MouseEvent) => {
    if (interactionMode !== 'none') return

    if (placedImage.isEditing) {
      const rect = e.currentTarget.getBoundingClientRect()
      const zone = getInteractionZone(e, rect)
      updateCursor(zone)
    } else {
      setCursor('grab')
    }
  }

  // Attach global mouse listeners when interacting
  useEffect(() => {
    if (interactionMode !== 'none') {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
    return undefined
  }, [interactionMode, handleMouseMove, handleMouseUp])

  const cropValues = getCropValues()
  const rotation = placedImage.rotation ?? 0

  return (
    <div
      className={`placed-image ${isSelected ? 'placed-image--selected' : ''} ${placedImage.isEditing ? 'placed-image--editing' : ''}`}
      style={{
        left: `${placedImage.x}px`,
        top: `${placedImage.y}px`,
        width: `${cropValues.croppedWidth}px`,
        height: `${cropValues.croppedHeight}px`,
        zIndex: placedImage.zIndex,
        cursor,
        transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'center',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleHover}
    >
      <img
        src={placedImage.image.url}
        alt=""
        draggable={false}
        style={{
          pointerEvents: 'none',
          width: `${placedImage.width}px`,
          height: `${placedImage.height}px`,
          objectFit: 'fill',
          position: 'absolute',
          left: `${-cropValues.croppedX}px`,
          top: `${-cropValues.croppedY}px`,
        }}
      />
    </div>
  )
}
