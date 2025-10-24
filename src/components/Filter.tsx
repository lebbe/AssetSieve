import { FilterState } from '../hooks/useFilter'
import { ImageData } from '../hooks/useImageSniffer'

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
      <h3>Filters</h3>
      <div className="filter-controls">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="path-filter">Path:</label>
            <input
              id="path-filter"
              type="text"
              placeholder="e.g., images/gallery"
              value={filters.path}
              onChange={(e) => handleInputChange('path', e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="filename-filter">Filename:</label>
            <input
              id="filename-filter"
              type="text"
              placeholder="e.g., logo.png"
              value={filters.filename}
              onChange={(e) => handleInputChange('filename', e.target.value)}
              className="filter-input"
            />
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="min-width-filter">Min Width:</label>
            <input
              id="min-width-filter"
              type="number"
              placeholder="px"
              value={filters.minWidth}
              onChange={(e) => handleInputChange('minWidth', e.target.value)}
              className="filter-input filter-number"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="min-height-filter">Min Height:</label>
            <input
              id="min-height-filter"
              type="number"
              placeholder="px"
              value={filters.minHeight}
              onChange={(e) => handleInputChange('minHeight', e.target.value)}
              className="filter-input filter-number"
            />
          </div>
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
          <button onClick={clearFilters} className="btn btn-clear">
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
