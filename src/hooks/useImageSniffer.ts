import { useEffect, useState } from 'react'
import { NetworkRequest } from './useRequestSniffing'

export interface ImageData {
  url: string
  mimeType: string
  size: number
  width: number
  height: number
  base64: string
}

const imageExtensions = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.svg',
  '.ico',
  '.tiff',
  '.tif',
]

// Helper function to detect if a request is likely an image
function isLikelyImage(request: NetworkRequest): boolean {
  // Check MIME type first
  if (request.mimeType.startsWith('image/')) {
    return true
  }

  if (
    request.mimeType === 'application/octet-stream' ||
    request.mimeType === 'application/binary' ||
    request.mimeType === ''
  ) {
    const url = request.url.toLowerCase()

    const hasImageExtension = imageExtensions.some((ext) => url.includes(ext))

    return hasImageExtension
  }

  return false
}

function detectMimeType(url: string) {
  const urlLower = url.toLowerCase()
  if (urlLower.includes('.png')) return 'image/png'
  else if (urlLower.includes('.gif')) return 'image/gif'
  else if (urlLower.includes('.webp')) return 'image/webp'
  else if (urlLower.includes('.svg')) return 'image/svg+xml'
  else if (urlLower.includes('.bmp')) return 'image/bmp'
  else if (urlLower.includes('.tif')) return 'image/tiff'
  return 'image/jpeg'
}

export function useImageSniffer(requests: NetworkRequest[]) {
  const [images, setImages] = useState<ImageData[]>([])

  // Effect to sync images with requests (cleanup removed images)
  useEffect(() => {
    if (requests.length === 0) {
      setImages([])
      return
    }

    const imageRequestUrls = new Set(
      requests
        .filter((request) => isLikelyImage(request))
        .map((request) => request.url)
    )

    setImages((prev) => prev.filter((img) => imageRequestUrls.has(img.url)))
  }, [requests])

  // Effect to process new image requests
  useEffect(() => {
    if (requests.length === 0) return

    const imageRequests = requests.filter(
      (request) => isLikelyImage(request) && request.chromeRequest
    )

    const newImageRequests = imageRequests.filter(
      (request) => !images.some((img) => img.url === request.url)
    )

    if (newImageRequests.length === 0) return

    newImageRequests.forEach((request) => {
      if (!request.chromeRequest) return

      request.chromeRequest.getContent((content, encoding) => {
        const addImageData = (
          width: number | null,
          height: number | null,
          actualMimeType?: string
        ) => {
          const imageData: ImageData = {
            url: request.url,
            mimeType: actualMimeType || request.mimeType,
            size: request.size,
            width: width || 0,
            height: height || 0,
            base64: content,
          }

          setImages((prev) => {
            if (prev.some((img) => img.url === request.url)) {
              return prev
            }
            return [...prev, imageData]
          })
        }

        if (content && encoding === 'base64') {
          const img = new Image()

          // For octet-stream or unknown types, try to detect the actual image format
          let dataSrc: string
          if (
            request.mimeType === 'application/octet-stream' ||
            request.mimeType === 'application/binary' ||
            request.mimeType === ''
          ) {
            const detectedMimeType = detectMimeType(request.url)

            dataSrc = `data:${detectedMimeType};base64,${content}`

            img.onload = () =>
              addImageData(img.width, img.height, detectedMimeType)
          } else {
            dataSrc = `data:${request.mimeType};base64,${content}`
            img.onload = () => addImageData(img.width, img.height)
          }

          img.src = dataSrc
        }
        if (
          request.mimeType === 'application/octet-stream' ||
          request.mimeType === 'application/binary' ||
          request.mimeType === ''
        ) {
          chrome.runtime.sendMessage(
            {
              action: 'fetchAsDataURL',
              url: request.url,
            },
            (dataUrl) => {
              if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message)
                return
              }
              if (dataUrl) {
                const detectedMimeType = detectMimeType(request.url)

                const dataSrc = `data:${detectedMimeType};base64,${content}`
                const img = new Image()
                img.onload = () =>
                  addImageData(img.width, img.height, detectedMimeType)
                img.src = dataSrc
              } else {
                console.error(
                  'Failed to retrieve image content from background script.'
                )
              }
            }
          )
        } else {
          const imageData: ImageData = {
            url: request.url,
            mimeType: request.mimeType,
            size: request.size,
            width: 0,
            height: 0,
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
