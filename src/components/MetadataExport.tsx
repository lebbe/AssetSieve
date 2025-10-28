import { InputContainer } from './InputContainer'

import './MetadataExport.css'

type Props = {
  pdfTitle: string
  filename: string
  author: string
  creator: string
  setters: {
    setPdfTitle: (title: string) => void
    setFilename: (filename: string) => void
    setAuthor: (author: string) => void
    setCreator: (creator: string) => void
  }
}

export function MetadataExport({
  pdfTitle,
  filename,
  author,
  creator,
  setters,
}: Props) {
  const { setPdfTitle, setFilename, setAuthor, setCreator } = setters
  return (
    <div className="export-metadata">
      <InputContainer label="PDF Title">
        <input
          className="input"
          type="text"
          value={pdfTitle}
          onChange={(e) => setPdfTitle(e.target.value)}
          placeholder="FlippingBook Export"
          title="Title that will be embedded in the PDF metadata"
        />
      </InputContainer>

      <InputContainer label="Creator">
        <input
          className="input"
          type="text"
          value={creator}
          onChange={(e) => setCreator(e.target.value)}
          placeholder="Your name (optional)"
          title="Creator name that will be embedded in the PDF metadata"
        />
      </InputContainer>

      <InputContainer label="Author">
        <input
          className="input"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Your name (optional)"
          title="Author name that will be embedded in the PDF metadata"
        />
      </InputContainer>

      <InputContainer label="Filename">
        <input
          className="input"
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="flippingbook.pdf"
          title="Name of the downloaded PDF file (extension will be added automatically)"
        />
      </InputContainer>
    </div>
  )
}
