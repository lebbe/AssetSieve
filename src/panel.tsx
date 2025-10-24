import { createRoot } from 'react-dom/client'

import './panel.css'
import { useRequestSniffing } from './hooks/useRequestSniffing'
import { useImageSniffer } from './hooks/useImageSniffer'
import { Filter } from './components/Filter'
import { useFilter } from './hooks/useFilter'

function Panel() {
  const { requests } = useRequestSniffing()
  const { images } = useImageSniffer(requests)
  const {
    filteredImages,
    availableFileTypes,
    filters,
    clearFilters,
    handleFileTypeToggle,
    handleInputChange,
  } = useFilter(images)

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

  return (
    <div className="container">
      <h1>AssetSieve</h1>
      <div className="image-analysis">
        {images.length > 0 && (
          <Filter
            availableFileTypes={availableFileTypes}
            filters={filters}
            handleInputChange={handleInputChange}
            handleFileTypeToggle={handleFileTypeToggle}
            clearFilters={clearFilters}
            filteredImages={filteredImages}
            totalImages={images.length}
          />
        )}
        <h2>Detected Images ({filteredImages.length})</h2>
        {images.length === 0 ? (
          <div className="no-images">
            <p>
              No images detected yet. Browse to a website to see images being
              captured.
            </p>
          </div>
        ) : (
          <div className="images-grid">
            {filteredImages.map((image, index) => (
              <div key={index} className="image-card">
                <div className="image-thumbnail">
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
                    <a
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
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
                      <span className="info-value">
                        {formatFileSize(image.size)}
                      </span>
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Mount the React component
const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<Panel />)
}
