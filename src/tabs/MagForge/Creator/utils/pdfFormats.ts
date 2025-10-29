export const PDF_FORMATS = {
  'A4 Portrait': { width: 595, height: 842 },
  'A4 Landscape': { width: 842, height: 595 },
  'Letter Portrait': { width: 612, height: 792 },
  'Letter Landscape': { width: 792, height: 612 },
  Tabloid: { width: 792, height: 1224 },
  'US Legal': { width: 612, height: 1008 },
  'Slide 16:9': { width: 960, height: 540 },
  'Slide 4:3': { width: 800, height: 600 },
  Square: { width: 600, height: 600 },
} as const

export type FormatName = keyof typeof PDF_FORMATS

export function getFormatDimensions(formatName: FormatName) {
  return PDF_FORMATS[formatName]
}
