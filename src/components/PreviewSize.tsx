interface PreviewSizeProps {
  previewSize: 'small' | 'medium' | 'large'
  setPreviewSize: (size: 'small' | 'medium' | 'large') => void
}

export function PreviewSize({ previewSize, setPreviewSize }: PreviewSizeProps) {
  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPreviewSize(e.target.value as 'small' | 'medium' | 'large')
  }

  return (
    <div className="preview-size-container">
      <div className="preview-size-controls">
        <h3>Preview Size</h3>
        <select
          value={previewSize}
          onChange={handleSizeChange}
          className="preview-size-select"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>
    </div>
  )
}
