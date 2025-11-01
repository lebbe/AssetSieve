import { useEffect } from 'react'
import './ImageModal.css'

interface ImageModalProps {
  imageUrl: string
  onClose: () => void
}

export function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape, true) // Use capture phase
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape, true)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <img
          src={imageUrl}
          alt="Full size preview"
          className="image-modal-img"
        />
      </div>
    </div>
  )
}
