import { FilterState } from '../../../hooks/useFilter'
import { ImageData } from '../../../hooks/useImageSniffer'
import { InputContainer } from '../../../components/InputContainer'
import './Filter.css'
import '../../../components/Button.css'

interface FilterProps {
  filters: FilterState
  handleInputChange: (field: keyof FilterState, value: string) => void
  availableFileTypes: string[]
  handleFileTypeToggle: (fileType: string) => void
  clearFilters: () => void
  filteredImages: ImageData[]
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
          <InputContainer label="Path" htmlFor="path-filter">
            <input
              id="path-filter"
              type="text"
              placeholder="e.g., images/gallery"
              value={filters.path}
              onChange={(e) => handleInputChange('path', e.target.value)}
              className="filter-input"
            />
          </InputContainer>
          <InputContainer label="Filename" htmlFor="filename-filter">
            <input
              id="filename-filter"
              type="text"
              placeholder="e.g., logo.png"
              value={filters.filename}
              onChange={(e) => handleInputChange('filename', e.target.value)}
              className="filter-input"
            />
          </InputContainer>
        </div>

        <div className="filter-row">
          <InputContainer label="Min Width" htmlFor="min-width-filter">
            <input
              id="min-width-filter"
              type="number"
              placeholder="px"
              value={filters.minWidth}
              onChange={(e) => handleInputChange('minWidth', e.target.value)}
              className="filter-input filter-number"
            />
          </InputContainer>
          <InputContainer label="Min Height" htmlFor="min-height-filter">
            <input
              id="min-height-filter"
              type="number"
              placeholder="px"
              value={filters.minHeight}
              onChange={(e) => handleInputChange('minHeight', e.target.value)}
              className="filter-input filter-number"
            />
          </InputContainer>
          <InputContainer
            label="Min File Size (KB)"
            htmlFor="min-filesize-filter"
          >
            <input
              id="min-filesize-filter"
              type="number"
              placeholder="e.g., 50"
              value={filters.minFileSize}
              onChange={(e) => handleInputChange('minFileSize', e.target.value)}
              className="filter-input filter-number"
            />
          </InputContainer>
        </div>

        {availableFileTypes.length > 0 && (
          <div className="filter-row">
            <div className="filter-group filter-group-full">
              <label>File Types:</label>
              <div className="checkbox-group">
                {availableFileTypes.map((fileType) => (
                  <label key={fileType} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.fileTypes.has(fileType)}
                      onChange={() => handleFileTypeToggle(fileType)}
                      className="checkbox-input"
                    />
                    <span className="checkbox-text">{fileType}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="filter-actions">
          <button onClick={clearFilters} className="btn">
            Clear Filters
          </button>
          <span className="filter-count">
            Showing {filteredImages.length} of {totalImages} images
          </span>
        </div>
      </div>
    </div>
  )
}
