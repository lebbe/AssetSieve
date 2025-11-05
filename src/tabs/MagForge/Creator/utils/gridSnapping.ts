import { GridSettings } from '../types/page'

export const DEFAULT_GRID_SETTINGS: GridSettings = {
  columns: 12,
  verticalGrid: 12,
  gutter: 0,
  enabled: true,
}

type SnapResult = {
  x: number
  y: number
}

/**
 * Calculate the snapped position for an element on a grid
 * @param x X position to snap
 * @param y Y position to snap
 * @param width Element width
 * @param height Element height
 * @param canvasWidth Canvas width
 * @param gridSettings Grid configuration
 * @param altPressed Whether Alt/Option key is pressed (bypasses snapping)
 * @returns Snapped position
 */
export function snapToGrid(
  x: number,
  y: number,
  width: number,
  height: number,
  canvasWidth: number,
  gridSettings: GridSettings,
  altPressed: boolean = false,
): SnapResult {
  // If grid is disabled or Alt is pressed, return original position
  if (!gridSettings.enabled || altPressed) {
    return { x, y }
  }

  const { columns, verticalGrid, gutter } = gridSettings

  // Calculate column width (minus gutters)
  const totalGutterWidth = gutter * (columns - 1)
  const availableWidth = canvasWidth - totalGutterWidth
  const columnWidth = availableWidth / columns

  // Snap X position
  // Try snapping left edge and right edge, use the closest
  let snappedX = x

  // Find closest column for left edge
  let minLeftDist = Infinity
  for (let col = 0; col <= columns; col++) {
    // Calculate column position: columnWidth * col + gutter * col (gutter comes before each column after the first)
    const colX = col * columnWidth + (col > 0 ? col * gutter : 0)
    const dist = Math.abs(x - colX)
    if (dist < minLeftDist) {
      minLeftDist = dist
      snappedX = colX
    }
  }

  // Find closest column for right edge
  let minRightDist = Infinity
  let rightSnappedX = x
  const rightEdge = x + width
  for (let col = 0; col <= columns; col++) {
    const colX = col * columnWidth + (col > 0 ? col * gutter : 0)
    const dist = Math.abs(rightEdge - colX)
    if (dist < minRightDist) {
      minRightDist = dist
      rightSnappedX = colX - width
    }
  }

  // Use the snap that requires less movement
  if (minRightDist < minLeftDist) {
    snappedX = rightSnappedX
  }

  // Snap Y position
  // Try snapping top edge and bottom edge
  let snappedY = y

  // Find closest grid line for top edge
  const topRow = Math.round(y / verticalGrid)
  const topSnap = topRow * verticalGrid
  const topDist = Math.abs(y - topSnap)

  // Find closest grid line for bottom edge
  const bottomEdge = y + height
  const bottomRow = Math.round(bottomEdge / verticalGrid)
  const bottomSnap = bottomRow * verticalGrid - height
  const bottomDist = Math.abs(bottomEdge - (bottomSnap + height))

  // Use the snap that requires less movement
  if (bottomDist < topDist) {
    snappedY = bottomSnap
  } else {
    snappedY = topSnap
  }

  return { x: snappedX, y: snappedY }
}

/**
 * Get grid lines for rendering the grid overlay
 * @param canvasWidth Canvas width
 * @param canvasHeight Canvas height
 * @param gridSettings Grid configuration
 * @returns Object with vertical and horizontal grid lines
 */
export function getGridLines(
  canvasWidth: number,
  canvasHeight: number,
  gridSettings: GridSettings,
) {
  const { columns, verticalGrid, gutter } = gridSettings

  // Calculate column positions
  const totalGutterWidth = gutter * (columns - 1)
  const availableWidth = canvasWidth - totalGutterWidth
  const columnWidth = availableWidth / columns

  const verticalLines: number[] = []
  for (let col = 0; col <= columns; col++) {
    verticalLines.push(col * columnWidth + (col > 0 ? col * gutter : 0))
  }

  // Calculate row positions
  const horizontalLines: number[] = []
  for (let row = 0; row * verticalGrid <= canvasHeight; row++) {
    horizontalLines.push(row * verticalGrid)
  }

  return { verticalLines, horizontalLines }
}
