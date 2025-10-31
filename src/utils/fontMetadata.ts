/**
 * Interface for the extracted font metadata.
 * 'name' is the only required field, used as a display fallback.
 */
export interface FontData {
  name: string
  signature?: string
  copyright?: string
  fontFamily?: string
  fontSubfamily?: string
  uniqueID?: string
  fullName?: string
  version?: string
  postscriptName?: string
  trademark?: string
  manufacturer?: string
  designer?: string
  description?: string
  vendorURL?: string
  designerURL?: string
  license?: string
  licenseURL?: string
  preferredFamily?: string
  preferredSubfamily?: string
  compatibleFullName?: string
  sampleText?: string
  weightClass?: number
  widthClass?: number
  familyType?: string
  panose?: {
    familyKind: number
    serifStyle: string
    weight: string
    proportion: string
    contrast: string
    raw: number[]
  }
  classification?: string
  xHeight?: number
  capHeight?: number
  // File format information
  format?: string // File format (WOFF2, WOFF, TTF, OTF, EOT) derived from mimeType
  // CSS-derived metadata
  cssUsage?: {
    fontFamilyDeclarations: string[] // All font-family names found in CSS
    fontWeights: string[] // Detected font-weights
    fontStyles: string[] // Detected font-styles (normal, italic, oblique)
    unicodeRanges: string[] // Unicode ranges specified in CSS
    usedInSelectors: string[] // CSS selectors where this font is used
  }
  // Request metadata
  referer?: string
  fontService?: string // Detected service (e.g., "Google Fonts", "Adobe Fonts")
  // Runtime-detected characteristics
  isMonospaceDetected?: boolean // Detected via Canvas measurement
  actualMetrics?: {
    avgCharWidth: number
    hasVariableWidth: boolean
  }
}

/**
 * Parses a font file's ArrayBuffer to extract metadata without dependencies.
 * Handles TTF, OTF (CFF), and WOFF2 formats.
 * WOFF (zlib) is not supported as it requires a decompression library.
 *
 * @param {ArrayBuffer} arrayBuffer The raw content of the font file.
 * @param {string} filename The original filename, used as a fallback for the name.
 * @returns {Promise<FontData>} A promise that resolves to an object containing the font's metadata.
 */
export async function collectFontData(
  arrayBuffer: ArrayBuffer,
  filename: string,
): Promise<FontData> {
  const fallbackData: FontData = { name: filename }

  if (!arrayBuffer || arrayBuffer.byteLength < 4) {
    console.error('Invalid font file buffer.')
    return fallbackData
  }

  const dataView = new DataView(arrayBuffer)
  const magic = dataView.getUint32(0)

  try {
    let parsedData: Partial<FontData> = {}

    // Check for WOFF2
    if (magic === 0x774f4632) {
      // 'wOF2'
      parsedData = await parseWOFF2(arrayBuffer)
    }
    // Check for WOFF
    else if (magic === 0x774f4646) {
      // 'wOFF'
      console.warn(
        'WOFF format is not supported due to zlib decompression requirement.',
      )
      parsedData = { signature: 'WOFF (unsupported)' }
    }
    // Check for TTF/OTF
    else if (magic === 0x00010000 || magic === 0x4f54544f) {
      // 0x00010000 (TTF) or 'OTTO' (OTF)
      parsedData = parseTTF(dataView)
    }
    // Unknown format
    else {
      console.error('Unknown or unsupported font format.')
      return fallbackData
    }

    // Ensure the 'name' field is populated, falling back to filename
    const name = parsedData.fontFamily || parsedData.fullName || filename
    return { ...fallbackData, ...parsedData, name }
  } catch (error) {
    console.error('Error parsing font data:', error)
    // Fallback to filename if any parsing error occurs
    return fallbackData
  }
}

// --- TTF/OTF Parser ---

/**
 * Parses a TrueType (TTF) or OpenType (OTF) font.
 * @param {DataView} dataView - The DataView for the font file.
 * @returns {Partial<FontData>} - The extracted metadata.
 */
