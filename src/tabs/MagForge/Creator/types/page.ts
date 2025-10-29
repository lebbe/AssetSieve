import { ImageData } from '../../../../hooks/useImageSniffer'

export type PlacedImage = {
  id: string
  image: ImageData
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  // Cropping state - the visible portion of the image
  croppedWidth?: number // Never exceeds width
  croppedHeight?: number // Never exceeds height
  croppedX?: number // X offset within the image
  croppedY?: number // Y offset within the image
  // Rotation in degrees
  rotation?: number
}

export type Page = {
  id: string
  images: PlacedImage[]
}
