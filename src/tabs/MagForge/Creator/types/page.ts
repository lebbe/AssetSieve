import { ImageData } from '../../../../hooks/useImageSniffer'

export type PlacedImage = {
  id: string
  image: ImageData
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  // Advanced editing state
  isEditing?: boolean
  croppedWidth?: number
  croppedHeight?: number
  croppedX?: number
  croppedY?: number
}

export type GridSettings = {
  columns: number // Number of columns for horizontal grid (default 12)
  verticalGrid: number // Vertical grid spacing in points/pixels (default 12)
  gutter: number // Gutter spacing in points/pixels (default 0)
  enabled: boolean // Whether grid snapping is enabled (default true)
}

export type Page = {
  id: string
  images: PlacedImage[]
  gridSettings?: GridSettings
}
