import { useState } from 'react'
import { FormatName, getFormatDimensions } from './utils/pdfFormats'
import { Page, PlacedImage } from './types/page'
import { createPDF } from './utils/pdfExport'
import { Toolbar } from './components/Toolbar'
import { Pagination } from './components/Pagination'
import { Canvas } from './components/Canvas'
import './Creator.css'

type Props = {
  pages: Page[]
  onPagesChange: (pages: Page[]) => void
}

export function Creator({ pages, onPagesChange }: Props) {
  const [selectedFormat, setSelectedFormat] =
    useState<FormatName>('A4 Portrait')
  const [width, setWidth] = useState<number>(
    getFormatDimensions('A4 Portrait').width,
  )
  const [height, setHeight] = useState<number>(
    getFormatDimensions('A4 Portrait').height,
  )
  const [magazineName, setMagazineName] = useState('')
  const [creatorName, setCreatorName] = useState('')
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [zoom, setZoom] = useState(1)

  const currentPage = pages[currentPageIndex]

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3)) // Max 300%
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.25)) // Min 25%
  }

  const handleZoomReset = () => {
    setZoom(1)
  }

  const handlePageChange = (pageNumber: number) => {
    setCurrentPageIndex(pageNumber - 1)
  }

  const handleAddPage = () => {
    const newPage: Page = {
      id: `${Date.now()}`,
      images: [],
    }
    onPagesChange([...pages, newPage])
    setCurrentPageIndex(pages.length) // Go to new page
  }

  const handleDeletePage = () => {
    if (pages.length > 1) {
      const newPages = pages.filter((_, index) => index !== currentPageIndex)
      onPagesChange(newPages)
      // Adjust current page if needed
      if (currentPageIndex >= newPages.length) {
        setCurrentPageIndex(newPages.length - 1)
      }
    }
  }

  const handleImagesChange = (images: PlacedImage[]) => {
    const newPages = [...pages]
    if (currentPage) {
      newPages[currentPageIndex] = { ...currentPage, images }
      onPagesChange(newPages)
    }
  }

  const handleExport = async () => {
    try {
      await createPDF({
        metadata: {
          width,
          height,
          magazineName,
          creatorName,
        },
        pages,
      })
      console.log('PDF exported successfully!')
    } catch (error) {
      console.error('Failed to export PDF:', error)
      alert('Failed to export PDF. Check console for details.')
    }
  }

  const handleDoubleResolution = () => {
    setWidth(width * 2)
    setHeight(height * 2)
  }

  return (
    <div className="creator">
      <h3 className="sr-only">Creator</h3>

      <Toolbar
        selectedFormat={selectedFormat}
        onFormatChange={setSelectedFormat}
        width={width}
        onWidthChange={setWidth}
        height={height}
        onHeightChange={setHeight}
        magazineName={magazineName}
        onMagazineNameChange={setMagazineName}
        creatorName={creatorName}
        onCreatorNameChange={setCreatorName}
        onExport={handleExport}
        onDoubleResolution={handleDoubleResolution}
      />

      <Pagination
        currentPage={currentPageIndex + 1}
        totalPages={pages.length}
        onPageChange={handlePageChange}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
      />

      <Canvas
        width={width}
        height={height}
        images={currentPage?.images || []}
        onImagesChange={handleImagesChange}
        userZoom={zoom}
      />
    </div>
  )
}
