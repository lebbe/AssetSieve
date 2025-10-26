#!/usr/bin/env node

/**
 * Create PDF from WebP + SVG files utility script
 *
 * Dependencies required: npm install jspdf canvas
 *
 * Usage:
 *   node createPDFFromwebpAndSvg.js [folder-path]
 *
 * If no folder path is provided, the script will prompt for one.
 * The script finds WebP files (e.g., page0015_3.webp) and overlays corresponding
 * SVG files (e.g., 0015.svg) to create a combined PDF.
 *
 * Features:
 * - Automatic WebP and SVG discovery with smart pairing
 * - SVG overlay on WebP background (SVG is optional)
 * - Smart scaling with aspect ratio preservation
 * - High-quality 2x pixel density rendering
 * - Interactive metadata input (title, filename, author, creator)
 * - Progress feedback and file statistics
 */

const fs = require('fs').promises
const path = require('path')
const readline = require('readline')

// Import jsPDF for Node.js (requires canvas for server-side rendering)
/** @type {typeof import('jspdf').jsPDF} */
let jsPDF
/** @type {typeof import('canvas').createCanvas} */
let createCanvas
/** @type {typeof import('canvas').loadImage} */
let loadImage

try {
  const { jsPDF: JsPDF } = require('jspdf')
  const { createCanvas: CreateCanvas, loadImage: LoadImage } = require('canvas')
  jsPDF = JsPDF
  createCanvas = CreateCanvas
  loadImage = LoadImage
} catch (error) {
  console.error('Required dependencies not found. Please install them:')
  console.error('npm install jspdf canvas')
  process.exit(1)
}

/**
 * Creates a readline interface for user input
 * @returns {import('readline').Interface}
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
}

/**
 * Prompts user for input with a question
 * @param {import('readline').Interface} rl - readline interface
 * @param {string} question - question to ask
 * @returns {Promise<string>}
 */
function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

/**
 * Gets folder path from command line args or prompts user
 * @returns {Promise<string>}
 */
async function getFolderPath() {
  const args = process.argv.slice(2)

  if (args.length > 0) {
    return path.resolve(args[0])
  }

  const rl = createReadlineInterface()
  try {
    const folderPath = await askQuestion(
      rl,
      'Enter the path to the folder containing WebP and SVG files: ',
    )
    return path.resolve(folderPath)
  } finally {
    rl.close()
  }
}

/**
 * Extracts page number from WebP filename (e.g., page0015_3.webp -> 0015)
 * @param {string} filename - WebP filename
 * @returns {string | null}
 */
function extractPageNumber(filename) {
  const match = filename.match(/page(\d+)_\d+\.webp$/i)
  return match ? match[1] : null
}

/**
 * Finds all WebP and SVG files in the specified folder
 * @param {string} folderPath - path to folder
 * @returns {Promise<{webpFiles: string[], svgFiles: Map<string, string>}>}
 */
