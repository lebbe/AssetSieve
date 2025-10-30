import { Display } from '../../components/Display'
import { Export } from './components/Export'
import { Filter } from './components/Filter'
import { FontItem } from './components/FontItem'
import { PanelCard } from '../../components/PanelCard'
import { Sorting } from './components/Sorting'
import { useDisplayOptions } from '../../hooks/useDisplayOptions'
import { useDragAndDrop } from '../../hooks/useDragAndDrop'
import { useFontFilter } from '../../hooks/useFontFilter'
import { NetworkRequest } from '../../hooks/useRequestSniffing'
import { useFontSniffer } from '../../hooks/useFontSniffer'
import { useFontSorting } from '../../hooks/useFontSorting'

import './Fonts.css'

type Props = {
  requests: NetworkRequest[]
  removeRequest: (url: string) => void
}

export function Fonts({ requests, removeRequest }: Props) {
  const { fonts } = useFontSniffer(requests)

  const {
    filteredFonts,
    availableFileTypes,
    availableClassifications,
    filters,
    clearFilters,
    handleFileTypeToggle,
    handleInputChange,
  } = useFontFilter(fonts)

  const { sortedFonts, sortBy, setSortBy, reversed, setReversed, setFontOrder } =
    useFontSorting(filteredFonts)

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
  } = useDragAndDrop(sortedFonts, setFontOrder)

  return (
    <div className="font-analysis">
      {fonts.length > 0 && (
        <PanelCard title="Filters">
          <Filter
            availableFileTypes={availableFileTypes}
            availableClassifications={availableClassifications}
            filters={filters}
            handleInputChange={handleInputChange}
            handleFileTypeToggle={handleFileTypeToggle}
            clearFilters={clearFilters}
            filteredFonts={filteredFonts}
            totalFonts={fonts.length}
          />
        </PanelCard>
      )}
      {filteredFonts.length > 0 && (
        <div className="control-panels">
          <PanelCard title="Sorting">
            <Sorting
              sortBy={sortBy}
              setSortBy={setSortBy}
              reversed={reversed}
              setReversed={setReversed}
              totalFonts={filteredFonts.length}
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
      {sortedFonts.length > 0 && (
        <PanelCard className="export-panel-card" title="Export">
          <Export sortedFonts={sortedFonts} />
        </PanelCard>
      )}
      <h2>Detected Fonts ({sortedFonts.length})</h2>
      {fonts.length === 0 ? (
        <div className="no-fonts">
          <p>
            No fonts detected yet. Browse to a website to see fonts being
            captured.
          </p>
        </div>
      ) : (
        <div className={`fonts-grid fonts-grid--${density}`}>
          {sortedFonts.map((font, index) => (
            <FontItem
              key={`${font.url}-${index}`}
              font={font}
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
