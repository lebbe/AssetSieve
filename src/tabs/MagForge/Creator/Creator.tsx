import { useState } from 'react'
import { ImageData } from '../../../hooks/useImageSniffer'
import './Creator.css'

type DropEvent = {
  image: ImageData
  timestamp: number
  position: { x: number; y: number }
}

export function Creator() {
  const [dropEvents, setDropEvents] = useState<DropEvent[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    try {
      const data = e.dataTransfer.getData('application/json')
      const image = JSON.parse(data) as ImageData

      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const dropEvent: DropEvent = {
        image,
        timestamp: Date.now(),
        position: { x, y },
      }

      setDropEvents((prev) => [...prev, dropEvent])

      console.log('Image dropped:', {
        url: image.url,
        position: { x, y },
        size: image.size,
        dimensions: `${image.width}x${image.height}`,
      })
    } catch (error) {
      console.error('Failed to parse dropped data:', error)
    }
  }

  return (
    <div className="creator">
      <h3 className="sr-only">Creator</h3>
      <div
        className={`creator-drop-zone ${isDragOver ? 'creator-drop-zone--active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dropEvents.length === 0 ? (
          <p className="creator-placeholder">Drag images here to create your magazine</p>
        ) : (
          <div className="creator-events">
            <h4>Drop Events ({dropEvents.length})</h4>
            {dropEvents.map((event, index) => (
              <div key={index} className="creator-event">
                <span className="event-number">{index + 1}</span>
                <img src={event.image.url} alt="" className="event-thumbnail" />
                <div className="event-details">
                  <div className="event-url">{event.image.url.split('/').pop()}</div>
                  <div className="event-position">
                    Position: ({Math.round(event.position.x)}, {Math.round(event.position.y)})
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
