import { ImageData } from '../../../../hooks/useImageSniffer'

export type PlacedImage = {
  id: string
  image: ImageData
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

export type Page = {
  id: string
  images: PlacedImage[]
}
