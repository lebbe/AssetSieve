import { ChangeEvent } from 'react'
import {
  FormatName,
  PDF_FORMATS,
  getFormatDimensions,
} from '../utils/pdfFormats'
import './Toolbar.css'

type Props = {
  selectedFormat: FormatName
  onFormatChange: (format: FormatName) => void
  width: number
  onWidthChange: (width: number) => void
  height: number
  onHeightChange: (height: number) => void
  magazineName: string
  onMagazineNameChange: (name: string) => void
  creatorName: string
  onCreatorNameChange: (name: string) => void
  onExport: () => void
  onDoubleResolution: () => void
}

export function Toolbar({
  selectedFormat,
  onFormatChange,
  width,
  onWidthChange,
  height,
  onHeightChange,
  magazineName,
  onMagazineNameChange,
  creatorName,
  onCreatorNameChange,
  onExport,
  onDoubleResolution,
}: Props) {
  const handleFormatChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const format = e.target.value as FormatName
    onFormatChange(format)
    const dimensions = getFormatDimensions(format)
    onWidthChange(dimensions.width)
    onHeightChange(dimensions.height)
  }

  const handleWidthChange = (e: ChangeEvent<HTMLInputElement>) => {
    onWidthChange(Number(e.target.value))
  }

  const handleHeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    onHeightChange(Number(e.target.value))
  }

  const handleMagazineNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    onMagazineNameChange(e.target.value)
  }

  const handleCreatorNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    onCreatorNameChange(e.target.value)
  }

  return (
    <div className="creator-toolbar">
      <div className="toolbar-row">
        <div className="toolbar-group">
          <label className="toolbar-label">Format</label>
          <select
            className="input input-sm toolbar-format-select"
            value={selectedFormat}
            onChange={handleFormatChange}
          >
            {Object.keys(PDF_FORMATS).map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-group">
          <label className="toolbar-label">Width</label>
          <input
            type="number"
            className="input input-sm toolbar-dimension-input"
            value={width}
            onChange={handleWidthChange}
          />
        </div>

        <div className="toolbar-group">
          <label className="toolbar-label">Height</label>
          <input
            type="number"
            className="input input-sm toolbar-dimension-input"
            value={height}
            onChange={handleHeightChange}
          />
        </div>

        <button
          className="btn btn-sm"
          onClick={onDoubleResolution}
          title="Double the resolution (2x width and height)"
        >
          2x
        </button>

        <div className="toolbar-group toolbar-group--grow">
          <label className="toolbar-label">Magazine Name</label>
          <input
            type="text"
            className="input input-sm"
            placeholder="My Magazine"
            value={magazineName}
            onChange={handleMagazineNameChange}
          />
        </div>

        <div className="toolbar-group toolbar-group--grow">
          <label className="toolbar-label">Creator</label>
          <input
            type="text"
            className="input input-sm"
            placeholder="Creator Name"
            value={creatorName}
            onChange={handleCreatorNameChange}
          />
        </div>

        <button className="btn btn-green" onClick={onExport}>
          Export PDF
        </button>
      </div>
    </div>
  )
}