function parseTTF(dataView: DataView): Partial<FontData> {
  const metadata: Partial<FontData> = { signature: 'TTF/OTF' }
  const numTables = dataView.getUint16(4)
  const tableDirectory: Record<string, { offset: number; length: number }> = {}

  // Read the table directory
  for (let i = 0; i < numTables; i++) {
    const entryOffset = 12 + i * 16
    const tag = getString(dataView, entryOffset, 4)
    const offset = dataView.getUint32(entryOffset + 8)
    const length = dataView.getUint32(entryOffset + 12)
    tableDirectory[tag] = { offset, length }
  }

  // Parse 'name' table for text metadata
  if (tableDirectory['name']) {
    Object.assign(
      metadata,
      parseNameTable(dataView, tableDirectory['name'].offset),
    )
  }

  // Parse 'OS/2' table for classification and metrics
  if (tableDirectory['OS/2']) {
    Object.assign(
      metadata,
      parseOS2Table(dataView, tableDirectory['OS/2'].offset),
    )
  }

  return metadata
}

// --- WOFF2 Parser ---

/**
 * Parses a WOFF2 font file.
 * @param {ArrayBuffer} arrayBuffer - The raw buffer for the WOFF2 file.
 * @returns {Promise<Partial<FontData>>} - A promise resolving to the extracted metadata.
 */
async function parseWOFF2(
  arrayBuffer: ArrayBuffer,
): Promise<Partial<FontData>> {
  const dataView = new DataView(arrayBuffer)
  const metadata: Partial<FontData> = { signature: 'WOFF2' }

  const compressedLength = dataView.getUint32(16)
  // WOFF2 header size. We read table directory from offset 48.
  const numTables = dataView.getUint16(12)
  let entryOffset = 48

  // WOFF2 directory is variable-length, find compressed data offset
  for (let i = 0; i < numTables; i++) {
    const flags = dataView.getUint8(entryOffset)
    entryOffset += 1
    // Read tag but don't use it
    if ((flags & 0x3f) === 0x3f) {
      entryOffset += 4
    }

    // Read transformed length
    const transformLengthResult = readVarUint(dataView, entryOffset)
    entryOffset = transformLengthResult.nextOffset

    // Read original length
    const decompressedLengthResult = readVarUint(dataView, entryOffset)
    entryOffset = decompressedLengthResult.nextOffset
  }

  // The compressed data starts after the directory
  const compressedDataOffset = entryOffset

  // Find the compressed data blob
  const compressedBlob = new Blob([
    arrayBuffer.slice(
      compressedDataOffset,
      compressedDataOffset + compressedLength,
    ),
  ])
  const decompressStream = new DecompressionStream(
    'deflate-raw' as CompressionFormat,
  )
  try {
    const decompressedStream = compressedBlob
      .stream()
      .pipeThrough(decompressStream)
    const decompressedBuffer = await new Response(
      decompressedStream,
    ).arrayBuffer()
    const decompressedView = new DataView(decompressedBuffer)

    // The decompressed data is a reconstructed TTF file.
    // We can parse it directly.
    return { ...metadata, ...parseTTF(decompressedView) }
  } catch (error) {
    console.error('WOFF2 decompression failed:', error)
    return metadata
  }
}

// --- Table Parsers ---

/**
 * Parses the 'name' table to extract strings like family, designer, etc.
 * @param {DataView} dataView - The DataView for the font.
 * @param {number} tableOffset - The byte offset of the 'name' table.
 * @returns {Partial<FontData>} - An object with key-value pairs of metadata.
 */
function parseNameTable(
  dataView: DataView,
  tableOffset: number,
): Partial<FontData> {
  const metadata: Partial<FontData> = {}
  const count = dataView.getUint16(tableOffset + 2)
  const stringOffset = dataView.getUint16(tableOffset + 4) + tableOffset
  const nameRecordsOffset = tableOffset + 6

  for (let i = 0; i < count; i++) {
    const recordOffset = nameRecordsOffset + i * 12
    const platformID = dataView.getUint16(recordOffset)
    const encodingID = dataView.getUint16(recordOffset + 2)
    // const languageID = dataView.getUint16(recordOffset + 4);
    const nameID = dataView.getUint16(recordOffset + 6)
    const length = dataView.getUint16(recordOffset + 8)
    const offset = dataView.getUint16(recordOffset + 10) + stringOffset

    // We only care about name IDs we recognize
    const nameKey = NAME_ID_MAP[nameID] as keyof FontData | undefined
    if (!nameKey) continue

    // Prefer Windows platform, Unicode BMP encoding
    // This is a simplification; robust parsing is much more complex.
    if (platformID === 3 && encodingID === 1) {
      // Windows, Unicode BMP
      ;(metadata as any)[nameKey] = decodeUtf16BE(dataView, offset, length)
    } else if (platformID === 1 && encodingID === 0) {
      // Macintosh, Roman
      ;(metadata as any)[nameKey] = decodeMacRoman(dataView, offset, length)
    } else if (!(metadata as any)[nameKey]) {
      // Fallback
      ;(metadata as any)[nameKey] = decodeUtf16BE(dataView, offset, length)
    }
  }
  return metadata
}

