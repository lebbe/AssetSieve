import { useMemo, useState } from 'react'
import { ImageData } from './useImageSniffer'

export type SortBy =
  | 'filename'
  | 'path'
  | 'filetype'
  | 'size'
  | 'width'
  | 'height'
  | 'manual'

export interface SortingState {
  sortBy: SortBy
  reversed: boolean
}

export function useSorting(filteredImages: ImageData[]) {
  const [sortingState, setSortingState] = useState<SortingState>({
    sortBy: 'manual',
    reversed: false,
  })

  // Manual ordering state - keeps track of custom order when sortBy is 'manual'
  const [manualOrder, setManualOrder] = useState<ImageData[]>([])

  // Update manual order when filteredImages change
  useMemo(() => {
    // Always update manual order to include new images
    // If we have existing manual order, preserve order of existing images and append new ones
    if (manualOrder.length === 0) {
      // First time or no manual order yet, just use filtered images
      setManualOrder(filteredImages)
    } else {
      // Preserve existing order but add new images that aren't in manual order yet
      const existingUrls = new Set(manualOrder.map((img) => img.url))
      const newImages = filteredImages.filter(
        (img) => !existingUrls.has(img.url),
      )
      const filteredExisting = manualOrder.filter((img) =>
        filteredImages.some((filtered) => filtered.url === img.url),
      )

      if (
        newImages.length > 0 ||
        filteredExisting.length !== manualOrder.length
      ) {
        setManualOrder([...filteredExisting, ...newImages])
      }
    }
  }, [filteredImages, manualOrder])

  // Extract path from URL (excluding domain and filename)
  const getPathFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      // Remove empty string and filename (last part)
      const pathWithoutFilename = pathParts.slice(1, -1).join('/')
      return pathWithoutFilename
    } catch {
      return ''
    }
  }

  // Extract filename from URL
  const getFilenameFromUrl = (url: string) => {
    return url.split('/').pop() || ''
  }

  // Extract file type from MIME type
  const getFileTypeFromMime = (mimeType: string) => {
    return mimeType.split('/')[1]?.toUpperCase() || 'UNKNOWN'
  }

  // Sort images based on current sorting state
  const sortedImages = useMemo(() => {
    if (sortingState.sortBy === 'manual') {
      // Filter manualOrder to only include images that are in filteredImages
      const filteredManualOrder = manualOrder.filter((image) =>
        filteredImages.some((filtered) => filtered.url === image.url),
      )
      return sortingState.reversed
        ? [...filteredManualOrder].reverse()
        : filteredManualOrder
    }

    const sorted = [...filteredImages].sort((a, b) => {
      let comparison = 0

      switch (sortingState.sortBy) {
        case 'filename': {
          const filenameA = getFilenameFromUrl(a.url).toLowerCase()
          const filenameB = getFilenameFromUrl(b.url).toLowerCase()
          comparison = filenameA.localeCompare(filenameB)
          break
        }

        case 'path': {
          const pathA = getPathFromUrl(a.url).toLowerCase()
          const pathB = getPathFromUrl(b.url).toLowerCase()
          comparison = pathA.localeCompare(pathB)
          break
        }

        case 'filetype': {
          const typeA = getFileTypeFromMime(a.mimeType)
          const typeB = getFileTypeFromMime(b.mimeType)
          comparison = typeA.localeCompare(typeB)
          break
        }

        case 'size': {
          comparison = b.size - a.size // Descending order (largest first)
          break
        }

        case 'width': {
          const widthA = a.width || 0
          const widthB = b.width || 0
          comparison = widthB - widthA // Descending order (largest first)
          break
        }

        case 'height': {
          const heightA = a.height || 0
          const heightB = b.height || 0
          comparison = heightB - heightA // Descending order (largest first)
          break
        }

        default:
          comparison = 0
      }

      // Apply reverse if needed
      return sortingState.reversed ? -comparison : comparison
    })

    return sorted
  }, [filteredImages, sortingState.sortBy, sortingState.reversed, manualOrder])

  const setSortBy = (sortBy: SortBy) => {
    setSortingState((prev) => ({
      ...prev,
      sortBy,
    }))
  }

  const setReversed = (reversed: boolean) => {
    setSortingState((prev) => ({
      ...prev,
      reversed,
    }))
  }

  const setImageOrder = (newOrder: ImageData[]) => {
    setManualOrder(newOrder)
    // Switch to manual mode if not already
    if (sortingState.sortBy !== 'manual') {
      setSortingState((prev) => ({
        ...prev,
        sortBy: 'manual',
      }))
    }
  }

  return {
    sortedImages,
    sortBy: sortingState.sortBy,
    reversed: sortingState.reversed,
    setSortBy,
    setReversed,
    setImageOrder,
  }
}
