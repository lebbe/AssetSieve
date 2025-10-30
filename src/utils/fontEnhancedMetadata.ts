import { FontData } from './fontMetadata'

/**
 * Analyzes CSS stylesheets to find font-face rules and usage
 */
export function analyzeCSSForFont(
  fontUrl: string,
): Promise<FontData['cssUsage']> {
  return new Promise((resolve) => {
    const usage: FontData['cssUsage'] = {
      fontFamilyDeclarations: [],
      fontWeights: [],
      fontStyles: [],
      unicodeRanges: [],
      usedInSelectors: [],
    }

    try {
      // Access stylesheets from the inspected window
      chrome.devtools.inspectedWindow.eval(
        `
      (function() {
        const fontUrl = "${fontUrl}";
        const results = {
          fontFamilyDeclarations: [],
          fontWeights: [],
          fontStyles: [],
          unicodeRanges: [],
          usedInSelectors: []
        };
        
        // Analyze all stylesheets
        Array.from(document.styleSheets).forEach(sheet => {
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (!rules) return;
            
            Array.from(rules).forEach(rule => {
              // Check @font-face rules
              if (rule.type === CSSRule.FONT_FACE_RULE) {
                const fontFaceRule = rule;
                const src = fontFaceRule.style.getPropertyValue('src');
                
                // Check if this font-face references our font URL
                if (src && src.includes(fontUrl.split('?')[0])) {
                  const family = fontFaceRule.style.getPropertyValue('font-family');
                  if (family) {
                    results.fontFamilyDeclarations.push(family.replace(/['"]/g, ''));
                  }
                  
                  const weight = fontFaceRule.style.getPropertyValue('font-weight');
                  if (weight) {
                    results.fontWeights.push(weight);
                  }
                  
                  const style = fontFaceRule.style.getPropertyValue('font-style');
                  if (style) {
                    results.fontStyles.push(style);
                  }
                  
                  const unicodeRange = fontFaceRule.style.getPropertyValue('unicode-range');
                  if (unicodeRange) {
                    results.unicodeRanges.push(unicodeRange);
                  }
                }
              }
              
              // Check regular style rules for font usage
              if (rule.type === CSSRule.STYLE_RULE) {
                const styleRule = rule;
                const fontFamily = styleRule.style.getPropertyValue('font-family');
                
                if (fontFamily && results.fontFamilyDeclarations.some(name => 
                  fontFamily.includes(name)
                )) {
                  results.usedInSelectors.push(styleRule.selectorText);
                }
              }
            });
          } catch (e) {
            // Cross-origin stylesheet, skip
          }
        });
        
        return results;
      })();
    `,
        (result, isException) => {
          if (!isException && result && typeof result === 'object') {
            Object.assign(usage, result)
          }
          resolve(usage)
        },
      )
    } catch (error) {
      console.warn('Failed to analyze CSS for font:', error)
      resolve(usage)
    }
  })
}

/**
 * Detects if a font is monospace by measuring character widths
 */
export function detectMonospace(
  base64: string,
  mimeType: string,
): Promise<{
  isMonospace: boolean
  avgCharWidth: number
  hasVariableWidth: boolean
}> {
  return new Promise((resolve) => {
    try {
      // Create a temporary style element
      const style = document.createElement('style')
      style.textContent = `
        @font-face {
          font-family: 'MonospaceTest-${Date.now()}';
          src: url(data:${mimeType};base64,${base64});
        }
      `
      document.head.appendChild(style)

      // Wait a bit for font to load
      setTimeout(() => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            document.head.removeChild(style)
            resolve({
              isMonospace: false,
              avgCharWidth: 0,
              hasVariableWidth: true,
            })
            return
          }

          ctx.font = `16px 'MonospaceTest-${Date.now()}'`

          // Measure different character widths
          const testChars = ['i', 'l', 'm', 'w', 'M', 'W', '1', '0', ' ', '.']
          const widths = testChars.map((char) => ctx.measureText(char).width)

          const avgWidth = widths.reduce((a, b) => a + b, 0) / widths.length
          const maxDiff = Math.max(...widths) - Math.min(...widths)

          // If max difference is less than 1 pixel, it's likely monospace
          const isMonospace = maxDiff < 1

          document.head.removeChild(style)

          resolve({
            isMonospace,
            avgCharWidth: avgWidth,
            hasVariableWidth: maxDiff > 1,
          })
        } catch (error) {
          document.head.removeChild(style)
          resolve({
            isMonospace: false,
            avgCharWidth: 0,
            hasVariableWidth: true,
          })
        }
      }, 100)
    } catch (error) {
      resolve({ isMonospace: false, avgCharWidth: 0, hasVariableWidth: true })
    }
  })
}

