import jsPDF from 'jspdf'

/**
 * Metadata for PDF export
 */
export interface PDFMetadata {
  title: string
  author: string
  creator: string
}

/**
 * Sets PDF metadata properties with fallback values
 */
export function setPDFMetadata(
  pdf: jsPDF,
  metadata: PDFMetadata,
  defaultCreator: string,
): void {
  pdf.setProperties({
    title: metadata.title,
    author: metadata.author || 'AssetSieve User',
    creator: metadata.creator || defaultCreator,
  })
}

/**
 * Ensures filename has .pdf extension
 */
export function ensurePDFExtension(filename: string): string {
  return filename.endsWith('.pdf') ? filename : `${filename}.pdf`
}

/**
 * Saves PDF with proper filename and metadata
 */
export function savePDFWithMetadata(
  pdf: jsPDF,
  filename: string,
  metadata: PDFMetadata,
  defaultCreator: string,
): void {
  setPDFMetadata(pdf, metadata, defaultCreator)
  const finalFilename = ensurePDFExtension(filename)
  pdf.save(finalFilename)
}

/**
 * Handles PDF export errors consistently
 */
export function handlePDFExportError(error: unknown): void {
  console.error('PDF export failed:', error)
  alert(
    `PDF export failed: ${
      error instanceof Error ? error.message : 'Unknown error'
    }`,
  )
}
