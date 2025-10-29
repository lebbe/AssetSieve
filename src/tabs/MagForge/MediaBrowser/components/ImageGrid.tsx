import { ImageData } from '../../../../hooks/useImageSniffer'
import './ImageGrid.css'

type Props = {
  images: ImageData[]
  previewSize: number
  usedImageUrls: Set<string>
  deleteImage: (url: string) => void
}

export function ImageGrid({
  images,
  previewSize,
  usedImageUrls,
  deleteImage,
}: Props) {
  const handleDragStart = (e: React.DragEvent, image: ImageData) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/json', JSON.stringify(image))
  }

  const handleDelete = (
    e: React.MouseEvent,
    imageUrl: string,
    isUsed: boolean,
  ) => {
    e.stopPropagation() // Prevent drag from starting
    if (!isUsed) {
      deleteImage(imageUrl)
    }
  }

  return (
    <div className="media-browser-grid">
      {images.map((image, index) => {
        const isUsed = usedImageUrls.has(image.url)
        return (
          <div
            key={`${image.url}-${index}`}
            className={`media-browser-item ${isUsed ? 'media-browser-item--used' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, image)}
            style={{
              width: `${previewSize}px`,
              height: `${previewSize}px`,
            }}
          >
            <img src={image.url} alt="" draggable={false} />
            {isUsed && <div className="used-badge">Used</div>}
            <button
              className={`delete-button ${isUsed ? 'delete-button--disabled' : ''}`}
              onClick={(e) => handleDelete(e, image.url, isUsed)}
              disabled={isUsed}
              title={isUsed ? 'Cannot delete: Image is used on canvas' : 'Delete image'}
              aria-label={isUsed ? 'Cannot delete: Image is used on canvas' : 'Delete image'}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
