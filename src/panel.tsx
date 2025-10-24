import { createRoot } from 'react-dom/client'

import './panel.css'
import { useRequestSniffing } from './hooks/useRequestSniffing'
import { useImageSniffer } from './hooks/useImageSniffer'
import { Filter } from './components/Filter'
import { useFilter } from './hooks/useFilter'
import { Sorting } from './components/Sorting'
import { useSorting } from './hooks/useSorting'
import { useDragAndDrop } from './hooks/useDragAndDrop'
import { ImageItem } from './components/ImageItem'
import { Export } from './components/Export'
import { PreviewSize } from './components/PreviewSize'
import { useState } from 'react'

function Panel() {
  const {
    requests,
    isListening,
    toggleListening,
    reloadPage,
    resetRequests,
    removeRequest,
  } = useRequestSniffing()
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

  const [previewSize, setPreviewSize] = useState<'small' | 'medium' | 'large'>(
    'small'
  )

  const {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
  } = useDragAndDrop(sortedImages, setImageOrder)

  return (
    <div className="container">
      <h1>AssetSieve</h1>
      <div className="controls">
        <button
          onClick={toggleListening}
          className={`btn ${isListening ? 'btn-stop' : 'btn-start'}`}
        >
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>
        <button onClick={reloadPage} className="btn btn-reload">
          Reload Page
        </button>
        <button onClick={resetRequests} className="btn btn-clear">
          Clear Images
        </button>
        <span className="listening-status">
          {isListening
            ? 'Listening for network traffic...'
            : 'Network monitoring paused'}
        </span>
      </div>
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
        {filteredImages.length > 0 && (
          <div className="control-panels">
            <Sorting
              sortBy={sortBy}
              setSortBy={setSortBy}
              reversed={reversed}
              setReversed={setReversed}
              totalImages={filteredImages.length}
            />
            <PreviewSize
              previewSize={previewSize}
              setPreviewSize={setPreviewSize}
            />
          </div>
        )}
        {sortedImages.length > 0 && <Export sortedImages={sortedImages} />}
        <h2>Detected Images ({sortedImages.length})</h2>
        {images.length === 0 ? (
          <div className="no-images">
            <p>
              No images detected yet. Browse to a website to see images being
              captured.
            </p>
          </div>
        ) : (
          <div className="images-grid">
            {sortedImages.map((image, index) => (
              <ImageItem
                key={`${image.url}-${index}`}
                image={image}
                size={previewSize}
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
    </div>
  )
}

// Mount the React component
const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<Panel />)
}
