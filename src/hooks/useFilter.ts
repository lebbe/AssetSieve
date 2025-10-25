import { useMemo, useState } from 'react'
import { ImageData } from './useImageSniffer'

export interface FilterState {
  path: string
  filename: string
  minWidth: string
  minHeight: string
  minFileSize: string
  fileTypes: Set<string>
}

export function useFilter(images: ImageData[]) {
  const [filters, setFilters] = useState<FilterState>({
    path: '',
    filename: '',
    minWidth: '',
    minHeight: '',
    minFileSize: '',
    fileTypes: new Set(),
  })

  // Get unique file types from images
  const availableFileTypes = useMemo(() => {
    const types = new Set<string>()
    images.forEach((image) => {
      const type = image.mimeType.split('/')[1]?.toUpperCase()
      if (type) {
        types.add(type)
      }
    })
    return Array.from(types).sort()
  }, [images])

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

  // Filter images based on current filters
  const filteredImagesList = useMemo(() => {
    return images.filter((image) => {
      // Remove images without essential data (filesize or dimensions)
      /*
      if (!image.size || image.size <= 0) {
        return false
      }
      if (
        !image.width ||
        !image.height ||
        image.width <= 0 ||
        image.height <= 0
      ) {
        return false
      }*/

      // Path filter
      if (filters.path) {
        const imagePath = getPathFromUrl(image.url)
        if (!imagePath.toLowerCase().includes(filters.path.toLowerCase())) {
          return false
        }
      }

      // Filename filter
      if (filters.filename) {
        const filename = getFilenameFromUrl(image.url)
        if (!filename.toLowerCase().includes(filters.filename.toLowerCase())) {
          return false
        }
      }

      // Min width filter
      if (filters.minWidth) {
        const minWidth = parseInt(filters.minWidth)
        if (!isNaN(minWidth) && image.width < minWidth) {
          return false
        }
      }

      // Min height filter
      if (filters.minHeight) {
        const minHeight = parseInt(filters.minHeight)
        if (!isNaN(minHeight) && image.height < minHeight) {
          return false
        }
      }

      // Min file size filter (user input in KB, image.size is in bytes)
      if (filters.minFileSize) {
        const minFileSizeKB = parseInt(filters.minFileSize)
        if (!isNaN(minFileSizeKB) && image.size / 1024 < minFileSizeKB) {
          return false
        }
      }

      // File type filter
      if (filters.fileTypes.size > 0) {
        const imageType = image.mimeType.split('/')[1]?.toUpperCase()
        if (!imageType || !filters.fileTypes.has(imageType)) {
          return false
        }
      }

      return true
    })
  }, [images, filters])

  const handleInputChange = (field: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleFileTypeToggle = (fileType: string) => {
    setFilters((prev) => {
      const newFileTypes = new Set(prev.fileTypes)
      if (newFileTypes.has(fileType)) {
        newFileTypes.delete(fileType)
      } else {
        newFileTypes.add(fileType)
      }
      return {
        ...prev,
        fileTypes: newFileTypes,
      }
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
    filteredImages: filteredImagesList,
    filters,
    handleInputChange,
    availableFileTypes,
    handleFileTypeToggle,
    clearFilters,
  }
}
