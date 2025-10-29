import { useState } from 'react'
import { PlacedImage as PlacedImageType } from '../types/page'
import { PlacedImage } from './PlacedImage'
import './Canvas.css'

type Props = {
  width: number
  height: number
  images: PlacedImageType[]
  onImagesChange: (images: PlacedImageType[]) => void
  userZoom: number
}

export function Canvas({
  width,
  height,
  images,
  onImagesChange,
  userZoom,
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
      const x = (e.clientX - rect.left) / userZoom
      const y = (e.clientY - rect.top) / userZoom

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

      const newImage: PlacedImageType = {
        id: `${Date.now()}-${Math.random()}`,
        image,
        x: x - placedWidth / 2, // Center on drop point
        y: y - placedHeight / 2,
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

  const handleDeleteSelected = () => {
    if (selectedImageId) {
      onImagesChange(images.filter((img) => img.id !== selectedImageId))
      setSelectedImageId(null)
    }
  }

  // Handle keyboard delete
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' && selectedImageId) {
      handleDeleteSelected()
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
        >
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
