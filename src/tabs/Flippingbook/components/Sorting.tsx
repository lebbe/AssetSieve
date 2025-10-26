import { FlippingBookSortBy } from '../hooks/useFlippingBookSorting'
import { InputContainer } from '../../../components/InputContainer'
import { SortButton } from '../../../components/SortButton'

interface SortingProps {
  sortBy: FlippingBookSortBy
  setSortBy: (sortBy: FlippingBookSortBy) => void
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
  const sortOptions: { value: FlippingBookSortBy; label: string }[] = [
    { value: 'manual', label: 'Manual (Original Order)' },
    { value: 'filename', label: 'Filename (A-Z)' },
    { value: 'path', label: 'Path (A-Z)' },
    { value: 'filetype', label: 'File Type (A-Z)' },
    { value: 'size', label: 'File Size (Largest First)' },
    { value: 'width', label: 'Width (Largest First)' },
    { value: 'height', label: 'Height (Largest First)' },
  ]

  return (
    <div className="sorting-container">
      <div className="sorting-controls">
        <InputContainer label="Sort FlippingBooks by" htmlFor="sort-select">
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as FlippingBookSortBy)}
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

        <span className="sorting-info">
          {totalImages} item{totalImages !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
