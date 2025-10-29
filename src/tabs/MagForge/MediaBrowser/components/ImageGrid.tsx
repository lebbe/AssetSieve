import { ImageData } from '../../../../hooks/useImageSniffer'
import './ImageGrid.css'

type Props = {
  images: ImageData[]
  previewSize: number
  usedImageUrls: Set<string>
}

export function ImageGrid({ images, previewSize, usedImageUrls }: Props) {
  const handleDragStart = (e: React.DragEvent, image: ImageData) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/json', JSON.stringify(image))
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
          </div>
        )
      })}
    </div>
  )
}
