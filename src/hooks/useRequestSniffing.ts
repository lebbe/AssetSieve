import { useEffect, useState } from 'react'

export interface NetworkRequest {
  url: string
  method: string
  status: number
  mimeType: string
  size: number
  time: number
  chromeRequest?: chrome.devtools.network.Request
}

export interface ImageData {
  url: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  base64: string
}

export function useRequestSniffing() {
  const [requests, setRequests] = useState<NetworkRequest[]>([])
  const [isListening, setIsListening] = useState<boolean>(true)

  useEffect(() => {
    // Set up the network request listener
    const onRequestFinished = (request: chrome.devtools.network.Request) => {
      // Get the HAR entry for detailed information
      request.getContent((_content, _encoding) => {
        const newRequest: NetworkRequest = {
          url: request.request.url,
          method: request.request.method,
          status: request.response.status,
          mimeType: request.response.content.mimeType,
          size: request.response.content.size || 0,
          time: request.time,
          chromeRequest: request,
        }

        // Only add request if listening is enabled
        if (isListening) {
          setRequests((prev) => [...prev, newRequest])
        }
      })
    }

    // Add the listener for network requests
    chrome.devtools.network.onRequestFinished.addListener(onRequestFinished)

    // Cleanup function to remove the listener
    return () => {
      chrome.devtools.network.onRequestFinished.removeListener(
        onRequestFinished,
      )
    }
  }, [isListening])

  const toggleListening = () => {
    setIsListening((prev) => !prev)
  }

  const resetRequests = () => {
    setRequests([])
  }

  const removeRequest = (url: string) => {
    setRequests((prev) => prev.filter((request) => request.url !== url))
  }

  const reloadPage = () => {
    // Reset requests first
    setRequests([])
    // Reload the inspected page
    chrome.devtools.inspectedWindow.reload()
  }

  return {
    requests,
    isListening,
    toggleListening,
    resetRequests,
    removeRequest,
    reloadPage,
  }
}
