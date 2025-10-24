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
      const result = [...filteredImages]
      return sortingState.reversed ? result.reverse() : result
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
  }, [filteredImages, sortingState.sortBy, sortingState.reversed])

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

  return {
    sortedImages,
    sortBy: sortingState.sortBy,
    reversed: sortingState.reversed,
    setSortBy,
    setReversed,
  }
}
