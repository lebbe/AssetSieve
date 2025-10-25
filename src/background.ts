chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchAsDataURL') {
    fetch(request.url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        return response.blob()
      })
      .then((blob) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          sendResponse(reader.result) // Sends the base64 Data URL
        }
        reader.onerror = () => {
          sendResponse(null)
        }
        reader.readAsDataURL(blob)
      })
      .catch((error) => {
        console.error('Failed to fetch resource:', error)
        sendResponse(null)
      })

    return true // Required for asynchronous sendResponse
  }
})