async function findWebPAndSvgFiles(folderPath) {
  try {
    const files = await fs.readdir(folderPath)

    // Find all WebP files and sort them
    const webpFiles = files
      .filter((file) => /page\d+_\d+\.webp$/i.test(file))
      .sort()
      .map((file) => path.join(folderPath, file))

    // Find all SVG files and create a map by page number
    const svgFiles = new Map()
    files
      .filter((file) => /^\d+\.svg$/i.test(file))
      .forEach((file) => {
        const pageNum = file.replace('.svg', '')
        svgFiles.set(pageNum, path.join(folderPath, file))
      })

    return { webpFiles, svgFiles }
  } catch (error) {
    throw new Error(
      `Failed to read directory: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}

/**
 * Checks if file exists and is accessible
 * @param {string} filePath - path to file
 * @returns {Promise<boolean>}
 */
async function checkFileExists(filePath) {
  try {
    await fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Loads image and returns both the image object and its dimensions
 * @param {string} imagePath - path to image file
 * @returns {Promise<{image: import('canvas').Image, width: number, height: number}>}
 */
async function loadImageWithDimensions(imagePath) {
  try {
    const exists = await checkFileExists(imagePath)
    if (!exists) {
      throw new Error(`File not accessible: ${imagePath}`)
    }

    // Try loading image directly first
    try {
      const image = await loadImage(imagePath)
      return {
        image,
        width: image.width,
        height: image.height,
      }
    } catch (directError) {
      // Try reading file as buffer and loading from buffer (works better with Unicode paths)
      try {
        const imageBuffer = await fs.readFile(imagePath)
        const image = await loadImage(imageBuffer)
        return {
          image,
          width: image.width,
          height: image.height,
        }
      } catch (bufferError) {
        throw new Error(
          `Failed to load image ${imagePath}: Both direct and buffer methods failed`,
        )
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to load image ${imagePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}

/**
 * Calculates PDF page dimensions with proper scaling
 * @param {number} originalWidth - original image width
 * @param {number} originalHeight - original image height
 * @returns {{pdfWidth: number, pdfHeight: number, scale: number}}
 */
function calculatePdfDimensions(originalWidth, originalHeight) {
  // Calculate PDF page dimensions (fit within A4 landscape: 297x210mm = ~842x595 points at 72 DPI)
  const maxPdfWidth = 800 // points
  const maxPdfHeight = 600 // points

  // Calculate scaling to fit within max dimensions while maintaining aspect ratio
  const scaleX = maxPdfWidth / originalWidth
  const scaleY = maxPdfHeight / originalHeight
  const scale = Math.min(scaleX, scaleY)

  // Final PDF dimensions
  const pdfWidth = originalWidth * scale
  const pdfHeight = originalHeight * scale

  return {
    pdfWidth,
    pdfHeight,
    scale,
  }
}

/**
 * Adds a combined WebP+SVG page to the PDF
 * @param {import('jspdf').jsPDF} pdf - jsPDF instance
 * @param {string} webpPath - path to WebP file
 * @param {string | null} svgPath - path to SVG file (optional)
 * @param {boolean} isFirstPage - whether this is the first page
 * @returns {Promise<void>}
 */
async function addCombinedPage(pdf, webpPath, svgPath, isFirstPage = false) {
  try {
    // Load WebP image and get dimensions
    console.log(`Loading WebP: ${path.basename(webpPath)}`)
    const {
      image: webpImage,
      width: originalWidth,
      height: originalHeight,
    } = await loadImageWithDimensions(webpPath)

    // Calculate PDF dimensions
    const { pdfWidth, pdfHeight } = calculatePdfDimensions(
      originalWidth,
      originalHeight,
    )

    // Add new page (except for the first page)
    if (!isFirstPage) {
      pdf.addPage([pdfWidth, pdfHeight])
    } else {
      // For first page, delete default and create properly sized page
      pdf.deletePage(1)
      pdf.addPage([pdfWidth, pdfHeight])
    }

    // High-resolution canvas for better quality (2x pixel density)
    const canvasScale = 2
    const canvasWidth = originalWidth * canvasScale
    const canvasHeight = originalHeight * canvasScale

    // Create high-resolution canvas
    const canvas = createCanvas(canvasWidth, canvasHeight)
    const ctx = canvas.getContext('2d')

    // Scale context for high-resolution rendering
    ctx.scale(canvasScale, canvasScale)

    // Draw white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, originalWidth, originalHeight)

    // Draw WebP background
    ctx.drawImage(webpImage, 0, 0, originalWidth, originalHeight)

    // Draw SVG overlay if present
    if (svgPath) {
      try {
        console.log(`  + Overlaying SVG: ${path.basename(svgPath)}`)
        const { image: svgImage } = await loadImageWithDimensions(svgPath)
        ctx.drawImage(svgImage, 0, 0, originalWidth, originalHeight)
      } catch (svgError) {
        console.warn(
          `  ⚠ Failed to load SVG overlay, proceeding with WebP-only:`,
          svgError instanceof Error ? svgError.message : String(svgError),
        )
      }
    }

    // Convert canvas to JPEG for better compression
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight)

    console.log(
      `Added: ${path.basename(webpPath)}${
        svgPath ? ' + ' + path.basename(svgPath) : ''
      } (${originalWidth}x${originalHeight} -> ${Math.round(
        pdfWidth,
      )}x${Math.round(pdfHeight)} pts)`,
    )
  } catch (error) {
    console.error(
      `Failed to add ${path.basename(webpPath)}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    throw error
  }
}

/**
 * Gets PDF metadata from user input
 * @param {string} defaultFilename - default filename for PDF
 * @returns {Promise<{title: string, filename: string, author: string, creator: string}>}
 */
async function getPdfMetadata(defaultFilename) {
  const rl = createReadlineInterface()

  try {
    console.log('\n--- PDF Metadata ---')

    const title =
      (await askQuestion(rl, 'PDF Title (default: WebP+SVG Collection): ')) ||
      'WebP+SVG Collection'

    const filename =
      (await askQuestion(rl, `PDF Filename (default: ${defaultFilename}): `)) ||
      defaultFilename
    const finalFilename = filename.endsWith('.pdf')
      ? filename
      : `${filename}.pdf`

    const author =
      (await askQuestion(rl, 'Author (optional): ')) || 'AssetSieve User'

    const creator =
      (await askQuestion(
        rl,
        'Creator (default: AssetSieve WebP+SVG to PDF): ',
      )) || 'AssetSieve WebP+SVG to PDF'

    return {
      title,
      filename: finalFilename,
      author,
      creator,
    }
  } finally {
    rl.close()
  }
}

/**
 * Main function
 * @returns {Promise<void>}
 */
async function main() {
  try {
    console.log('🔄 WebP + SVG to PDF Converter')
    console.log('==============================\n')

    // Get folder path
    const folderPath = await getFolderPath()
    console.log(`📁 Scanning folder: ${folderPath}`)

    // Check if folder exists
    try {
      await fs.access(folderPath)
    } catch {
      throw new Error(`Folder does not exist: ${folderPath}`)
    }

    // Find WebP and SVG files
    const { webpFiles, svgFiles } = await findWebPAndSvgFiles(folderPath)

    if (webpFiles.length === 0) {
      throw new Error('No WebP files found in the specified folder')
    }

    console.log(`📸 Found ${webpFiles.length} WebP file(s)`)
    console.log(`🎨 Found ${svgFiles.size} SVG file(s)`)

    // Show file pairings
    console.log('\nFile pairings:')
    webpFiles.forEach((webpFile, index) => {
      const pageNum = extractPageNumber(path.basename(webpFile))
      const svgFile = pageNum ? svgFiles.get(pageNum) : null
      const svgStatus = svgFile ? `✓ ${path.basename(svgFile)}` : '✗ no SVG'
      console.log(`  ${index + 1}. ${path.basename(webpFile)} + ${svgStatus}`)
    })

    // Get PDF metadata
    const defaultFilename = `${path.basename(folderPath)}_combined.pdf`
    const metadata = await getPdfMetadata(defaultFilename)

    console.log('\n🔄 Creating PDF...\n')

    // Create PDF
    const pdf = new jsPDF()

    // Process each WebP file with its corresponding SVG
    for (let i = 0; i < webpFiles.length; i++) {
      const webpFile = webpFiles[i]
      const pageNum = extractPageNumber(path.basename(webpFile))
      const svgFile = pageNum ? svgFiles.get(pageNum) || null : null

      await addCombinedPage(pdf, webpFile, svgFile, i === 0)
      console.log(`Progress: ${i + 1}/${webpFiles.length}\n`)

      // Force garbage collection every 50 images to manage memory
      if ((i + 1) % 50 === 0) {
        if (global.gc) {
          console.log(
            `🧹 Running garbage collection after ${i + 1} images...\n`,
          )
          global.gc()
        }
      }
    }

    // Remove any extra pages if needed
    const expectedPages = webpFiles.length
    while (pdf.getNumberOfPages() > expectedPages) {
      pdf.deletePage(pdf.getNumberOfPages())
    }

    // Set PDF metadata
    pdf.setProperties({
      title: metadata.title,
      author: metadata.author,
      creator: metadata.creator,
      subject: `PDF created from ${webpFiles.length} WebP+SVG pairs`,
    })

    // Save PDF
    const outputPath = path.join(folderPath, metadata.filename)
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    await fs.writeFile(outputPath, pdfBuffer)

    console.log('✅ PDF created successfully!')
    console.log(`📄 File: ${outputPath}`)
    console.log(`📊 Pages: ${webpFiles.length}`)
    console.log(
      `📏 Size: ${Math.round(pdfBuffer.length / 1024)} KB (${(
        pdfBuffer.length /
        (1024 * 1024)
      ).toFixed(2)} MB)`,
    )
  } catch (error) {
    console.error(
      '\n❌ Error:',
      error instanceof Error ? error.message : String(error),
    )
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}
