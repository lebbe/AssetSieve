import { PanelCard } from '../../../components/PanelCard'
import { InputContainer } from '../../../components/InputContainer'
import { TrafficSortBy, SortDirection } from './useTrafficSorting'
import './Sorting.css'

interface SortingProps {
  sortBy: TrafficSortBy
  sortDirection: SortDirection
  onSort: (field: TrafficSortBy) => void
}

export function Sorting({ sortBy, sortDirection, onSort }: SortingProps) {
  const sortOptions: Array<{ value: TrafficSortBy; label: string }> = [
    { value: 'time', label: 'Time' },
    { value: 'url', label: 'URL' },
    { value: 'method', label: 'Method' },
    { value: 'status', label: 'Status' },
    { value: 'size', label: 'Size' },
    { value: 'mimeType', label: 'Content Type' },
  ]

  return (
    <PanelCard title="Sort Traffic">
      <div className="traffic-sorting-container">
        <InputContainer label="Sort By">
          <select
            value={sortBy}
            onChange={(e) => onSort(e.target.value as TrafficSortBy)}
            className="sort-select"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </InputContainer>

        <button
          onClick={() => onSort(sortBy)}
          className="sort-direction-btn"
          title={`Currently sorting ${
            sortDirection === 'asc' ? 'ascending' : 'descending'
          }`}
        >
          {sortDirection === 'asc' ? '↑' : '↓'} {sortDirection.toUpperCase()}
        </button>
      </div>
    </PanelCard>
  )
}
