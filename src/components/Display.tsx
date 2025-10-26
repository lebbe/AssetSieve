import { InputContainer } from './InputContainer'
import './Display.css'

interface DisplayProps {
  previewSize: 'small' | 'medium' | 'large'
  setPreviewSize: (size: 'small' | 'medium' | 'large') => void
  density: 'compact' | 'comfortable' | 'spacious'
  setDensity: (density: 'compact' | 'comfortable' | 'spacious') => void
  showDetails: 'full' | 'minimal' | 'none'
  setShowDetails: (details: 'full' | 'minimal' | 'none') => void
}

export function Display({
  previewSize,
  setPreviewSize,
  density,
  setDensity,
  showDetails,
  setShowDetails,
}: DisplayProps) {
  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPreviewSize(e.target.value as 'small' | 'medium' | 'large')
  }

  const handleDensityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDensity(e.target.value as 'compact' | 'comfortable' | 'spacious')
  }

  const handleDetailsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setShowDetails(e.target.value as 'full' | 'minimal' | 'none')
  }

  return (
    <div className="display-container">
      <div className="display-controls">
        <InputContainer label="Size">
          <select
            id="size-select"
            value={previewSize}
            onChange={handleSizeChange}
            className="input"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </InputContainer>

        <InputContainer label="Density">
          <select
            id="density-select"
            value={density}
            onChange={handleDensityChange}
            className="input"
          >
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
            <option value="spacious">Spacious</option>
          </select>
        </InputContainer>

        <InputContainer label="Details">
          <select
            id="details-select"
            value={showDetails}
            onChange={handleDetailsChange}
            className="input"
          >
            <option value="full">Full Info</option>
            <option value="minimal">Basic Info</option>
            <option value="none">Image Only</option>
          </select>
        </InputContainer>
      </div>
    </div>
  )
}
