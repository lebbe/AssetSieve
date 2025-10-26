import { PanelCard } from '../../../components/PanelCard'
import { InputContainer } from '../../../components/InputContainer'
import { TrafficFilterState } from './useTrafficFilter'
import './Filter.css'

interface FilterProps {
  filters: TrafficFilterState
  availableMethods: string[]
  availableStatuses: string[]
  availableMimeTypes: string[]
  onFilterChange: (field: keyof TrafficFilterState, value: string) => void
  onClearFilters: () => void
}

export function Filter({
  filters,
  availableMethods,
  availableStatuses,
  availableMimeTypes,
  onFilterChange,
  onClearFilters,
}: FilterProps) {
  return (
    <PanelCard title="Filter Traffic">
      <div className="traffic-filter-container">
        <div className="traffic-filter-row">
          <InputContainer label="URL Contains">
            <input
              type="text"
              value={filters.url}
              onChange={(e) => onFilterChange('url', e.target.value)}
              placeholder="Enter URL fragment"
              className="input"
            />
          </InputContainer>

          <InputContainer label="Method">
            <select
              value={filters.method}
              onChange={(e) => onFilterChange('method', e.target.value)}
              className="input"
            >
              <option value="">All Methods</option>
              {availableMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </InputContainer>

          <InputContainer label="Status Code">
            <select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </InputContainer>
        </div>

        <div className="traffic-filter-row">
          <InputContainer label="Content Type">
            <select
              value={filters.mimeType}
              onChange={(e) => onFilterChange('mimeType', e.target.value)}
              className="input"
            >
              <option value="">All Types</option>
              {availableMimeTypes.map((type) => (
                <option key={type} value={type}>
                  {type}/*
                </option>
              ))}
            </select>
          </InputContainer>

          <InputContainer label="Min Size (KB)">
            <input
              type="number"
              value={filters.minSize}
              onChange={(e) => onFilterChange('minSize', e.target.value)}
              placeholder="0"
              min="0"
              className="input input--number"
            />
          </InputContainer>

          <InputContainer label="Max Size (KB)">
            <input
              type="number"
              value={filters.maxSize}
              onChange={(e) => onFilterChange('maxSize', e.target.value)}
              placeholder="∞"
              min="0"
              className="input input--number"
            />
          </InputContainer>

          <button onClick={onClearFilters} className="clear-filters-btn">
            Clear All
          </button>
        </div>
      </div>
    </PanelCard>
  )
}
