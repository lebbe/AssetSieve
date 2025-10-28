import { useState, useMemo } from 'react'
import { ImageData } from '../../../hooks/useImageSniffer'
import { Filter } from './components/Filter'
import { ImageGrid } from './components/ImageGrid'
import './MediaBrowser.css'

type Props = {
  images: ImageData[]
  usedImageUrls: Set<string>
}

export function MediaBrowser({ images, usedImageUrls }: Props) {
  const [nameFilter, setNameFilter] = useState('')
  const [minWidth, setMinWidth] = useState('')
  const [minHeight, setMinHeight] = useState('')
  const [showVectorOnly, setShowVectorOnly] = useState(false)
  const [hideUsedImages, setHideUsedImages] = useState(false)
  const [previewSize, setPreviewSize] = useState(120)

  const filteredImages = useMemo(() => {
    return images.filter((image) => {
      // Name filter
      if (nameFilter && !image.url.toLowerCase().includes(nameFilter.toLowerCase())) {
        return false
      }

      // Dimension filters
      if (minWidth && image.width < Number(minWidth)) {
        return false
      }
      if (minHeight && image.height < Number(minHeight)) {
        return false
      }

      // Vector/SVG only filter
      if (showVectorOnly && image.mimeType !== 'image/svg+xml') {
        return false
      }

      // Hide used images
      if (hideUsedImages && usedImageUrls.has(image.url)) {
        return false
      }

      return true
    })
  }, [images, nameFilter, minWidth, minHeight, showVectorOnly, hideUsedImages, usedImageUrls])

  return (
    <div className="media-browser">
      <h3 className="sr-only">Media Browser</h3>
      <Filter
        nameFilter={nameFilter}
        onNameFilterChange={setNameFilter}
        minWidth={minWidth}
        onMinWidthChange={setMinWidth}
        minHeight={minHeight}
        onMinHeightChange={setMinHeight}
        showVectorOnly={showVectorOnly}
        onShowVectorOnlyChange={setShowVectorOnly}
        hideUsedImages={hideUsedImages}
        onHideUsedImagesChange={setHideUsedImages}
        previewSize={previewSize}
        onPreviewSizeChange={setPreviewSize}
        totalImages={images.length}
        filteredImages={filteredImages.length}
      />
      <ImageGrid
        images={filteredImages}
        previewSize={previewSize}
        usedImageUrls={usedImageUrls}
      />
    </div>
  )
}
