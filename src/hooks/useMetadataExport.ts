import { useState } from 'react'

export function useMetadataExport() {
  const [pdfTitle, setPdfTitle] = useState('FlippingBook Export')
  const [filename, setFilename] = useState('flippingbook.pdf')
  const [author, setAuthor] = useState('')
  const [creator, setCreator] = useState('')

  return {
    pdfTitle,
    filename,
    author,
    creator,
    setters: {
      setPdfTitle,
      setFilename,
      setAuthor,
      setCreator,
    },
  }
}
