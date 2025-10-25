import { FlippingBookFilterState } from '../hooks/useFlippingBookFilter'
import { FlippingBookPair } from '../hooks/useCombiner'
import { InputContainer } from '../../../components/InputContainer'
import './Filter.css'
import '../../../components/Button.css'

interface FilterProps {
  filters: FlippingBookFilterState
  handleInputChange: (
    field: keyof FlippingBookFilterState,
    value: string
  ) => void
  availableFileTypes: string[]
  handleFileTypeToggle: (fileType: string) => void
  clearFilters: () => void
  filteredImages: FlippingBookPair[]
  totalImages: number
}

export function Filter({
  filters,
  handleInputChange,
  availableFileTypes,
  handleFileTypeToggle,
  clearFilters,
  filteredImages,
  totalImages,
}: FilterProps) {
  return (
    <div className="filter-container">
      <div className="filter-controls">
        <div className="filter-row">
          <InputContainer label="FlippingBook Path" htmlFor="path-filter">
            <input
              id="path-filter"
              type="text"
              placeholder="e.g., flipbooks/magazine"
              value={filters.path}
              onChange={(e) => handleInputChange('path', e.target.value)}
              className="filter-input"
            />
          </InputContainer>
          <InputContainer label="FlippingBook Name" htmlFor="filename-filter">
            <input
              id="filename-filter"
              type="text"
              placeholder="e.g., catalog.pdf"
              value={filters.filename}
              onChange={(e) => handleInputChange('filename', e.target.value)}
              className="filter-input"
            />
          </InputContainer>
        </div>

        <div className="filter-row">
          <InputContainer label="Min Width" htmlFor="minWidth-filter">
            <input
              id="minWidth-filter"
              type="text"
              placeholder="e.g., 800"
              value={filters.minWidth}
              onChange={(e) => handleInputChange('minWidth', e.target.value)}
              className="filter-input"
            />
          </InputContainer>
          <InputContainer label="Min Height" htmlFor="minHeight-filter">
            <input
              id="minHeight-filter"
              type="text"
              placeholder="e.g., 600"
              value={filters.minHeight}
              onChange={(e) => handleInputChange('minHeight', e.target.value)}
              className="filter-input"
            />
          </InputContainer>
        </div>

        <div className="filter-row">
          <InputContainer label="Min File Size" htmlFor="minFileSize-filter">
            <input
              id="minFileSize-filter"
              type="text"
              placeholder="e.g., 100KB or 1MB"
              value={filters.minFileSize}
              onChange={(e) => handleInputChange('minFileSize', e.target.value)}
              className="filter-input"
            />
          </InputContainer>
        </div>
      </div>

      {availableFileTypes.length > 0 && (
        <div className="file-types-section">
          <p className="file-types-label">FlippingBook File Types:</p>
          <div className="file-types">
            {availableFileTypes.map((fileType) => (
              <label key={fileType} className="file-type-checkbox">
                <input
                  type="checkbox"
                  checked={filters.fileTypes.has(fileType)}
                  onChange={() => handleFileTypeToggle(fileType)}
                />
                <span className="file-type-name">{fileType}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="filter-summary">
        <span className="filter-count">
          Showing {filteredImages.length} of {totalImages} FlippingBooks
        </span>
        <button onClick={clearFilters} className="btn btn-outline">
          Clear Filters
        </button>
      </div>
    </div>
  )
}
