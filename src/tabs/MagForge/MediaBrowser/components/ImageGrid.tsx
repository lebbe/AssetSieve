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

  const handleDelete = (e: React.MouseEvent, url: string) => {
    e.stopPropagation()
    deleteImage(url)
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
            {!isUsed && (
              <button
                className="delete-button"
                onClick={(e) => handleDelete(e, image.url)}
                aria-label="Delete image"
                title="Delete image"
              >
                ×
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
