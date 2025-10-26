import { Display } from '../../components/Display'
import { Export } from './components/Export'
import { FlippingbookItem } from './components/FlippingbookItem'
import { PanelCard } from '../../components/PanelCard'
import { Sorting } from './components/Sorting'
import { useDisplayOptions } from '../../hooks/useDisplayOptions'
import { useFlippingBookDragAndDrop } from './hooks/useFlippingBookDragAndDrop'

import { NetworkRequest } from '../../hooks/useRequestSniffing'
import { useImageSniffer } from '../../hooks/useImageSniffer'
import { useCombiner } from './hooks/useCombiner'
import { useFlippingBookSorting } from './hooks/useFlippingBookSorting'

import './Flippingbook.css'
import { InputContainer } from '../../components/InputContainer'

type Props = {
  requests: NetworkRequest[]
  removeRequest: (url: string) => void
}

export function Flippingbook({ requests, removeRequest }: Props) {
  const { images } = useImageSniffer(requests)
  const {
    flippingBookPairs,
    pagePattern,
    setPagePattern,
    removeDuplicates,
    setRemoveDuplicates,
  } = useCombiner(images)

  const {
    sortedFlippingBooks,
    sortBy,
    setSortBy,
    reversed,
    setReversed,
    setFlippingBookOrder,
  } = useFlippingBookSorting(flippingBookPairs)

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
      <PanelCard title="Filters">
        <InputContainer label="Page identifier regex">
          <input
            type="text"
            value={pagePattern}
            onChange={(e) => setPagePattern(e.target.value)}
            placeholder="page\\d{4}.*\\.webp"
            title="Regex pattern to match WebP filenames (e.g., page\\d{4}.*\\.webp)"
          />
        </InputContainer>

        <label className="checkbox-label">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={removeDuplicates}
            onChange={(e) => setRemoveDuplicates(e.target.checked)}
            title="Remove duplicate FlippingBooks with identical WebP paths"
          />
          <span className="checkbox-text">Remove duplicates</span>
        </label>
      </PanelCard>
      {flippingBookPairs.length > 0 && (
        <div className="control-panels">
          <PanelCard title="Sorting">
            <Sorting
              sortBy={sortBy}
              setSortBy={setSortBy}
              reversed={reversed}
              setReversed={setReversed}
              totalImages={flippingBookPairs.length}
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
      <h2>
        Detected FlippingBooks ({sortedFlippingBooks.length})
        {removeDuplicates && (
          <span style={{ color: '#007bff', fontSize: '14px' }}>
            {' '}
            • Duplicates removed
          </span>
        )}
      </h2>
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
