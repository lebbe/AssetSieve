import { useMemo, useState } from 'react'
import { FlippingBookPair } from './useCombiner'

export interface FlippingBookFilterState {
  path: string
  filename: string
  minWidth: string
  minHeight: string
  minFileSize: string
  fileTypes: Set<string>
}

export function useFlippingBookFilter(flippingBooks: FlippingBookPair[]) {
  const [filters, setFilters] = useState<FlippingBookFilterState>({
    path: '',
    filename: '',
    minWidth: '',
    minHeight: '',
    minFileSize: '',
    fileTypes: new Set(),
  })

  // Get unique file types from flipping books (will always be 'COMBINED' for our pairs)
  const availableFileTypes = useMemo(() => {
    const types = new Set<string>()
    flippingBooks.forEach((book) => {
      types.add('COMBINED')
    })
    return Array.from(types).sort()
  }, [flippingBooks])

  // Parse size string (e.g., "1MB", "500KB") to bytes
  const parseSize = (sizeStr: string): number => {
    if (!sizeStr) return 0

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i)
    if (!match) return 0

    const value = parseFloat(match[1])
    const unit = (match[2] || 'B').toUpperCase()

    switch (unit) {
      case 'GB':
        return value * 1024 * 1024 * 1024
      case 'MB':
        return value * 1024 * 1024
      case 'KB':
        return value * 1024
      default:
        return value
    }
  }

  // Filter flipping books based on current filters
  const filteredFlippingBooks = useMemo(() => {
    return flippingBooks.filter((book) => {
      // Path filter
      if (
        filters.path &&
        !book.webppath.toLowerCase().includes(filters.path.toLowerCase())
      ) {
        return false
      }

      // Filename filter
      if (
        filters.filename &&
        !book.filename.toLowerCase().includes(filters.filename.toLowerCase())
      ) {
        return false
      }

      // Min width filter
      if (filters.minWidth) {
        const minWidth = parseInt(filters.minWidth)
        if (!isNaN(minWidth) && book.width < minWidth) {
          return false
        }
      }

      // Min height filter
      if (filters.minHeight) {
        const minHeight = parseInt(filters.minHeight)
        if (!isNaN(minHeight) && book.height < minHeight) {
          return false
        }
      }

      // Min file size filter
      if (filters.minFileSize) {
        const minSize = parseSize(filters.minFileSize)
        if (minSize > 0 && book.size < minSize) {
          return false
        }
      }

      // File type filter (if any types are selected, only show those)
      if (filters.fileTypes.size > 0 && !filters.fileTypes.has('COMBINED')) {
        return false
      }

      return true
    })
  }, [flippingBooks, filters])

  const handleInputChange = (
    field: keyof FlippingBookFilterState,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileTypeToggle = (fileType: string) => {
    setFilters((prev) => {
      const newFileTypes = new Set(prev.fileTypes)
      if (newFileTypes.has(fileType)) {
        newFileTypes.delete(fileType)
      } else {
        newFileTypes.add(fileType)
      }
      return { ...prev, fileTypes: newFileTypes }
    })
  }

  const clearFilters = () => {
    setFilters({
      path: '',
      filename: '',
      minWidth: '',
      minHeight: '',
      minFileSize: '',
      fileTypes: new Set(),
    })
  }

  return {
    filteredFlippingBooks,
    availableFileTypes,
    filters,
    clearFilters,
    handleFileTypeToggle,
    handleInputChange,
  }
}
