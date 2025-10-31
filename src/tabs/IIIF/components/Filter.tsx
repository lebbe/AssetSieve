import { IIIFFilterState } from '../hooks/useIIIFFilter'
import { InputContainer } from '../../../components/InputContainer'
import './Filter.css'
import '../../../components/Button.css'

interface FilterProps {
  filters: IIIFFilterState
  handleInputChange: (field: keyof IIIFFilterState, value: string) => void
  clearFilters: () => void
  filteredCount: number
  totalCount: number
}

export function Filter({
  filters,
  handleInputChange,
  clearFilters,
  filteredCount,
  totalCount,
}: FilterProps) {
  const hasActiveFilters = Object.values(filters).some((value) => value !== '')

  return (
    <div className="filter-container">
      <div className="filter-controls">
        <div className="filter-row">
          <InputContainer label="Identifier" htmlFor="iiif-identifier-filter">
            <input
              id="iiif-identifier-filter"
              type="text"
              placeholder="e.g., digibok_2012"
              value={filters.identifier}
              onChange={(e) => handleInputChange('identifier', e.target.value)}
              className="input"
            />
          </InputContainer>
          <InputContainer label="Base URL" htmlFor="iiif-baseurl-filter">
            <input
              id="iiif-baseurl-filter"
              type="text"
              placeholder="e.g., nb.no"
              value={filters.baseUrl}
              onChange={(e) => handleInputChange('baseUrl', e.target.value)}
              className="input"
            />
          </InputContainer>
        </div>

        <div className="filter-row">
          <InputContainer label="Min Width" htmlFor="iiif-min-width-filter">
            <input
              id="iiif-min-width-filter"
              type="number"
              placeholder="px"
              value={filters.minWidth}
              onChange={(e) => handleInputChange('minWidth', e.target.value)}
              className="input input--number"
            />
          </InputContainer>
          <InputContainer label="Min Height" htmlFor="iiif-min-height-filter">
            <input
              id="iiif-min-height-filter"
              type="number"
              placeholder="px"
              value={filters.minHeight}
              onChange={(e) => handleInputChange('minHeight', e.target.value)}
              className="input input--number"
            />
          </InputContainer>
          <InputContainer label="Min Tiles" htmlFor="iiif-min-tiles-filter">
            <input
              id="iiif-min-tiles-filter"
              type="number"
              placeholder="e.g., 4"
              value={filters.minTiles}
              onChange={(e) => handleInputChange('minTiles', e.target.value)}
              className="input input--number"
            />
          </InputContainer>
        </div>
      </div>

      <div className="filter-footer">
        <div className="filter-stats">
          {hasActiveFilters && (
            <>
              Showing {filteredCount} of {totalCount}{' '}
              {totalCount === 1 ? 'image' : 'images'}
            </>
          )}
        </div>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="btn btn-clear">
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}
