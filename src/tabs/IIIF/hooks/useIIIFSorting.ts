import { useMemo, useState } from 'react'
import { IIIFImage } from './useIIIFDetector'

export type IIIFSortBy = 'default' | 'baseUrl' | 'identifier' | 'dimensions'

export function useIIIFSorting(images: IIIFImage[]) {
  const [sortBy, setSortBy] = useState<IIIFSortBy>('default')
  const [reversed, setReversed] = useState(false)
  const [manualOrder, setManualOrder] = useState<IIIFImage[]>([])

  const sortedImages = useMemo(() => {
    // Use manual order if sortBy is 'default' and manual order exists
    if (sortBy === 'default' && manualOrder.length > 0) {
      // Find new images that aren't in manualOrder
      const manualBaseUrls = new Set(manualOrder.map((img) => img.baseUrl))
      const newImages = images.filter((img) => !manualBaseUrls.has(img.baseUrl))

      // Append new images to the end of manual order
      const combined = [...manualOrder, ...newImages]
      return reversed ? [...combined].reverse() : combined
    }

    const sorted = [...images]

    switch (sortBy) {
      case 'default':
        // Keep original order (order of detection/download)
        break

      case 'baseUrl':
        sorted.sort((a, b) => a.baseUrl.localeCompare(b.baseUrl))
        break

      case 'identifier':
        sorted.sort((a, b) => a.identifier.localeCompare(b.identifier))
        break

      case 'dimensions':
        sorted.sort((a, b) => {
          const aArea = a.fullWidth * a.fullHeight
          const bArea = b.fullWidth * b.fullHeight
          return bArea - aArea // Largest first
        })
        break
    }

    return reversed ? sorted.reverse() : sorted
  }, [images, sortBy, reversed, manualOrder])

  const setImageOrder = (newOrder: IIIFImage[]) => {
    setManualOrder(newOrder)
    setSortBy('default')
    setReversed(false)
  }

  return {
    sortedImages,
    sortBy,
    setSortBy,
    reversed,
    setReversed,
    setImageOrder,
  }
}
