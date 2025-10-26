#!/usr/bin/env node

/**
 * Create PDF from PNG files utility script
 *
 * Dependencies required: npm install jspdf canvas
 *
 * Usage:
 *   node createPDFFromPNGs.js [folder-path]
 *
 * If no folder path is provided, the script will prompt for one.
 * The script finds all PNG files, sorts them by name, and creates a PDF.
 *
 * Features:
 * - Automatic PNG discovery and alphabetical sorting
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
      'Enter the path to the folder containing PNG files: '
    )
    return path.resolve(folderPath)
  } finally {
    rl.close()
  }
}

/**
 * Finds all PNG files in the specified folder
 * @param {string} folderPath - path to folder
 * @returns {Promise<string[]>}
 */
async function findPngFiles(folderPath) {
  try {
    const files = await fs.readdir(folderPath)
    const pngFiles = files
      .filter((file) => path.extname(file).toLowerCase() === '.png')
      .sort() // Sort alphabetically
      .map((file) => path.join(folderPath, file))

    return pngFiles
  } catch (error) {
    throw new Error(
      `Failed to read directory: ${
        error instanceof Error ? error.message : String(error)
      }`
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
 * This avoids loading the same image twice for dimensions and rendering
 * @param {string} imagePath - path to image file
 * @returns {Promise<{image: import('canvas').Image, width: number, height: number}>}
 */
async function loadImageWithDimensions(imagePath) {
  try {
    // Check if file exists first
    const exists = await checkFileExists(imagePath)
    if (!exists) {
      throw new Error(`File not accessible: ${imagePath}`)
    }

    console.log(`Loading image: ${imagePath}`)

    // Try loading image directly first
    try {
      const image = await loadImage(imagePath)
      return {
        image,
        width: image.width,
        height: image.height,
      }
    } catch (directError) {
      console.log(
        `Direct load failed: ${
          directError instanceof Error
            ? directError.message
            : String(directError)
        }`
      )

      // Try reading file as buffer and loading from buffer (works better with Unicode paths)
      try {
        const imageBuffer = await fs.readFile(imagePath)
        console.log(`Loaded buffer of size: ${imageBuffer.length} bytes`)
        const image = await loadImage(imageBuffer)
        return {
          image,
          width: image.width,
          height: image.height,
        }
      } catch (bufferError) {
        console.error(
          `Buffer load failed: ${
            bufferError instanceof Error
              ? bufferError.message
              : String(bufferError)
          }`
        )
        throw new Error(
          `Failed to load image ${imagePath}: Both direct and buffer methods failed`
        )
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to load image ${imagePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

/**
 * Calculates PDF page dimensions with proper scaling
 * Based on the logic from createNewPage.ts
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
 * Adds a PNG image to the PDF with proper scaling
 * Uses pre-loaded image to avoid loading the same file twice
 * @param {import('jspdf').jsPDF} pdf - jsPDF instance
 * @param {string} imagePath - path to image file
 * @param {boolean} isFirstPage - whether this is the first page
 * @returns {Promise<void>}
 */
async function addPngToPage(pdf, imagePath, isFirstPage = false) {
  try {
    // Load image and get dimensions in one operation
    const {
      image,
      width: originalWidth,
      height: originalHeight,
    } = await loadImageWithDimensions(imagePath)

    // Calculate PDF dimensions
    const { pdfWidth, pdfHeight } = calculatePdfDimensions(
      originalWidth,
      originalHeight
    )

    // Add new page (except for the first page)
    if (!isFirstPage) {
      pdf.addPage([pdfWidth, pdfHeight])
    } else {
      // For first page, we need to set the initial page size
      pdf.internal.pageSize.setWidth(pdfWidth)
      pdf.internal.pageSize.setHeight(pdfHeight)
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

    // Draw the pre-loaded image (no need to load again)
    ctx.drawImage(image, 0, 0, originalWidth, originalHeight)

    // Convert canvas to JPEG for better compression
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight)

    console.log(
      `Added: ${path.basename(
        imagePath
      )} (${originalWidth}x${originalHeight} -> ${Math.round(
        pdfWidth
      )}x${Math.round(pdfHeight)} pts)`
    )
  } catch (error) {
    console.error(
      `Failed to add ${imagePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
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
      (await askQuestion(rl, 'PDF Title (default: PNG Collection): ')) ||
      'PNG Collection'

    const filename =
      (await askQuestion(rl, `PDF Filename (default: ${defaultFilename}): `)) ||
      defaultFilename
    const finalFilename = filename.endsWith('.pdf')
      ? filename
      : `${filename}.pdf`

    const author =
      (await askQuestion(rl, 'Author (optional): ')) || 'AssetSieve User'

    const creator =
      (await askQuestion(rl, 'Creator (default: AssetSieve PNG to PDF): ')) ||
      'AssetSieve PNG to PDF'

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
    console.log('🔄 PNG to PDF Converter')
    console.log('========================\n')

    // Get folder path
    const folderPath = await getFolderPath()
    console.log(`📁 Scanning folder: ${folderPath}`)

    // Check if folder exists
    try {
      await fs.access(folderPath)
    } catch {
      throw new Error(`Folder does not exist: ${folderPath}`)
    }

    // Find PNG files
    const pngFiles = await findPngFiles(folderPath)

    if (pngFiles.length === 0) {
      throw new Error('No PNG files found in the specified folder')
    }

    console.log(`📸 Found ${pngFiles.length} PNG file(s):`)
    pngFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${path.basename(file)}`)
    })

    // Get PDF metadata
    const defaultFilename = `${path.basename(folderPath)}_collection.pdf`
    const metadata = await getPdfMetadata(defaultFilename)

    console.log('\n🔄 Creating PDF...')

    // Create PDF
    const pdf = new jsPDF()

    // Process each PNG file
    for (let i = 0; i < pngFiles.length; i++) {
      await addPngToPage(pdf, pngFiles[i], i === 0)
      console.log(
        `Added: ${path.basename(pngFiles[i])} (${i + 1}/${pngFiles.length})`
      )

      // Force garbage collection every 50 images to manage memory
      if ((i + 1) % 50 === 0) {
        if (global.gc) {
          console.log(`🧹 Running garbage collection after ${i + 1} images...`)
          global.gc()
        }
      }
    }

    // Remove the initial blank page that jsPDF creates automatically
    if (pdf.getNumberOfPages() > pngFiles.length) {
      pdf.deletePage(1)
    }

    // Set PDF metadata
    pdf.setProperties({
      title: metadata.title,
      author: metadata.author,
      creator: metadata.creator,
      subject: `PDF created from ${pngFiles.length} PNG files`,
    })

    // Save PDF
    const outputPath = path.join(folderPath, metadata.filename)
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    await fs.writeFile(outputPath, pdfBuffer)

    console.log('\n✅ PDF created successfully!')
    console.log(`📄 File: ${outputPath}`)
    console.log(`📊 Pages: ${pngFiles.length}`)
    console.log(`📏 Size: ${Math.round(pdfBuffer.length / 1024)} KB`)
  } catch (error) {
    console.error(
      '\n❌ Error:',
      error instanceof Error ? error.message : String(error)
    )
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}