/**
 * Parses the 'OS/2' table for classification and metrics.
 * @param {DataView} dataView - The DataView for the font.
 * @param {number} tableOffset - The byte offset of the 'OS/2' table.
 * @returns {Partial<FontData>} - An object with key-value pairs of metadata.
 */
function parseOS2Table(
  dataView: DataView,
  tableOffset: number,
): Partial<FontData> {
  const metadata: Partial<FontData> = {}
  const version = dataView.getUint16(tableOffset)

  metadata.weightClass = dataView.getUint16(tableOffset + 4)
  metadata.widthClass = dataView.getUint16(tableOffset + 6)

  const familyClass = dataView.getInt16(tableOffset + 30)
  // const familySubclass = familyClass & 0xFF;
  const familyType = (familyClass >> 8) & 0xff

  metadata.familyType =
    (OS2_FAMILY_CLASS as Record<number, string>)[familyType] || 'Unknown'

  const panose: number[] = []
  for (let i = 0; i < 10; i++) {
    panose.push(dataView.getUint8(tableOffset + 32 + i))
  }

  metadata.panose = {
    familyKind: panose[0] ?? 0,
    serifStyle:
      (PANOSE_SERIF_STYLE as Record<number, string>)[panose[1] ?? 0] || 'Any',
    weight: (PANOSE_WEIGHT as Record<number, string>)[panose[2] ?? 0] || 'Any',
    proportion:
      (PANOSE_PROPORTION as Record<number, string>)[panose[3] ?? 0] || 'Any',
    contrast:
      (PANOSE_CONTRAST as Record<number, string>)[panose[4] ?? 0] || 'Any',
    raw: panose,
  }

  // Classify based on Panose
  if (panose[3] === 9) {
    metadata.classification = 'Monospace'
  } else if (familyType === 1) {
    // Oldstyle Serifs
    metadata.classification = 'Serif'
  } else if (familyType === 2) {
    // Transitional Serifs
    metadata.classification = 'Serif'
  } else if (familyType === 3) {
    // Modern Serifs
    metadata.classification = 'Serif'
  } else if (familyType === 4) {
    // Clarendon Serifs
    metadata.classification = 'Serif (Slab)'
  } else if (familyType === 5) {
    // Slab Serifs
    metadata.classification = 'Serif (Slab)'
  } else if (familyType === 7) {
    // Freeform Serifs
    metadata.classification = 'Serif'
  } else if (familyType === 8) {
    // Sans Serif
    metadata.classification = 'Sans-serif'
  } else if (familyType === 10) {
    // Scripts
    metadata.classification = 'Script'
  } else if (familyType === 12) {
    // Decorative
    metadata.classification = 'Decorative'
  } else {
    metadata.classification = 'Unknown'
  }

  if (version >= 2) {
    metadata.xHeight = dataView.getInt16(tableOffset + 86)
    metadata.capHeight = dataView.getInt16(tableOffset + 88)
  }

  return metadata
}

// --- Helpers & Constants ---

/**
 * Reads a string tag from a DataView.
 * @param {DataView} dataView - The DataView to read from.
 * @param {number} offset - The byte offset to start reading.
 * @param {number} length - The byte length of the string.
 * @returns {string} - The 4-character string.
 */
function getString(dataView: DataView, offset: number, length: number): string {
  let str = ''
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(dataView.getUint8(offset + i))
  }
  return str
}

/**
 * Decodes a UTF-16BE string from a DataView.
 * @param {DataView} dataView - The DataView to read from.
 * @param {number} offset - The byte offset of the string.
 * @param {number} length - The byte length of the string.
 * @returns {string} - The decoded string.
 */
function decodeUtf16BE(
  dataView: DataView,
  offset: number,
  length: number,
): string {
  const buffer = new Uint8Array(dataView.buffer, offset, length)
  const decoder = new TextDecoder('utf-16be')
  return decoder.decode(buffer)
}

