import { useEffect, useState } from 'react'
import { NetworkRequest } from './useRequestSniffing'

export interface ImageData {
  url: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  base64: string
}

export function useImageSniffer(requests: NetworkRequest[]) {
  const [images, setImages] = useState<ImageData[]>([])

  useEffect(() => {
    // If requests is empty, clear all images
    if (requests.length === 0) {
      setImages([])
      return
    }

    const imageRequests = requests.filter(
      (request) =>
        request.mimeType.startsWith('image/') && request.chromeRequest
    )

    // Process new images that haven't been processed yet
    const newImageRequests = imageRequests.filter(
      (request) => !images.some((img) => img.url === request.url)
    )

    if (newImageRequests.length === 0) return

    newImageRequests.forEach((request) => {
      if (!request.chromeRequest) return

      request.chromeRequest.getContent((content, encoding) => {
        if (content && encoding === 'base64') {
          // Create an image element to get dimensions
          const img = new Image()

          const addImageData = (
            width: number | null,
            height: number | null
          ) => {
            const imageData: ImageData = {
              url: request.url,
              mimeType: request.mimeType,
              size: request.size,
              width,
              height,
              base64: content,
            }

            setImages((prev) => {
              // Check if already exists to avoid duplicates
              if (prev.some((img) => img.url === request.url)) {
                return prev
              }
              return [...prev, imageData]
            })
          }

          img.onload = () => addImageData(img.width, img.height)
          img.onerror = () => addImageData(null, null)
          img.src = `data:${request.mimeType};base64,${content}`
        } else {
          // Add image data even if we can't get base64 content
          const imageData: ImageData = {
            url: request.url,
            mimeType: request.mimeType,
            size: request.size,
            width: null,
            height: null,
            base64: content || '',
          }

          setImages((prev) => {
            if (prev.some((img) => img.url === request.url)) {
              return prev
            }
            return [...prev, imageData]
          })
        }
      })
    })
  }, [requests, images])

  return { images }
}
