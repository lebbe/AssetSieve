import { useMemo, useState } from 'react'
import { FontFileData } from './useFontSniffer'

export type FontSortBy =
  | 'filename'
  | 'fontFamily'
  | 'classification'
  | 'size'
  | 'manual'

export interface FontSortingState {
  sortBy: FontSortBy
  reversed: boolean
}

export function useFontSorting(filteredFonts: FontFileData[]) {
  const [sortingState, setSortingState] = useState<FontSortingState>({
    sortBy: 'manual',
    reversed: false,
  })

  // Manual ordering state - keeps track of custom order when sortBy is 'manual'
  const [manualOrder, setManualOrder] = useState<FontFileData[]>([])

  // Update manual order when filteredFonts change
  useMemo(() => {
    // Always update manual order to include new fonts
    // If we have existing manual order, preserve order of existing fonts and append new ones
    if (manualOrder.length === 0) {
      // First time or no manual order yet, just use filtered fonts
      setManualOrder(filteredFonts)
    } else {
      // Preserve existing order but add new fonts that aren't in manual order yet
      const existingUrls = new Set(manualOrder.map((font) => font.url))
      const newFonts = filteredFonts.filter(
        (font) => !existingUrls.has(font.url),
      )
      const filteredExisting = manualOrder.filter((font) =>
        filteredFonts.some((filtered) => filtered.url === font.url),
      )

      if (
        newFonts.length > 0 ||
        filteredExisting.length !== manualOrder.length
      ) {
        setManualOrder([...filteredExisting, ...newFonts])
      }
    }
  }, [filteredFonts, manualOrder])

  // Sort fonts based on current sorting state
  const sortedFonts = useMemo(() => {
    if (sortingState.sortBy === 'manual') {
      // Filter manualOrder to only include fonts that are in filteredFonts
      const filteredManualOrder = manualOrder.filter((font) =>
        filteredFonts.some((filtered) => filtered.url === font.url),
      )
      return sortingState.reversed
        ? [...filteredManualOrder].reverse()
        : filteredManualOrder
    }

    const sorted = [...filteredFonts].sort((a, b) => {
      let comparison = 0

      switch (sortingState.sortBy) {
        case 'filename': {
          const filenameA = a.filename.toLowerCase()
          const filenameB = b.filename.toLowerCase()
          comparison = filenameA.localeCompare(filenameB)
          break
        }

        case 'fontFamily': {
          const familyA = (a.metadata.fontFamily || '').toLowerCase()
          const familyB = (b.metadata.fontFamily || '').toLowerCase()
          comparison = familyA.localeCompare(familyB)
          break
        }

        case 'classification': {
          const classA = a.metadata.classification || ''
          const classB = b.metadata.classification || ''
          comparison = classA.localeCompare(classB)
          break
        }

        case 'size': {
          comparison = b.size - a.size // Descending order (largest first)
          break
        }

        default:
          comparison = 0
      }

      // Apply reverse if needed
      return sortingState.reversed ? -comparison : comparison
    })

    return sorted
  }, [filteredFonts, sortingState.sortBy, sortingState.reversed, manualOrder])

  const setSortBy = (sortBy: FontSortBy) => {
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

  const setFontOrder = (newOrder: FontFileData[]) => {
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
    sortedFonts,
    sortBy: sortingState.sortBy,
    reversed: sortingState.reversed,
    setSortBy,
    setReversed,
    setFontOrder,
  }
}
