import { useMemo, useState } from 'react'
import { FontFileData } from './useFontSniffer'

export interface FontFilterState {
  filename: string
  fontFamily: string
  classification: string
  minFileSize: string
  fileTypes: Set<string>
}

export function useFontFilter(fonts: FontFileData[]) {
  const [filters, setFilters] = useState<FontFilterState>({
    filename: '',
    fontFamily: '',
    classification: '',
    minFileSize: '',
    fileTypes: new Set(),
  })

  // Get unique file types from fonts
  const availableFileTypes = useMemo(() => {
    const types = new Set<string>()
    fonts.forEach((font) => {
      // Extract extension from filename or mime type
      const ext = font.filename.split('.').pop()?.toUpperCase()
      if (ext) {
        types.add(ext)
      }
    })
    return Array.from(types).sort()
  }, [fonts])

  // Get unique classifications
  const availableClassifications = useMemo(() => {
    const classifications = new Set<string>()
    fonts.forEach((font) => {
      if (font.metadata.classification) {
        classifications.add(font.metadata.classification)
      }
    })
    return Array.from(classifications).sort()
  }, [fonts])

  // Filter fonts based on current filters
  const filteredFontsList = useMemo(() => {
    return fonts.filter((font) => {
      // Filename filter
      if (filters.filename) {
        if (
          !font.filename.toLowerCase().includes(filters.filename.toLowerCase())
        ) {
          return false
        }
      }

      // Font family filter
      if (filters.fontFamily) {
        const fontFamily = font.metadata.fontFamily || ''
        if (
          !fontFamily.toLowerCase().includes(filters.fontFamily.toLowerCase())
        ) {
          return false
        }
      }

      // Classification filter
      if (filters.classification) {
        const classification = font.metadata.classification || ''
        if (classification !== filters.classification) {
          return false
        }
      }

      // Min file size filter (user input in KB, font.size is in bytes)
      if (filters.minFileSize) {
        const minFileSizeKB = parseInt(filters.minFileSize)
        if (!isNaN(minFileSizeKB) && font.size / 1024 < minFileSizeKB) {
          return false
        }
      }

      // File type filter
      if (filters.fileTypes.size > 0) {
        const ext = font.filename.split('.').pop()?.toUpperCase()
        if (!ext || !filters.fileTypes.has(ext)) {
          return false
        }
      }

      return true
    })
  }, [fonts, filters])

  const handleInputChange = (field: keyof FontFilterState, value: string) => {
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
      filename: '',
      fontFamily: '',
      classification: '',
      minFileSize: '',
      fileTypes: new Set(),
    })
  }

  return {
    filteredFonts: filteredFontsList,
    filters,
    handleInputChange,
    availableFileTypes,
    availableClassifications,
    handleFileTypeToggle,
    clearFilters,
  }
}
