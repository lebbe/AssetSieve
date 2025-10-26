import { useState } from 'react'
import { FlippingBookPair } from './useCombiner'

export function useFlippingBookDragAndDrop(
  items: FlippingBookPair[],
  setItemOrder: (newOrder: FlippingBookPair[]) => void,
) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    if (
      draggedIndex !== null &&
      dragOverIndex !== null &&
      draggedIndex !== dragOverIndex
    ) {
      const newItems = [...items]
      const draggedItem = newItems[draggedIndex]

      if (!draggedItem) {
        setDraggedIndex(null)
        setDragOverIndex(null)
        return
      }

      // Remove the dragged item from its original position
      newItems.splice(draggedIndex, 1)

      // Insert it at the new position
      newItems.splice(dragOverIndex, 0, draggedItem)

      setItemOrder(newItems)
    }

    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (index: number) => {
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index)
    }
  }

  return {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
  }
}
