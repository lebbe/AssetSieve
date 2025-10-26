import { SortBy } from '../../../hooks/useSorting'
import { InputContainer } from '../../../components/InputContainer'
import { SortButton } from '../../../components/SortButton'

interface SortingProps {
  sortBy: SortBy
  setSortBy: (sortBy: SortBy) => void
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
  const sortOptions: { value: SortBy; label: string }[] = [
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
        <InputContainer label="Sort by" htmlFor="sort-select">
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
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
          {totalImages} image{totalImages !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
