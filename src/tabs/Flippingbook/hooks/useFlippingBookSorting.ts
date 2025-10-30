import { useState, useMemo, useEffect } from 'react'
import { FlippingBookPair } from './useCombiner'
import { naturalCompare } from '../../../utils/naturalSort'

export type FlippingBookSortBy =
  | 'manual'
  | 'filename'
  | 'filename-numeric'
  | 'path'
  | 'filetype'
  | 'size'
  | 'width'
  | 'height'

export function useFlippingBookSorting(flippingBooks: FlippingBookPair[]) {
  const [sortBy, setSortBy] = useState<FlippingBookSortBy>('manual')
  const [reversed, setReversed] = useState(false)
  const [manualOrder, setManualOrder] = useState<FlippingBookPair[]>([])

  // Update manual order when flippingBooks changes
  useEffect(() => {
    if (
      manualOrder.length === 0 ||
      manualOrder.length !== flippingBooks.length
    ) {
      setManualOrder([...flippingBooks])
    }
  }, [flippingBooks, manualOrder.length])

  const sortedFlippingBooks = useMemo(() => {
    let sorted: FlippingBookPair[]

    switch (sortBy) {
      case 'manual':
        // Use manual order, but filter to only include current flippingBooks
        const currentUrls = new Set(flippingBooks.map((book) => book.webp.url))
        sorted = manualOrder.filter((book) => currentUrls.has(book.webp.url))

        // Add any new books that aren't in manual order yet
        const orderedUrls = new Set(sorted.map((book) => book.webp.url))
        const newBooks = flippingBooks.filter(
          (book) => !orderedUrls.has(book.webp.url),
        )
        sorted = [...sorted, ...newBooks]
        break

      case 'filename':
        sorted = [...flippingBooks].sort((a, b) =>
          a.filename.localeCompare(b.filename),
        )
        break

      case 'filename-numeric':
        sorted = [...flippingBooks].sort((a, b) =>
          naturalCompare(a.filename.toLowerCase(), b.filename.toLowerCase()),
        )
        break

      case 'path':
        sorted = [...flippingBooks].sort((a, b) =>
          a.webppath.localeCompare(b.webppath),
        )
        break

      case 'filetype':
        sorted = [...flippingBooks].sort((a, b) =>
          a.mimeType.localeCompare(b.mimeType),
        )
        break

      case 'size':
        sorted = [...flippingBooks].sort((a, b) => b.size - a.size)
        break

      case 'width':
        sorted = [...flippingBooks].sort((a, b) => b.width - a.width)
        break

      case 'height':
        sorted = [...flippingBooks].sort((a, b) => b.height - a.height)
        break

      default:
        sorted = [...flippingBooks]
    }

    return reversed ? sorted.reverse() : sorted
  }, [flippingBooks, sortBy, reversed, manualOrder])

  const setFlippingBookOrder = (newOrder: FlippingBookPair[]) => {
    setManualOrder(newOrder)
  }

  return {
    sortedFlippingBooks,
    sortBy,
    setSortBy,
    reversed,
    setReversed,
    setFlippingBookOrder,
  }
}
