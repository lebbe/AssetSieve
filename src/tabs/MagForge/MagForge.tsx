import { useMemo } from 'react'
import { ImageData } from '../../hooks/useImageSniffer'
import { MediaBrowser } from './MediaBrowser/MediaBrowser'
import { Creator } from './Creator/Creator'

import './MagForge.css'

type Props = {
  importedImages?: ImageData[]
  deleteImage: (url: string) => void
}

// oxlint-disable-next-line no-unused-vars
export function MagForge({ importedImages, deleteImage }: Props) {
  const magazineImages = importedImages || []

  // For now, we'll track used images as an empty set
  // Later this will come from the Creator's state
  const usedImageUrls = useMemo(() => new Set<string>(), [])

  return (
    <div className="magforge">
      <div className="magforge-layout">
        <div className="magforge-media">
          <MediaBrowser images={magazineImages} usedImageUrls={usedImageUrls} />
        </div>
        <div className="magforge-creator">
          <Creator />
        </div>
      </div>
    </div>
  )
}
