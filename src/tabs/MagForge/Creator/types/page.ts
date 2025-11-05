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

export type FontFamily =
  | 'Playfair Display'
  | 'Oswald'
  | 'Merriweather'
  | 'Lato'
  | 'Montserrat'
  | 'Roboto'

export type PlacedTextBox = {
  id: string
  text: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  fontFamily: FontFamily
  fontSize: number
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  color: string
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
  textBoxes: PlacedTextBox[]
  gridSettings?: GridSettings
}
