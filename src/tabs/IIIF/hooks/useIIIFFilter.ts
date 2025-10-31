import { useMemo, useState } from 'react'
import { IIIFImage } from './useIIIFDetector'

export interface IIIFFilterState {
  identifier: string
  baseUrl: string
  minWidth: string
  minHeight: string
  minTiles: string
}

export function useIIIFFilter(images: IIIFImage[]) {
  const [filters, setFilters] = useState<IIIFFilterState>({
    identifier: '',
    baseUrl: '',
    minWidth: '',
    minHeight: '',
    minTiles: '',
  })

  const handleInputChange = (field: keyof IIIFFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const clearFilters = () => {
    setFilters({
      identifier: '',
      baseUrl: '',
      minWidth: '',
      minHeight: '',
      minTiles: '',
    })
  }

  const filteredImages = useMemo(() => {
    return images.filter((image) => {
      // Filter by identifier
      if (
        filters.identifier &&
        !image.identifier
          .toLowerCase()
          .includes(filters.identifier.toLowerCase())
      ) {
        return false
      }

      // Filter by base URL
      if (
        filters.baseUrl &&
        !image.baseUrl.toLowerCase().includes(filters.baseUrl.toLowerCase())
      ) {
        return false
      }

      // Filter by minimum width
      if (filters.minWidth) {
        const minWidth = parseInt(filters.minWidth)
        if (!isNaN(minWidth) && image.fullWidth < minWidth) {
          return false
        }
      }

      // Filter by minimum height
      if (filters.minHeight) {
        const minHeight = parseInt(filters.minHeight)
        if (!isNaN(minHeight) && image.fullHeight < minHeight) {
          return false
        }
      }

      // Filter by minimum tiles
      if (filters.minTiles) {
        const minTiles = parseInt(filters.minTiles)
        if (!isNaN(minTiles) && image.tiles.length < minTiles) {
          return false
        }
      }

      return true
    })
  }, [images, filters])

  return {
    filteredImages,
    filters,
    handleInputChange,
    clearFilters,
  }
}
