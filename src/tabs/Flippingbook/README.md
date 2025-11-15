# FlippingBook

The FlippingBook tab captures and processes FlippingBook digital publications, combining background images with optional SVG text overlays.

## File Pattern Recognition

FlippingBook uses specific naming patterns for page images. The pattern includes resolution indicators that affect image quality:

### Common Patterns

| Pattern             | Resolution | Format | Description                         |
| ------------------- | ---------- | ------ | ----------------------------------- |
| `page\d{4}_5\.jpg`  | **High**   | JPG    | Higher resolution, better quality   |
| `page\d{4}_3\.webp` | Lower      | WebP   | Lower resolution, smaller file size |

### Resolution Indicators

The number after the underscore (`_`) indicates the resolution level:

- `_5` = High resolution (recommended for quality)
- `_3` = Lower resolution (smaller files)

### Pattern Examples

Real filename examples that match these patterns:

- `page0001_5.jpg` → High resolution JPG of page 1
- `page0042_3.webp` → Lower resolution WebP of page 42
- `page0150_5.jpg` → High resolution JPG of page 150

## Usage

1. **Navigate to a FlippingBook website** - The extension will automatically detect page images
2. **Adjust the regex pattern** if needed - Use the dropdown for common patterns or write your own
3. **Remove duplicates** (optional) - Filters out duplicate pages with identical paths
4. **Export options**:
   - PDF: Combines all pages into a single document
   - ZIP: Downloads all individual images and SVG overlays
   - Individual: Download single pages or combined PNG images

## Supported Features

- **Multiple image formats**: JPG, JPEG, PNG, WebP
- **SVG text overlays**: Automatically paired with background images when available
- **Drag & drop reordering**: Manually arrange page order before export
- **Quality settings**: Choose export quality and format options
- **Metadata export**: Include custom metadata in PDF exports

## Technical Notes

- Pages are paired by matching page numbers extracted from filenames
- SVG overlays are optional and matched by page number
- Background images support all common web formats
- Export quality can be adjusted for different use cases
