import './Button.css'

export type SortDirection = 'asc' | 'desc'

interface SortButtonProps {
  direction: SortDirection
  onToggle: () => void
  title?: string
}

export function SortButton({ direction, onToggle, title }: SortButtonProps) {
  const defaultTitle = `Currently sorting ${
    direction === 'asc' ? 'ascending' : 'descending'
  }`

  return (
    <button
      onClick={onToggle}
      className="btn btn-sm"
      title={title || defaultTitle}
    >
      {direction === 'asc' ? '↑' : '↓'} {direction.toUpperCase()}
    </button>
  )
}
