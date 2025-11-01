import { IIIFSortBy } from '../hooks/useIIIFSorting'
import { InputContainer } from '../../../components/InputContainer'
import { SortButton } from '../../../components/SortButton'

interface SortingProps {
  sortBy: IIIFSortBy
  setSortBy: (sortBy: IIIFSortBy) => void
  reversed: boolean
  setReversed: (reversed: boolean) => void
  totalImages: number
}

export function Sorting({
  sortBy,
  setSortBy,
  reversed,
  setReversed,
  totalImages,
}: SortingProps) {
  const sortOptions: { value: IIIFSortBy; label: string }[] = [
    { value: 'default', label: 'Default (Download Order)' },
    { value: 'baseUrl', label: 'Base URL (A-Z)' },
    { value: 'identifier', label: 'Identifier (A-Z)' },
    { value: 'dimensions', label: 'Dimensions (Largest First)' },
  ]

  return (
    <div className="sorting-container">
      <div className="sorting-controls">
        <InputContainer label="Sort by" htmlFor="iiif-sort-select">
          <select
            id="iiif-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as IIIFSortBy)}
            className="input"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </InputContainer>

        <SortButton
          direction={reversed ? 'desc' : 'asc'}
          onToggle={() => setReversed(!reversed)}
        />

        <span className="sorting-result-count">
          Showing {totalImages} {totalImages === 1 ? 'image' : 'images'}
        </span>
      </div>
    </div>
  )
}
