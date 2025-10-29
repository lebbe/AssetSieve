import { useState, useMemo } from 'react'
import { ImageData } from '../../hooks/useImageSniffer'
import { MediaBrowser } from './MediaBrowser/MediaBrowser'
import { Creator } from './Creator/Creator'
import { Page } from './Creator/types/page'

import './MagForge.css'

type Props = {
  importedImages?: ImageData[]
  deleteImage: (url: string) => void
}

export function MagForge({ importedImages, deleteImage }: Props) {
  const magazineImages = importedImages || []
  const [pages, setPages] = useState<Page[]>([{ id: '1', images: [] }])

  // Track which images are used on the canvas across all pages
  const usedImageUrls = useMemo(() => {
    const urls = new Set<string>()
    pages.forEach((page) => {
      page.images.forEach((placedImage) => {
        urls.add(placedImage.image.url)
      })
    })
    return urls
  }, [pages])

  return (
    <div className="magforge">
      <div className="magforge-layout">
        <div className="magforge-media">
          <MediaBrowser
            images={magazineImages}
            usedImageUrls={usedImageUrls}
            deleteImage={deleteImage}
          />
        </div>
        <div className="magforge-creator">
          <Creator pages={pages} onPagesChange={setPages} />
        </div>
      </div>
    </div>
  )
}
