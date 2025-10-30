import { useEffect, useState } from 'react'
import { NetworkRequest } from './useRequestSniffing'
import { collectFontData, FontData } from '../utils/fontMetadata'

export interface FontFileData {
  url: string
  mimeType: string
  size: number
  filename: string
  base64: string
  metadata: FontData
}

const fontExtensions = [
  '.ttf',
  '.otf',
  '.woff',
  '.woff2',
  '.eot',
]

const fontMimeTypes = [
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'application/font-woff',
  'application/font-woff2',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/x-font-woff',
  'application/vnd.ms-fontobject',
]

// Helper function to detect if a request is likely a font
function isLikelyFont(request: NetworkRequest): boolean {
  // Check MIME type first
  if (fontMimeTypes.some(type => request.mimeType.includes(type))) {
    return true
  }

  if (
    request.mimeType === 'application/octet-stream' ||
    request.mimeType === 'application/binary' ||
    request.mimeType === ''
  ) {
    const url = request.url.toLowerCase()
    const hasFontExtension = fontExtensions.some((ext) => url.includes(ext))
    return hasFontExtension
  }

  return false
}

function detectMimeType(url: string) {
  const urlLower = url.toLowerCase()
  if (urlLower.includes('.woff2')) return 'font/woff2'
  else if (urlLower.includes('.woff')) return 'font/woff'
  else if (urlLower.includes('.ttf')) return 'font/ttf'
  else if (urlLower.includes('.otf')) return 'font/otf'
  else if (urlLower.includes('.eot')) return 'application/vnd.ms-fontobject'
  return 'font/ttf'
}

function getFilenameFromUrl(url: string): string {
  return url.split('/').pop() || 'font'
}

export function useFontSniffer(requests: NetworkRequest[]) {
  const [fonts, setFonts] = useState<FontFileData[]>([])

  // Effect to sync fonts with requests (cleanup removed fonts)
  useEffect(() => {
    if (requests.length === 0) {
      setFonts([])
      return
    }

    const fontRequestUrls = new Set(
      requests
        .filter((request) => isLikelyFont(request))
        .map((request) => request.url),
    )

    setFonts((prev) => prev.filter((font) => fontRequestUrls.has(font.url)))
  }, [requests])

  // Effect to process new font requests
  useEffect(() => {
    if (requests.length === 0) return

    const fontRequests = requests.filter(
      (request) => isLikelyFont(request) && request.chromeRequest,
    )

    const newFontRequests = fontRequests.filter(
      (request) => !fonts.some((font) => font.url === request.url),
    )

    if (newFontRequests.length === 0) return

    newFontRequests.forEach((request) => {
      if (!request.chromeRequest) return

      request.chromeRequest.getContent((content, encoding) => {
        const addFontData = async (
          base64Content: string,
          actualMimeType?: string,
        ) => {
          try {
            // Decode base64 to ArrayBuffer for font parsing
            const binaryString = atob(base64Content)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            const arrayBuffer = bytes.buffer

            const filename = getFilenameFromUrl(request.url)
            const metadata = await collectFontData(arrayBuffer, filename)

            const fontData: FontFileData = {
              url: request.url,
              mimeType: actualMimeType || request.mimeType,
              size: request.size,
              filename,
              base64: base64Content,
              metadata,
            }

            setFonts((prev) => {
              if (prev.some((font) => font.url === request.url)) {
                return prev
              }
              return [...prev, fontData]
            })
          } catch (error) {
            console.error(`Failed to parse font ${request.url}:`, error)
          }
        }

        if (content && encoding === 'base64') {
          const actualMimeType =
            request.mimeType === 'application/octet-stream' ||
            request.mimeType === 'application/binary' ||
            request.mimeType === ''
              ? detectMimeType(request.url)
              : request.mimeType

          addFontData(content, actualMimeType)
        } else if (
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
                const base64Content = dataUrl.includes('base64,')
                  ? dataUrl.split('base64,')[1]
                  : dataUrl
                addFontData(base64Content, detectedMimeType)
              } else {
                console.error(
                  'Failed to retrieve font content from background script.',
                )
              }
            },
          )
        }
      })
    })
  }, [requests, fonts])

  return { fonts }
}
