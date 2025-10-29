import './Pagination.css'

type Props = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onAddPage: () => void
  onDeletePage: () => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  onAddPage,
  onDeletePage,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: Props) {
  const canGoBack = currentPage > 1
  const canGoForward = currentPage < totalPages
  const canDelete = totalPages > 1

  const handlePrevious = () => {
    if (canGoBack) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (canGoForward) {
      onPageChange(currentPage + 1)
    }
  }

  return (
    <div className="pagination">
      <button
        className="btn btn-sm"
        onClick={handlePrevious}
        disabled={!canGoBack}
        title="Previous page"
      >
        ←
      </button>

      <span className="pagination-info">
        Page {currentPage} / {totalPages}
      </span>

      <button
        className="btn btn-sm"
        onClick={handleNext}
        disabled={!canGoForward}
        title="Next page"
      >
        →
      </button>

      <div className="pagination-divider" />

      <button
        className="btn btn-sm btn-green"
        onClick={onAddPage}
        title="Add page"
      >
        + Add
      </button>

      <button
        className="btn btn-sm btn-red"
        onClick={onDeletePage}
        disabled={!canDelete}
        title="Delete current page"
      >
        Delete
      </button>

      <div className="pagination-divider" />

      <button className="btn btn-sm" onClick={onZoomOut} title="Zoom out">
        −
      </button>

      <button
        className="btn btn-sm"
        onClick={onZoomReset}
        title="Reset zoom to 100%"
      >
        {Math.round(zoom * 100)}%
      </button>

      <button className="btn btn-sm" onClick={onZoomIn} title="Zoom in">
        +
      </button>
    </div>
  )
}
