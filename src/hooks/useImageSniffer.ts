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

// Helper function to detect if a request is likely an image
function isLikelyImage(request: NetworkRequest): boolean {
  // Check MIME type first
  if (request.mimeType.startsWith('image/')) {
    return true
  }

  // Check for octet-stream with image file extensions
  if (request.mimeType === 'application/octet-stream') {
    const url = request.url.toLowerCase()
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
    const hasImageExtension = imageExtensions.some((ext) => url.includes(ext))

    if (hasImageExtension) {
      console.log(`[AssetSieve] Detected octet-stream image: ${url}`)
    }

    return hasImageExtension
  }

  // Check for other generic MIME types that might contain images
  if (request.mimeType === 'application/binary' || request.mimeType === '') {
    const url = request.url.toLowerCase()
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
    const hasImageExtension = imageExtensions.some((ext) => url.includes(ext))

    if (hasImageExtension) {
      console.log(
        `[AssetSieve] Detected binary/unknown type image: ${url} (${request.mimeType})`
      )
    }

    return hasImageExtension
  }

  return false
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
        if (content && encoding === 'base64') {
          const img = new Image()

          const addImageData = (
            width: number | null,
            height: number | null,
            actualMimeType?: string
          ) => {
            const imageData: ImageData = {
              url: request.url,
              mimeType: actualMimeType || request.mimeType,
              size: request.size,
              width,
              height,
              base64: content,
            }

            setImages((prev) => {
              if (prev.some((img) => img.url === request.url)) {
                return prev
              }
              return [...prev, imageData]
            })
          }

          // For octet-stream or unknown types, try to detect the actual image format
          let dataSrc: string
          if (
            request.mimeType === 'application/octet-stream' ||
            request.mimeType === 'application/binary' ||
            request.mimeType === ''
          ) {
            // Try common image formats - start with the most likely based on file extension
            const url = request.url.toLowerCase()
            let detectedMimeType = 'image/jpeg' // default fallback

            if (url.includes('.png')) detectedMimeType = 'image/png'
            else if (url.includes('.gif')) detectedMimeType = 'image/gif'
            else if (url.includes('.webp')) detectedMimeType = 'image/webp'
            else if (url.includes('.svg')) detectedMimeType = 'image/svg+xml'
            else if (url.includes('.bmp')) detectedMimeType = 'image/bmp'

            dataSrc = `data:${detectedMimeType};base64,${content}`

            img.onload = () =>
              addImageData(img.width, img.height, detectedMimeType)
            img.onerror = () => {
              // If the guessed MIME type fails, try generic image/jpeg
              if (detectedMimeType !== 'image/jpeg') {
                const fallbackImg = new Image()
                fallbackImg.onload = () =>
                  addImageData(
                    fallbackImg.width,
                    fallbackImg.height,
                    'image/jpeg'
                  )
                fallbackImg.onerror = () =>
                  addImageData(null, null, request.mimeType)
                fallbackImg.src = `data:image/jpeg;base64,${content}`
              } else {
                addImageData(null, null, request.mimeType)
              }
            }
          } else {
            dataSrc = `data:${request.mimeType};base64,${content}`
            img.onload = () => addImageData(img.width, img.height)
            img.onerror = () => addImageData(null, null)
          }

          img.src = dataSrc
        } else {
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
