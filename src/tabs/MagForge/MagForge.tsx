import { ImageData } from '../../hooks/useImageSniffer'

import './MagForge.css'

type Props = {
  importedImages?: ImageData[]
  deleteImage: (url: string) => void
}

export function MagForge({ importedImages, deleteImage }: Props) {
  const magazineImages = importedImages || []

  return (
    <div className="magforge">
      <h2>Hello world</h2>
      <p>Magazine images stored independently: {magazineImages.length}</p>
      {magazineImages.length === 0 ? (
        <p>
          No images yet. Go to the Images tab and click "Send to MagForge" to
          add images.
        </p>
      ) : (
        magazineImages.map((img, index) => (
          <div key={index} className="magazine-image">
            <img src={img.url} alt={`MagForge Image ${index + 1}`} />
          </div>
        ))
      )}
    </div>
  )
}
