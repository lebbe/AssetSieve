import { Display } from '../../components/Display'
import { Export } from './components/Export'
import { Filter } from './components/Filter'
import { ImageItem } from './components/ImageItem'
import { PanelCard } from '../../components/PanelCard'
import { Sorting } from './components/Sorting'
import { useDisplayOptions } from '../../hooks/useDisplayOptions'
import { useDragAndDrop } from '../../hooks/useDragAndDrop'
import { useFilter } from '../../hooks/useFilter'
import { NetworkRequest } from '../../hooks/useRequestSniffing'
import { useImageSniffer, ImageData } from '../../hooks/useImageSniffer'
import { useSorting } from '../../hooks/useSorting'

import './Images.css'

type Props = {
  requests: NetworkRequest[]
  removeRequest: (url: string) => void
  onSendToMagForge: (images: ImageData[]) => void
  countUniqueImages: (images: ImageData[]) => number
}

export function Images({
  requests,
  removeRequest,
  onSendToMagForge,
  countUniqueImages,
}: Props) {
  const { images } = useImageSniffer(requests)

  const {
    filteredImages,
    availableFileTypes,
    filters,
    clearFilters,
    handleFileTypeToggle,
    handleInputChange,
  } = useFilter(images)
  const {
    sortedImages,
    sortBy,
    setSortBy,
    reversed,
    setReversed,
    setImageOrder,
  } = useSorting(filteredImages)

  const {
    previewSize,
    setPreviewSize,
    density,
    setDensity,
    showDetails,
    setShowDetails,
  } = useDisplayOptions()

  const {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
  } = useDragAndDrop(sortedImages, setImageOrder)

  return (
    <div className="image-analysis">
      {images.length > 0 && (
        <PanelCard title="Filters">
          <Filter
            availableFileTypes={availableFileTypes}
            filters={filters}
            handleInputChange={handleInputChange}
            handleFileTypeToggle={handleFileTypeToggle}
            clearFilters={clearFilters}
            filteredImages={filteredImages}
            totalImages={images.length}
          />
        </PanelCard>
      )}
      {filteredImages.length > 0 && (
        <div className="control-panels">
          <PanelCard title="Sorting">
            <Sorting
              sortBy={sortBy}
              setSortBy={setSortBy}
              reversed={reversed}
              setReversed={setReversed}
              totalImages={filteredImages.length}
            />
          </PanelCard>
          <PanelCard title="Display">
            <Display
              previewSize={previewSize}
              setPreviewSize={setPreviewSize}
              density={density}
              setDensity={setDensity}
              showDetails={showDetails}
              setShowDetails={setShowDetails}
            />
          </PanelCard>
        </div>
      )}
      {sortedImages.length > 0 && (
        <PanelCard className="export-panel-card" title="Export">
          <Export
            sortedImages={sortedImages}
            onSendToMagForge={onSendToMagForge}
            countUniqueImages={countUniqueImages}
          />
        </PanelCard>
      )}
      <h2>Detected Images ({sortedImages.length})</h2>
      {images.length === 0 ? (
        <div className="no-images">
          <p>
            No images detected yet. Browse to a website to see images being
            captured.
          </p>
        </div>
      ) : (
        <div className={`images-grid images-grid--${density}`}>
          {sortedImages.map((image, index) => (
            <ImageItem
              key={`${image.url}-${index}`}
              image={image}
              size={previewSize}
              showDetails={showDetails}
              index={index}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDelete={removeRequest}
              isDragging={draggedIndex === index}
              dragOverIndex={dragOverIndex}
            />
          ))}
        </div>
      )}
    </div>
  )
}
