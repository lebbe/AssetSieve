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
            className="input"
            type="text"
            value={pagePattern}
            onChange={(e) => setPagePattern(e.target.value)}
            list="pagePatterns"
            placeholder="page\\d{4}_5\\.jpg"
            title="Regex pattern to match image filenames. _5 = high resolution JPG, _3 = lower resolution WebP"
          />
          <datalist id="pagePatterns">
            <option value="page\\d{4}_5\\.jpg">High resolution JPG (_5)</option>
            <option value="page\\d{4}_3\\.webp">
              Lower resolution WebP (_3)
            </option>
            <option value="page\\d{4}_\\d+\\.(jpg|jpeg)">
              Any JPG with number suffix
            </option>
            <option value="page\\d{4}_\\d+\\.webp">
              Any WebP with number suffix
            </option>
            <option value="page\\d{4}_\\d+\\.(webp|jpg|jpeg|png)">
              Any image format
            </option>
          </datalist>
        </InputContainer>

        <label className="checkbox-label">
          <input
            type="checkbox"
            className="input"
            checked={removeDuplicates}
            onChange={(e) => setRemoveDuplicates(e.target.checked)}
            title="Remove duplicate FlippingBooks with identical background image paths"
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
              key={`${flippingBook.backgroundImage.url}-${index}`}
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
