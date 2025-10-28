import { useState } from 'react'
import { ImageData } from '../../../hooks/useImageSniffer'

export function useMagForge() {
  const [magForgeImages, setMagForgeImages] = useState<ImageData[]>([])

  const setUniqueMagForgeImages = (newImages: ImageData[]) => {
    setMagForgeImages((prev) => {
      const existingUrls = new Set(prev.map((img) => img.url))
      const uniqueNewImages = newImages.filter(
        (img) => !existingUrls.has(img.url),
      )
      return [...prev, ...uniqueNewImages]
    })
  }

  const deleteMagForgeImage = (url: string) => {
    setMagForgeImages((prev) => prev.filter((img) => img.url !== url))
  }

  const countUniqueImages = (candidateImages: ImageData[]) => {
    const existingUrls = new Set(magForgeImages.map((img) => img.url))
    return candidateImages.filter((img) => !existingUrls.has(img.url)).length
  }

  return {
    magForgeImages,
    setUniqueMagForgeImages,
    deleteMagForgeImage,
    countUniqueImages,
  }
}
