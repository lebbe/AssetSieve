import { useState } from 'react'
import { PlacedImage as PlacedImageType, GridSettings } from '../types/page'
import { PlacedImage } from './PlacedImage'
import { GridOverlay } from './GridOverlay'
import { snapToGrid } from '../utils/gridSnapping'
import './Canvas.css'

type Props = {
  width: number
  height: number
  images: PlacedImageType[]
  onImagesChange: (images: PlacedImageType[]) => void
  userZoom: number
  gridSettings: GridSettings
}

export function Canvas({
  width,
  height,
  images,
  onImagesChange,
  userZoom,
  gridSettings,
}: Props) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)

  // Helper to extract aspect ratio from SVG viewBox
  const getAspectRatioFromSVG = async (url: string): Promise<number | null> => {
    try {
      const response = await fetch(url)
      const svgText = await response.text()
      const viewBoxMatch = svgText.match(/viewBox=["']([^"']+)["']/)
      if (viewBoxMatch && viewBoxMatch[1]) {
        const values = viewBoxMatch[1].split(/\s+/)
        if (values.length === 4 && values[2] && values[3]) {
          const vbWidth = parseFloat(values[2])
          const vbHeight = parseFloat(values[3])
          if (vbWidth > 0 && vbHeight > 0) {
            return vbWidth / vbHeight
          }
        }
      }
    } catch (error) {
      console.warn('Failed to parse SVG viewBox:', error)
    }
    return null
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    try {
      const data = e.dataTransfer.getData('application/json')
      const image = JSON.parse(
        data,
      ) as import('../../../../hooks/useImageSniffer').ImageData

      const canvasElement = e.currentTarget as HTMLElement
      const rect = canvasElement.getBoundingClientRect()

      // Convert from screen coordinates to canvas coordinates (accounting for zoom)
      const rawX = (e.clientX - rect.left) / userZoom
      const rawY = (e.clientY - rect.top) / userZoom

      // Calculate initial size - use actual pixel dimensions
      let placedWidth: number
      let placedHeight: number

      if (image.width > 0 && image.height > 0) {
        // Use actual dimensions
        placedWidth = image.width
        placedHeight = image.height
      } else {
        // SVG or unknown size - try to get aspect ratio from viewBox
        const isSVG = image.mimeType.includes('svg')
        let aspectRatio = 1 // Default to square

        if (isSVG) {
          const svgAspectRatio = await getAspectRatioFromSVG(image.url)
          if (svgAspectRatio) {
            aspectRatio = svgAspectRatio
          }
        }

        // Use decent default that fits canvas
        const defaultSize = Math.min(width, height) * 0.3 // 30% of smaller canvas dimension
        placedWidth = defaultSize * aspectRatio
        placedHeight = defaultSize
      }

      // Make sure it doesn't exceed canvas dimensions
      if (placedWidth > width || placedHeight > height) {
        const scaleToFit = Math.min(
          (width * 0.8) / placedWidth,
          (height * 0.8) / placedHeight,
        )
        placedWidth *= scaleToFit
        placedHeight *= scaleToFit
      }

      // Center on drop point (before snapping)
      const x = rawX - placedWidth / 2
      const y = rawY - placedHeight / 2

      // Apply grid snapping (check if Alt key is pressed)
      const snapped = snapToGrid(
        x,
        y,
        placedWidth,
        placedHeight,
        width,
        gridSettings,
        e.altKey,
      )

      const newImage: PlacedImageType = {
        id: `${Date.now()}-${Math.random()}`,
        image,
        x: snapped.x,
        y: snapped.y,
        width: placedWidth,
        height: placedHeight,
        zIndex: images.length,
      }

      console.log('Adding image to canvas:', newImage)
      onImagesChange([...images, newImage])
      setSelectedImageId(newImage.id)
    } catch (error) {
      console.error('Failed to parse dropped data:', error)
    }
  }

  const handleImageClick = (id: string) => {
    setSelectedImageId(id)
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on canvas (not on an image)
    if (e.target === e.currentTarget) {
      // Exit editing mode for the selected image
      if (selectedImageId) {
        const selectedImage = images.find((img) => img.id === selectedImageId)
        if (selectedImage?.isEditing) {
          onImagesChange(
            images.map((img) =>
              img.id === selectedImageId ? { ...img, isEditing: false } : img,
            ),
          )
        }
      }
      setSelectedImageId(null)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedImageId) {
      onImagesChange(images.filter((img) => img.id !== selectedImageId))
      setSelectedImageId(null)
    }
  }

  // Handle keyboard delete and escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' && selectedImageId) {
      handleDeleteSelected()
    } else if (e.key === 'Escape' && selectedImageId) {
      // Exit editing mode
      const selectedImage = images.find((img) => img.id === selectedImageId)
      if (selectedImage?.isEditing) {
        onImagesChange(
          images.map((img) =>
            img.id === selectedImageId ? { ...img, isEditing: false } : img,
          ),
        )
      } else {
        setSelectedImageId(null)
      }
    }
  }

  return (
    <div
      className={`canvas-container ${isDragOver ? 'canvas-container--drag-over' : ''}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className="canvas-wrapper"
        style={{
          transform: `scale(${userZoom})`,
          transformOrigin: 'top left',
        }}
      >
        <div
          className="canvas"
          style={{
            width: `${width}px`,
            height: `${height}px`,
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleCanvasClick}
        >
          <GridOverlay
            width={width}
            height={height}
            gridSettings={gridSettings}
          />
          {images.map((placedImage) => (
            <PlacedImage
              key={placedImage.id}
              placedImage={placedImage}
              isSelected={selectedImageId === placedImage.id}
              onClick={() => handleImageClick(placedImage.id)}
              scale={userZoom}
              onUpdate={(updated: PlacedImageType) => {
                onImagesChange(
                  images.map((img) => (img.id === updated.id ? updated : img)),
                )
              }}
              canvasWidth={width}
              gridSettings={gridSettings}
            />
          ))}
          {images.length === 0 && (
            <div className="canvas-placeholder">
              Drag images here to add them to the page
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
