import { useState, useMemo } from 'react'
import { ImageData } from '../../../hooks/useImageSniffer'

export function useMagForge() {
  const [magForgeImages, setMagForgeImages] = useState<ImageData[]>([])

  // Memoize the set of existing URLs to avoid recalculating on every countUniqueImages call
  const existingUrls = useMemo(
    () => new Set(magForgeImages.map((img) => img.url)),
    [magForgeImages],
  )

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
    return candidateImages.filter((img) => !existingUrls.has(img.url)).length
  }

  return {
    magForgeImages,
    setUniqueMagForgeImages,
    deleteMagForgeImage,
    countUniqueImages,
  }
}
