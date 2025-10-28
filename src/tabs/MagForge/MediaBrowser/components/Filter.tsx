import { ChangeEvent } from 'react'
import './Filter.css'

type Props = {
  nameFilter: string
  onNameFilterChange: (value: string) => void
  minWidth: string
  onMinWidthChange: (value: string) => void
  minHeight: string
  onMinHeightChange: (value: string) => void
  showVectorOnly: boolean
  onShowVectorOnlyChange: (value: boolean) => void
  hideUsedImages: boolean
  onHideUsedImagesChange: (value: boolean) => void
  previewSize: number
  onPreviewSizeChange: (value: number) => void
  totalImages: number
  filteredImages: number
}

export function Filter({
  nameFilter,
  onNameFilterChange,
  minWidth,
  onMinWidthChange,
  minHeight,
  onMinHeightChange,
  showVectorOnly,
  onShowVectorOnlyChange,
  hideUsedImages,
  onHideUsedImagesChange,
  previewSize,
  onPreviewSizeChange,
  totalImages,
  filteredImages,
}: Props) {
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    onNameFilterChange(e.target.value)
  }

  const handleMinWidthChange = (e: ChangeEvent<HTMLInputElement>) => {
    onMinWidthChange(e.target.value)
  }

  const handleMinHeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    onMinHeightChange(e.target.value)
  }

  const handleShowVectorOnlyChange = (e: ChangeEvent<HTMLInputElement>) => {
    onShowVectorOnlyChange(e.target.checked)
  }

  const handleHideUsedChange = (e: ChangeEvent<HTMLInputElement>) => {
    onHideUsedImagesChange(e.target.checked)
  }

  const handlePreviewSizeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onPreviewSizeChange(Number(e.target.value))
  }

  return (
    <div className="media-browser-filter">
      <div className="filter-row">
        <input
          type="text"
          className="input input-sm"
          placeholder="Filter by name..."
          value={nameFilter}
          onChange={handleNameChange}
        />
        <input
          type="number"
          className="input input-sm filter-dimension-input"
          placeholder="Min width"
          value={minWidth}
          onChange={handleMinWidthChange}
        />
        <input
          type="number"
          className="input input-sm filter-dimension-input"
          placeholder="Min height"
          value={minHeight}
          onChange={handleMinHeightChange}
        />
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={showVectorOnly}
            onChange={handleShowVectorOnlyChange}
          />
          <span>Vector only</span>
        </label>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={hideUsedImages}
            onChange={handleHideUsedChange}
          />
          <span>Hide used</span>
        </label>
        <select
          className="input input-sm filter-preview-select"
          value={previewSize}
          onChange={handlePreviewSizeChange}
        >
          <option value={80}>Small</option>
          <option value={120}>Medium</option>
          <option value={160}>Large</option>
        </select>
        <span className="filter-count">
          {filteredImages} / {totalImages}
        </span>
      </div>
    </div>
  )
}