/**
 * Detects font service provider from URL patterns
 */
export function detectFontService(url: string): string | undefined {
  const urlLower = url.toLowerCase()

  if (
    urlLower.includes('fonts.googleapis.com') ||
    urlLower.includes('fonts.gstatic.com')
  ) {
    return 'Google Fonts'
  }
  if (
    urlLower.includes('use.typekit.net') ||
    urlLower.includes('typekit.com')
  ) {
    return 'Adobe Fonts (Typekit)'
  }
  if (urlLower.includes('cloud.typography.com')) {
    return 'Cloud.typography'
  }
  if (urlLower.includes('fonts.com') || urlLower.includes('fast.fonts.net')) {
    return 'Fonts.com'
  }
  if (urlLower.includes('fontawesome')) {
    return 'Font Awesome'
  }
  if (urlLower.includes('webtype.com')) {
    return 'Webtype'
  }

  return undefined
}

/**
 * Extracts referer and request information
 */
export async function getRequestMetadata(
  request: chrome.devtools.network.Request,
): Promise<{ referer?: string }> {
  return new Promise((resolve) => {
    try {
      // Get request headers
      const headers = request.request.headers
      const refererHeader = headers.find(
        (h) => h.name.toLowerCase() === 'referer',
      )

      if (refererHeader?.value) {
        resolve({ referer: refererHeader.value })
      } else {
        resolve({})
      }
    } catch (error) {
      resolve({})
    }
  })
}

/**
 * Combines all enhanced metadata collection methods and fills in missing FontData fields
 */
export async function collectEnhancedFontMetadata(
  fontUrl: string,
  base64: string,
  mimeType: string,
  baseFontData: FontData,
  filename: string,
  chromeRequest?: chrome.devtools.network.Request,
): Promise<FontData> {
  const enhanced: FontData = { ...baseFontData }

  try {
    // Collect CSS usage information
    const cssUsage = await analyzeCSSForFont(fontUrl)
    if (
      cssUsage &&
      (cssUsage.fontFamilyDeclarations.length > 0 ||
        cssUsage.usedInSelectors.length > 0)
    ) {
      enhanced.cssUsage = cssUsage

      // Use CSS font-family to fill in missing fontFamily from file
      if (
        !enhanced.fontFamily &&
        cssUsage.fontFamilyDeclarations.length > 0 &&
        cssUsage.fontFamilyDeclarations[0]
      ) {
        enhanced.fontFamily = cssUsage.fontFamilyDeclarations[0]
      }
    }

    // Detect font service
    const fontService = detectFontService(fontUrl)
    if (fontService) {
      enhanced.fontService = fontService
    }

    // Get request metadata
    if (chromeRequest) {
      const requestMeta = await getRequestMetadata(chromeRequest)
      if (requestMeta.referer) {
        enhanced.referer = requestMeta.referer
      }
    }

    // Detect monospace characteristics
    const metrics = await detectMonospace(base64, mimeType)
    enhanced.isMonospaceDetected = metrics.isMonospace
    enhanced.actualMetrics = {
      avgCharWidth: metrics.avgCharWidth,
      hasVariableWidth: metrics.hasVariableWidth,
    }

    // Set name with proper priority: file metadata -> CSS -> filename
    if (enhanced.fontFamily || enhanced.fullName) {
      // Already has name from file metadata
      enhanced.name = enhanced.fontFamily || enhanced.fullName || enhanced.name
    } else if (
      cssUsage &&
      cssUsage.fontFamilyDeclarations.length > 0 &&
      cssUsage.fontFamilyDeclarations[0]
    ) {
      // Use CSS font-family if no file metadata
      enhanced.name = cssUsage.fontFamilyDeclarations[0]
    } else {
      // Fallback to filename
      enhanced.name = filename
    }
  } catch (error) {
    console.error('Error collecting enhanced font metadata:', error)
  }

  return enhanced
}
