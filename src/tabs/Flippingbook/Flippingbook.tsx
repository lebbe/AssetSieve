import { Display } from '../../components/Display'
import { Export } from './components/Export'
import { Filter } from './components/Filter'
import { FlippingbookItem } from './components/FlippingbookItem'
import { PanelCard } from '../../components/PanelCard'
import { Sorting } from './components/Sorting'
import { useDisplayOptions } from '../../hooks/useDisplayOptions'
import { useFlippingBookDragAndDrop } from '../../hooks/useFlippingBookDragAndDrop'
import { useFlippingBookFilter } from '../../hooks/useFlippingBookFilter'
import { NetworkRequest } from '../../hooks/useRequestSniffing'
import { useImageSniffer } from '../../hooks/useImageSniffer'
import { useCombiner } from '../../hooks/useCombiner'
import { useFlippingBookSorting } from '../../hooks/useFlippingBookSorting'

import './Flippingbook.css'

type Props = {
  requests: NetworkRequest[]
  removeRequest: (url: string) => void
}

export function Flippingbook({ requests, removeRequest }: Props) {
  const { images } = useImageSniffer(requests)
  const { flippingBookPairs } = useCombiner(images)

  const {
    filteredFlippingBooks,
    availableFileTypes,
    filters,
    clearFilters,
    handleFileTypeToggle,
    handleInputChange,
  } = useFlippingBookFilter(flippingBookPairs)

  const {
    sortedFlippingBooks,
    sortBy,
    setSortBy,
    reversed,
    setReversed,
    setFlippingBookOrder,
  } = useFlippingBookSorting(filteredFlippingBooks)

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
  } = useFlippingBookDragAndDrop(sortedFlippingBooks, setFlippingBookOrder)

  return (
    <div className="flippingbook-analysis">
      {flippingBookPairs.length > 0 && (
        <PanelCard title="Filters">
          <Filter
            availableFileTypes={availableFileTypes}
            filters={filters}
            handleInputChange={handleInputChange}
            handleFileTypeToggle={handleFileTypeToggle}
            clearFilters={clearFilters}
            filteredImages={filteredFlippingBooks}
            totalImages={flippingBookPairs.length}
          />
        </PanelCard>
      )}
      {filteredFlippingBooks.length > 0 && (
        <div className="control-panels">
          <PanelCard title="Sorting">
            <Sorting
              sortBy={sortBy}
              setSortBy={setSortBy}
              reversed={reversed}
              setReversed={setReversed}
              totalImages={filteredFlippingBooks.length}
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
      {sortedFlippingBooks.length > 0 && (
        <PanelCard className="export-panel-card" title="Export">
          <Export sortedImages={sortedFlippingBooks} />
        </PanelCard>
      )}
      <h2>Detected FlippingBooks ({sortedFlippingBooks.length})</h2>
      {flippingBookPairs.length === 0 ? (
        <div className="no-flippingbooks">
          <p>
            No FlippingBooks detected yet. Browse to a website with
            FlippingBooks to see them being captured.
          </p>
        </div>
      ) : (
        <div className={`flippingbooks-grid flippingbooks-grid--${density}`}>
          {sortedFlippingBooks.map((flippingBook, index) => (
            <FlippingbookItem
              key={`${flippingBook.webp.url}-${index}`}
              flippingBook={flippingBook}
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
