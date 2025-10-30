import { FontSortBy } from '../../../hooks/useFontSorting'
import { InputContainer } from '../../../components/InputContainer'
import { SortButton } from '../../../components/SortButton'

interface SortingProps {
  sortBy: FontSortBy
  setSortBy: (sortBy: FontSortBy) => void
  reversed: boolean
  setReversed: (reversed: boolean) => void
  totalFonts: number
}

export function Sorting({
  sortBy,
  setSortBy,
  reversed,
  setReversed,
  totalFonts,
}: SortingProps) {
  const sortOptions: { value: FontSortBy; label: string }[] = [
    { value: 'manual', label: 'Manual (Original Order)' },
    { value: 'filename', label: 'Filename (A-Z)' },
    { value: 'fontFamily', label: 'Font Family (A-Z)' },
    { value: 'classification', label: 'Classification (A-Z)' },
    { value: 'size', label: 'File Size (Largest First)' },
  ]

  return (
    <div className="sorting-container">
      <div className="sorting-controls">
        <InputContainer label="Sort by" htmlFor="sort-select">
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as FontSortBy)}
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
          {totalFonts} font{totalFonts !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