/**
 * Decodes a MacRoman string from a DataView.
 * @param {DataView} dataView - The DataView to read from.
 * @param {number} offset - The byte offset of the string.
 * @param {number} length - The byte length of the string.
 * @returns {string} - The decoded string.
 */
function decodeMacRoman(
  dataView: DataView,
  offset: number,
  length: number,
): string {
  // TextDecoder 'macroman' is not universally supported.
  // This is a minimal fallback.
  try {
    const buffer = new Uint8Array(dataView.buffer, offset, length)
    const decoder = new TextDecoder('macroman')
    return decoder.decode(buffer)
  } catch (e) {
    // Fallback to simple ASCII-like decoding
    let str = ''
    for (let i = 0; i < length; i++) {
      str += String.fromCharCode(dataView.getUint8(offset + i))
    }
    return str
  }
}

/**
 * Reads a variable-length WOFF2 uint (255UInt16).
 * @param {DataView} dataView - The DataView to read from.
 * @param {number} offset - The byte offset to start reading.
 * @returns {{value: number, nextOffset: number}}
 */
function readVarUint(
  dataView: DataView,
  offset: number,
): { value: number; nextOffset: number } {
  let val = 0
  let b = dataView.getUint8(offset++)
  if (b === 255) {
    val = dataView.getUint16(offset)
    offset += 2
  } else if (b === 254) {
    val = dataView.getUint32(offset)
    offset += 4
  } else if (b === 253) {
    val = dataView.getUint16(offset)
    offset += 2
  } else {
    val = b
  }
  return { value: val, nextOffset: offset }
}

const NAME_ID_MAP: Record<number, string> = {
  0: 'copyright',
  1: 'fontFamily',
  2: 'fontSubfamily',
  3: 'uniqueID',
  4: 'fullName',
  5: 'version',
  6: 'postscriptName',
  7: 'trademark',
  8: 'manufacturer',
  9: 'designer',
  10: 'description',
  11: 'vendorURL',
  12: 'designerURL',
  13: 'license',
  14: 'licenseURL',
  16: 'preferredFamily',
  17: 'preferredSubfamily',
  18: 'compatibleFullName',
  19: 'sampleText',
}

const OS2_FAMILY_CLASS: Record<number, string> = {
  0: 'No Classification',
  1: 'Oldstyle Serifs',
  2: 'Transitional Serifs',
  3: 'Modern Serifs',
  4: 'Clarendon Serifs',
  5: 'Slab Serifs',
  7: 'Freeform Serifs',
  8: 'Sans Serif',
  9: 'Ornamentals',
  10: 'Scripts',
  12: 'Symbolic',
}

const PANOSE_SERIF_STYLE: Record<number, string> = {
  0: 'Any',
  1: 'No Fit',
  2: 'Cove',
  3: 'Obtuse Cove',
  4: 'Square Cove',
  5: 'Obtuse Square Cove',
  6: 'Square',
  7: 'Thin',
  8: 'Bone',
  9: 'Exaggerated',
  10: 'Triangle',
  11: 'Normal Sans',
  12: 'Obtuse Sans',
  13: 'Perp Sans',
  14: 'Flared',
  15: 'Rounded',
}

const PANOSE_WEIGHT: Record<number, string> = {
  0: 'Any',
  1: 'No Fit',
  2: 'Very Light',
  3: 'Light',
  4: 'Thin',
  5: 'Book',
  6: 'Medium',
  7: 'Demi',
  8: 'Bold',
  9: 'Heavy',
  10: 'Black',
  11: 'Extra Black',
}

const PANOSE_PROPORTION: Record<number, string> = {
  0: 'Any',
  1: 'No Fit',
  2: 'Old Style',
  3: 'Modern',
  4: 'Even Width',
  5: 'Expanded',
  6: 'Condensed',
  7: 'Very Expanded',
  8: 'Very Condensed',
  9: 'Monospaced',
}

const PANOSE_CONTRAST: Record<number, string> = {
  0: 'Any',
  1: 'No Fit',
  2: 'None',
  3: 'Very Low',
  4: 'Low',
  5: 'Medium Low',
  6: 'Medium',
  7: 'Medium High',
  8: 'High',
  9: 'Very High',
}
