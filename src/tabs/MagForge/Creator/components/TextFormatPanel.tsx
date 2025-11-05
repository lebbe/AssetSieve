import { PlacedTextBox, FontFamily } from '../types/page'
import './TextFormatPanel.css'

type Props = {
  textBox: PlacedTextBox
  onUpdate: (updated: PlacedTextBox) => void
  scale: number
}

const FONT_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: 'Playfair Display', label: 'Playfair Display (Headline Serif)' },
  { value: 'Oswald', label: 'Oswald (Headline Sans)' },
  { value: 'Merriweather', label: 'Merriweather (Body Serif)' },
  { value: 'Lato', label: 'Lato (Body Sans)' },
  { value: 'Montserrat', label: 'Montserrat (Subheading)' },
  { value: 'Roboto', label: 'Roboto (Caption)' },
]

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72, 96]

const PANEL_OFFSET = 50

export function TextFormatPanel({ textBox, onUpdate, scale }: Props) {
  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({
      ...textBox,
      fontFamily: e.target.value as FontFamily,
    })
  }

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({
      ...textBox,
      fontSize: Number(e.target.value),
    })
  }

  const handleBoldToggle = () => {
    onUpdate({
      ...textBox,
      isBold: !textBox.isBold,
    })
  }

  const handleItalicToggle = () => {
    onUpdate({
      ...textBox,
      isItalic: !textBox.isItalic,
    })
  }

  const handleUnderlineToggle = () => {
    onUpdate({
      ...textBox,
      isUnderline: !textBox.isUnderline,
    })
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      ...textBox,
      color: e.target.value,
    })
  }

  return (
    <div
      className="text-format-panel"
      style={{
        left: `${textBox.x}px`,
        top: `${textBox.y - PANEL_OFFSET / scale}px`,
        transform: `scale(${1 / scale})`,
        transformOrigin: 'top left',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <select
        className="text-format-select"
        value={textBox.fontFamily}
        onChange={handleFontFamilyChange}
        title="Font Family"
      >
        {FONT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        className="text-format-select text-format-select--small"
        value={textBox.fontSize}
        onChange={handleFontSizeChange}
        title="Font Size"
      >
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>

      <button
        className={`text-format-btn ${textBox.isBold ? 'text-format-btn--active' : ''}`}
        onClick={handleBoldToggle}
        title="Bold"
      >
        <strong>B</strong>
      </button>

      <button
        className={`text-format-btn ${textBox.isItalic ? 'text-format-btn--active' : ''}`}
        onClick={handleItalicToggle}
        title="Italic"
      >
        <em>I</em>
      </button>

      <button
        className={`text-format-btn ${textBox.isUnderline ? 'text-format-btn--active' : ''}`}
        onClick={handleUnderlineToggle}
        title="Underline"
      >
        <u>U</u>
      </button>

      <input
        type="color"
        className="text-format-color"
        value={textBox.color}
        onChange={handleColorChange}
        title="Text Color"
      />
    </div>
  )
}
