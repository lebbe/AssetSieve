import { GridSettings } from '../types/page'
import { getGridLines } from '../utils/gridSnapping'
import './GridOverlay.css'

type Props = {
  width: number
  height: number
  gridSettings: GridSettings
}

export function GridOverlay({ width, height, gridSettings }: Props) {
  if (!gridSettings.enabled) {
    return null
  }

  const { verticalLines, horizontalLines } = getGridLines(
    width,
    height,
    gridSettings,
  )

  return (
    <svg
      className="grid-overlay"
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Vertical lines */}
      {verticalLines.map((x, index) => (
        <line
          key={`v-${index}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#007bff"
          strokeWidth="0.5"
          strokeOpacity="0.3"
          strokeDasharray="4 4"
        />
      ))}

      {/* Horizontal lines */}
      {horizontalLines.map((y, index) => (
        <line
          key={`h-${index}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#007bff"
          strokeWidth="0.5"
          strokeOpacity="0.3"
          strokeDasharray="4 4"
        />
      ))}
    </svg>
  )
}
