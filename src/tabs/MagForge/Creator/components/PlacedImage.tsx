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

export function PlacedImage({
  placedImage,
  isSelected,
  onClick,
  onUpdate,
  scale,
}: Props) {
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode>('none')
  const [cursor, setCursor] = useState('grab')
  const dragDistance = useRef(0)
  const justSelected = useRef(false)
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
  })

  const getCropValues = () => {
    const rawCroppedWidth = placedImage.croppedWidth ?? placedImage.width
    const rawCroppedHeight = placedImage.croppedHeight ?? placedImage.height
    const rawCroppedX = placedImage.croppedX ?? 0
    const rawCroppedY = placedImage.croppedY ?? 0

    const croppedWidth = Math.min(rawCroppedWidth, placedImage.width)
    const croppedHeight = Math.min(rawCroppedHeight, placedImage.height)

    const maxOffsetX = placedImage.width - croppedWidth
    const maxOffsetY = placedImage.height - croppedHeight

    const croppedX = Math.max(0, Math.min(rawCroppedX, maxOffsetX))
    const croppedY = Math.max(0, Math.min(rawCroppedY, maxOffsetY))

    return {
      croppedWidth,
      croppedHeight,
      croppedX,
      croppedY,
      maxWidth: placedImage.width,
      maxHeight: placedImage.height,
    }
  }

  const getInteractionZone = useCallback(
    (e: React.MouseEvent, rect: DOMRect): InteractionMode => {
      if (!placedImage.isEditing) {
        return 'none'
      }

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const edgeThreshold = 10 // pixels

      const isNearRight = x >= rect.width - edgeThreshold
      const isNearBottom = y >= rect.height - edgeThreshold

      // Check edges (for cropping)
      if (isNearRight) return 'cropping-right'
      if (isNearBottom) return 'cropping-bottom'

      // Center area (for panning if cropped)
      const cropValues = getCropValues()
      if (
        cropValues.croppedWidth < cropValues.maxWidth ||
        cropValues.croppedHeight < cropValues.maxHeight
      ) {
        return 'panning'
      }

      return 'none'
    },
    [
      placedImage.isEditing,
      placedImage.width,
      placedImage.height,
      placedImage.croppedWidth,
      placedImage.croppedHeight,
      placedImage.croppedX,
      placedImage.croppedY,
    ],
  )

  const updateCursor = (zone: InteractionMode) => {
    const cursorMap: Record<InteractionMode, string> = {
      none: 'default',
      dragging: 'grabbing',
      resizing: 'nwse-resize',
      'cropping-right': 'ew-resize',
      'cropping-bottom': 'ns-resize',
      panning: 'move',
    }
    setCursor(cursorMap[zone] || 'default')
  }

  const initializeDragStart = useCallback(
    (e: React.MouseEvent, useCropValues = false) => {
      const cropValues = useCropValues ? getCropValues() : null
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        imageX: placedImage.x,
        imageY: placedImage.y,
        width: placedImage.width,
        height: placedImage.height,
        croppedX: cropValues?.croppedX ?? 0,
        croppedY: cropValues?.croppedY ?? 0,
        croppedWidth: cropValues?.croppedWidth ?? placedImage.width,
        croppedHeight: cropValues?.croppedHeight ?? placedImage.height,
      }
    },
    [
      placedImage.x,
      placedImage.y,
      placedImage.width,
      placedImage.height,
      placedImage.croppedX,
      placedImage.croppedY,
      placedImage.croppedWidth,
      placedImage.croppedHeight,
    ],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (interactionMode === 'none') return

      const dx = (e.clientX - dragStart.current.x) / scale
      const dy = (e.clientY - dragStart.current.y) / scale

      dragDistance.current = Math.sqrt(dx * dx + dy * dy)

      if (interactionMode === 'dragging') {
        // Normal dragging (move entire image)
        onUpdate({
          ...placedImage,
          x: dragStart.current.imageX + dx,
          y: dragStart.current.imageY + dy,
        })
      } else if (interactionMode === 'resizing') {
        let aspectRatio = placedImage.image.width / placedImage.image.height
        if (!isFinite(aspectRatio) || aspectRatio <= 0) {
          aspectRatio = placedImage.width / placedImage.height
        }

        const newWidth = Math.max(50, dragStart.current.width + dx)
        const newHeight = newWidth / aspectRatio

        // Scale crop dimensions proportionally when resizing
        const scaleX = newWidth / dragStart.current.width
        const scaleY = newHeight / dragStart.current.height

        onUpdate({
          ...placedImage,
          width: newWidth,
          height: newHeight,
          croppedWidth: dragStart.current.croppedWidth * scaleX,
          croppedHeight: dragStart.current.croppedHeight * scaleY,
          croppedX: dragStart.current.croppedX * scaleX,
          croppedY: dragStart.current.croppedY * scaleY,
        })
      } else if (interactionMode === 'cropping-right') {
        // Crop from right edge
        const newCroppedWidth = Math.max(
          50,
          Math.min(
            dragStart.current.croppedWidth + dx,
            dragStart.current.width,
          ),
        )
        onUpdate({
          ...placedImage,
          croppedWidth: newCroppedWidth,
        })
      } else if (interactionMode === 'cropping-bottom') {
        // Crop from bottom edge
        const newCroppedHeight = Math.max(
          50,
          Math.min(
            dragStart.current.croppedHeight + dy,
            dragStart.current.height,
          ),
        )
        onUpdate({
          ...placedImage,
          croppedHeight: newCroppedHeight,
        })
      } else if (interactionMode === 'panning') {
        const maxOffsetX =
          dragStart.current.width - dragStart.current.croppedWidth
        const maxOffsetY =
          dragStart.current.height - dragStart.current.croppedHeight

        const newCroppedX = Math.max(
          0,
          Math.min(dragStart.current.croppedX - dx, maxOffsetX),
        )
        const newCroppedY = Math.max(
          0,
          Math.min(dragStart.current.croppedY - dy, maxOffsetY),
        )

        onUpdate({
          ...placedImage,
          croppedX: newCroppedX,
          croppedY: newCroppedY,
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
    dragDistance.current = 0

    const rect = e.currentTarget.getBoundingClientRect()
    const zone = getInteractionZone(e, rect)

    if (placedImage.isEditing && zone !== 'none') {
      // Advanced editing mode - perform interaction
      initializeDragStart(e, true)
      setInteractionMode(zone)
      updateCursor(zone)
    } else if (isSelected && !placedImage.isEditing) {
      // Image is selected but not in editing mode - start dragging
      setInteractionMode('dragging')
      initializeDragStart(e, false)
      setCursor('grabbing')
    } else if (!isSelected) {
      onClick()
      justSelected.current = true

      setInteractionMode('dragging')
      initializeDragStart(e, false)
      setCursor('grabbing')
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    const clickThreshold = 5
    if (dragDistance.current > clickThreshold) {
      dragDistance.current = 0
      return
    }

    // If the image was just selected in handleMouseDown, don't toggle edit mode yet
    if (justSelected.current) {
      justSelected.current = false
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const zone = getInteractionZone(e, rect)

    if (!isSelected) {
      // When clicking an unselected image, ensure it's not in edit mode
      if (placedImage.isEditing) {
        onUpdate({
          ...placedImage,
          isEditing: false,
        })
      }
    } else if (isSelected && placedImage.isEditing && zone === 'none') {
      // Exit editing mode
      onUpdate({
        ...placedImage,
        isEditing: false,
      })
    } else if (isSelected && !placedImage.isEditing) {
      // Enter editing mode (click only triggers if no drag happened)
      onUpdate({
        ...placedImage,
        isEditing: true,
      })
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
    setInteractionMode('resizing')
    initializeDragStart(e, true)
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
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
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
      {isSelected && !placedImage.isEditing && (
        <div className="resize-handle" onMouseDown={handleResizeMouseDown} />
      )}
    </div>
  )
}
