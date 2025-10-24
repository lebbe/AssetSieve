import { SortBy } from '../hooks/useSorting'

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
        <label htmlFor="sort-select" className="sorting-label">
          Sort by:
        </label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="sorting-select"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label className="reverse-checkbox-label">
          <input
            type="checkbox"
            checked={reversed}
            onChange={(e) => setReversed(e.target.checked)}
            className="reverse-checkbox"
          />
          <span className="reverse-checkbox-text">Reverse</span>
        </label>
        <span className="sorting-info">
          {totalImages} image{totalImages !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
