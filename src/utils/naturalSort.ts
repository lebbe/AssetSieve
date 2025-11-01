// Natural sort comparison for strings with numeric parts
// Handles numeric prefixes/infixes correctly (e.g., "1-file" < "10-file")
export function naturalCompare(a: string, b: string): number {
  // Split strings into parts (numbers and non-numbers)
  const regex = /(\d+)|(\D+)/g
  const aParts = a.match(regex) || []
  const bParts = b.match(regex) || []

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || ''
    const bPart = bParts[i] || ''

    // Check if both parts are numeric
    const aIsNum = /^\d+$/.test(aPart)
    const bIsNum = /^\d+$/.test(bPart)

    if (aIsNum && bIsNum) {
      // Compare as numbers
      const diff = parseInt(aPart, 10) - parseInt(bPart, 10)
      if (diff !== 0) return diff
    } else {
      // Compare as strings
      const diff = aPart.localeCompare(bPart)
      if (diff !== 0) return diff
    }
  }

  return 0
}
