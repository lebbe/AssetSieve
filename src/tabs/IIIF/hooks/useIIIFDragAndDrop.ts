import { useState } from 'react'
import { IIIFImage } from './useIIIFDetector'

export function useIIIFDragAndDrop(
  sortedImages: IIIFImage[],
  setImageOrder: (newOrder: IIIFImage[]) => void,
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
      const newOrder = [...sortedImages]
      const draggedItem = newOrder[draggedIndex]

      if (!draggedItem) {
        setDraggedIndex(null)
        setDragOverIndex(null)
        return
      }

      // Remove the dragged item
      newOrder.splice(draggedIndex, 1)

      // Insert it at the new position
      newOrder.splice(dragOverIndex, 0, draggedItem)

      setImageOrder(newOrder)
    }

    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (index: number) => {
    setDragOverIndex(index)
  }

  return {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
  }
}
