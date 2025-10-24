import { ImageData } from '../hooks/useImageSniffer'
import './ImageItem.css'

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getImageTypeFromMime = (mimeType: string) => {
  return mimeType.split('/')[1]?.toUpperCase() || 'UNKNOWN'
}

type Props = {
  image: ImageData
  size: 'small' | 'medium' | 'large'
}

export function ImageItem({ image, size }: Props) {
  return (
    <div className="image-card">
      <div className={`image-thumbnail image-thumbnail--${size}`}>
        {image.base64 ? (
          <img
            src={`data:${image.mimeType};base64,${image.base64}`}
            alt="Captured image"
            className="thumbnail-img"
          />
        ) : (
          <div className="thumbnail-placeholder">
            <span>No Preview</span>
          </div>
        )}
      </div>
      <div className="image-details">
        <div className="image-url" title={image.url}>
          <a href={image.url} target="_blank" rel="noopener noreferrer">
            {image.url.split('/').pop() || 'Unknown filename'}
          </a>
        </div>
        <div className="image-info">
          <div className="info-row">
            <span className="info-label">Type:</span>
            <span className="info-value type-badge">
              {getImageTypeFromMime(image.mimeType)}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Size:</span>
            <span className="info-value">{formatFileSize(image.size)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Dimensions:</span>
            <span className="info-value">
              {image.width && image.height
                ? `${image.width} × ${image.height}px`
                : 'Unknown'}
            </span>
          </div>
          {image.width && image.height && (
            <div className="info-row">
              <span className="info-label">Aspect Ratio:</span>
              <span className="info-value">
                {(image.width / image.height).toFixed(2)}:1
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
