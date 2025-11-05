import { GridSettings } from '../types/page'
import './GridControls.css'

type Props = {
  gridSettings: GridSettings
  onGridSettingsChange: (settings: GridSettings) => void
}

export function GridControls({ gridSettings, onGridSettingsChange }: Props) {
  const handleColumnsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onGridSettingsChange({
      ...gridSettings,
      columns: parseInt(e.target.value),
    })
  }

  const handleVerticalGridChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      onGridSettingsChange({
        ...gridSettings,
        verticalGrid: value,
      })
    }
  }

  const handleGutterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value >= 0) {
      onGridSettingsChange({
        ...gridSettings,
        gutter: value,
      })
    }
  }

  const handleEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onGridSettingsChange({
      ...gridSettings,
      enabled: e.target.checked,
    })
  }

  return (
    <div className="grid-controls">
      <div className="grid-controls-group">
        <label className="grid-controls-label">
          <input
            type="checkbox"
            checked={gridSettings.enabled}
            onChange={handleEnabledChange}
          />
          Enable Grid Snap
        </label>
      </div>

      <div className="grid-controls-divider" />

      <div className="grid-controls-group">
        <label className="grid-controls-label">Columns</label>
        <select
          className="input input-sm grid-controls-select"
          value={gridSettings.columns}
          onChange={handleColumnsChange}
          disabled={!gridSettings.enabled}
        >
          {[1, 2, 3, 4, 6, 8, 12, 16, 24].map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>

      <div className="grid-controls-group">
        <label className="grid-controls-label">Vertical (pts)</label>
        <input
          type="number"
          className="input input-sm grid-controls-input"
          value={gridSettings.verticalGrid}
          onChange={handleVerticalGridChange}
          min="1"
          disabled={!gridSettings.enabled}
        />
      </div>

      <div className="grid-controls-group">
        <label className="grid-controls-label">Gutter (pts)</label>
        <input
          type="number"
          className="input input-sm grid-controls-input"
          value={gridSettings.gutter}
          onChange={handleGutterChange}
          min="0"
          disabled={!gridSettings.enabled}
        />
      </div>
    </div>
  )
}
