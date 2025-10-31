import { useState } from 'react'
import { useImageSniffer } from '../../hooks/useImageSniffer'
import { NetworkRequest } from '../../hooks/useRequestSniffing'
import { useIIIFDetector } from './hooks/useIIIFDetector'
import { useIIIFFilter } from './hooks/useIIIFFilter'
import { useIIIFSorting } from './hooks/useIIIFSorting'
import { useIIIFDragAndDrop } from './hooks/useIIIFDragAndDrop'
import { IIIFItem } from './components/IIIFItem'
import { Filter } from './components/Filter'
import { Sorting } from './components/Sorting'
import { Export } from './components/Export'
import { ImageModal } from './components/ImageModal'
import { PanelCard } from '../../components/PanelCard'
import './IIIF.css'

type Props = {
  requests: NetworkRequest[]
}

type PreviewSize = 'small' | 'medium' | 'large'

export function IIIF({ requests }: Props) {
  const { images } = useImageSniffer(requests)
  const { iiifImages, detectedTiles } = useIIIFDetector(requests, images)
  const [deletedBaseUrls, setDeletedBaseUrls] = useState<Set<string>>(new Set())

  // Filter out deleted images
  const visibleImages = iiifImages.filter(
    (img) => !deletedBaseUrls.has(img.baseUrl),
  )

  const { filteredImages, filters, handleInputChange, clearFilters } =
    useIIIFFilter(visibleImages)

  const {
    sortedImages,
    sortBy,
    setSortBy,
    reversed,
    setReversed,
    setImageOrder,
  } = useIIIFSorting(filteredImages)

  const [previewSize, setPreviewSize] = useState<PreviewSize>('medium')

  const {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
  } = useIIIFDragAndDrop(sortedImages, setImageOrder)

  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null)

  const handleDelete = (baseUrl: string) => {
    setDeletedBaseUrls((prev) => new Set(prev).add(baseUrl))
  }

  const handleImageClick = (imageUrl: string) => {
    setModalImageUrl(imageUrl)
  }

  const closeModal = () => {
    setModalImageUrl(null)
  }

  return (
    <div className="iiif-container">
      <PanelCard title="IIIF Image Stitcher">
        <div className="iiif-info">
          <p>
            This tab automatically detects IIIF (International Image
            Interoperability Framework) tiled images and stitches them together
            into complete images.
          </p>
          <div className="iiif-stats">
            <span className="stat">
              <strong>{detectedTiles.length}</strong> tiles detected
            </span>
            <span className="stat">
              <strong>{iiifImages.length}</strong> unique images
            </span>
          </div>
        </div>
      </PanelCard>

      {iiifImages.length === 0 ? (
        <PanelCard title="No IIIF Images Detected">
          <div className="iiif-empty">
            <p>
              No IIIF tiled images found in network traffic. Make sure you're
              browsing a page that uses IIIF Image API.
            </p>
            <p className="iiif-example">
              IIIF URLs look like:{' '}
              <code>
                https://example.com/identifier/x,y,w,h/size/rotation/quality.jpg
              </code>
            </p>
          </div>
        </PanelCard>
      ) : (
        <>
          <PanelCard title="Filter Images">
            <Filter
              filters={filters}
              handleInputChange={handleInputChange}
              clearFilters={clearFilters}
              filteredCount={filteredImages.length}
              totalCount={visibleImages.length}
            />
          </PanelCard>

          <div className="control-panels">
            <PanelCard title="Sort Images">
              <Sorting
                sortBy={sortBy}
                setSortBy={setSortBy}
                reversed={reversed}
                setReversed={setReversed}
                totalImages={sortedImages.length}
              />
            </PanelCard>

            <PanelCard title="Display">
              <div className="display-controls">
                <label>
                  Thumbnail Size:
                  <select
                    value={previewSize}
                    onChange={(e) =>
                      setPreviewSize(e.target.value as PreviewSize)
                    }
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </label>
              </div>
            </PanelCard>
          </div>

          <PanelCard title="Export to PDF">
            <Export images={sortedImages} />
          </PanelCard>

          <h2>IIIF Images ({sortedImages.length})</h2>
          <div className="iiif-list">
            {sortedImages.map((iiifImage, index) => (
              <IIIFItem
                key={iiifImage.baseUrl}
                iiifImage={iiifImage}
                size={previewSize}
                index={index}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDelete={handleDelete}
                isDragging={draggedIndex === index}
                dragOverIndex={dragOverIndex}
                onImageClick={handleImageClick}
              />
            ))}
          </div>
        </>
      )}

      {modalImageUrl && (
        <ImageModal imageUrl={modalImageUrl} onClose={closeModal} />
      )}
    </div>
  )
}
