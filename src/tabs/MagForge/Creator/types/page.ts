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
  rotation?: number
}

export type Page = {
  id: string
  images: PlacedImage[]
}
