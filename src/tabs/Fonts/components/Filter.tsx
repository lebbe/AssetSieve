import { FontFilterState } from '../../../hooks/useFontFilter'
import { FontFileData } from '../../../hooks/useFontSniffer'
import { InputContainer } from '../../../components/InputContainer'
import '../../Images/components/Filter.css'
import '../../../components/Button.css'

interface FilterProps {
  filters: FontFilterState
  handleInputChange: (field: keyof FontFilterState, value: string) => void
  availableFileTypes: string[]
  availableClassifications: string[]
  handleFileTypeToggle: (fileType: string) => void
  clearFilters: () => void
  filteredFonts: FontFileData[]
  totalFonts: number
}

export function Filter({
  filters,
  handleInputChange,
  availableFileTypes,
  availableClassifications,
  handleFileTypeToggle,
  clearFilters,
  filteredFonts,
  totalFonts,
}: FilterProps) {
  return (
    <div className="filter-container">
      <div className="filter-controls">
        <div className="filter-row">
          <InputContainer label="Filename" htmlFor="filename-filter">
            <input
              id="filename-filter"
              type="text"
              placeholder="e.g., roboto.woff2"
              value={filters.filename}
              onChange={(e) => handleInputChange('filename', e.target.value)}
              className="input"
            />
          </InputContainer>
          <InputContainer label="Font Family" htmlFor="fontfamily-filter">
            <input
              id="fontfamily-filter"
              type="text"
              placeholder="e.g., Arial"
              value={filters.fontFamily}
              onChange={(e) => handleInputChange('fontFamily', e.target.value)}
              className="input"
            />
          </InputContainer>
        </div>

        <div className="filter-row">
          <InputContainer label="Classification" htmlFor="classification-filter">
            <select
              id="classification-filter"
              value={filters.classification}
              onChange={(e) =>
                handleInputChange('classification', e.target.value)
              }
              className="input"
            >
              <option value="">All Classifications</option>
              {availableClassifications.map((classification) => (
                <option key={classification} value={classification}>
                  {classification}
                </option>
              ))}
            </select>
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
              className="input input--number"
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
            Showing {filteredFonts.length} of {totalFonts} fonts
          </span>
        </div>
      </div>
    </div>
  )
}
