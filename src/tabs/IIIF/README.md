# IIIF Tab

This tab automatically detects and stitches together IIIF (International Image Interoperability Framework) tiled images.

## What is IIIF?

IIIF is a standard for delivering high-resolution images over the web. Large images are often split into tiles to improve loading performance. The IIIF Image API uses a specific URL format to request these tiles.

## Features

- ✅ **Automatic Detection** - Detects IIIF URLs from network traffic
- ✅ **Auto-Stitching** - Automatically combines tiles when loaded
- ✅ **Live Preview** - See stitched images immediately (thumbnails)
- ✅ **Modal View** - Click thumbnails to view full-size images
- ✅ **Filtering** - Filter by identifier, base URL, dimensions, or tile count
- ✅ **Sorting** - Sort by download order, base URL, identifier, or dimensions
- ✅ **Drag & Drop** - Manually reorder images
- ✅ **Display Options** - Adjust thumbnail size, density, and detail level
- ✅ **PDF Export** - Export all images to PDF in sorted order
- ✅ **Delete Images** - Remove unwanted images and their tiles
- ✅ **Highest Resolution** - Automatically selects best quality tiles
- ✅ **Real-time Progress** - Track tile loading and stitching progress
- ✅ **Individual Downloads** - Download each image as PNG

## URL Format

IIIF Image API URLs follow this pattern:

```
{scheme}://{server}/{prefix}/{identifier}/{region}/{size}/{rotation}/{quality}.{format}
```

Example:

```
https://www.nb.no/services/image/resolver/URN:NBN:no-nb_digibok_2012082008051_C1/0,0,2048,2048/1024,/0/default.jpg
```

Where:

- **identifier**: `URN:NBN:no-nb_digibok_2012082008051_C1`
- **region**: `0,0,2048,2048` (x, y, width, height)
- **size**: `1024,` (scaled width)
- **rotation**: `0` (degrees)
- **quality**: `default`
- **format**: `jpg`

## How It Works

1. **Detection** - Monitors network requests and automatically detects IIIF URLs
2. **Grouping** - Tiles are grouped by their base URL/identifier
3. **Resolution Selection** - Highest resolution version selected for each tile position
4. **Auto-Stitching** - Tiles automatically combine when all are loaded
5. **Preview** - See complete images immediately
6. **Filter & Sort** - Organize images as needed
7. **Export** - Download individually or export all to PDF

## Usage

### Basic Workflow

1. **Start listening** to network traffic
2. Navigate to a page with IIIF images (e.g., digital book readers, museum collections)
3. Switch to the **IIIF tab**
4. Images automatically stitch as tiles load
5. Use **filters** and **sorting** to organize images
6. **Export to PDF** or download individual images

### Filtering Images

Filter images by:

- **Identifier** - Search in image identifier
- **Base URL** - Search in base URL
- **Min Width** - Minimum image width in pixels
- **Min Height** - Minimum image height in pixels
- **Min Tiles** - Minimum number of tiles

### Sorting Images

Sort by:

- **Default** - Original download order (or manual drag-and-drop order)
- **Base URL** - Alphabetically by base URL
- **Identifier** - Alphabetically by identifier
- **Dimensions** - By total area (largest first)

Reverse sort order with the arrow button.

**Manual Sorting:**

- Hover over the ⋮⋮ icon on the left of each image
- Drag and drop to reorder manually
- Manual order is preserved when switching back to "Default" sort

### Display Options

Adjust how images are displayed:

- **Size** - Thumbnail size (Small 32px, Medium 64px, Large 128px)
- **Density** - Spacing between items (Compact, Comfortable, Spacious)
- **Details** - Information shown (Full Info, Basic Info, Image Only)

### Viewing Images

- **Thumbnails** - Small preview shown in list
- **Full Size** - Click any thumbnail to open modal with full-size image
- **Modal Controls**:
  - Click outside image to close
  - Press `Escape` key to close
  - Click × button to close

### Deleting Images

Click the red × button next to any image to remove it and all its tiles from the list.

### PDF Export

1. Configure **title**, **filename**, **author**, and **creator** metadata
2. Click **Export to PDF**
3. All visible (filtered & sorted) images exported in current order
4. Images automatically stitched during export if needed
5. Images fit to A4 page size maintaining aspect ratio

### Individual Downloads

Click **Download PNG** on any image to save it separately.

## Example Sites

The IIIF tab works great with:

- Nasjonalbiblioteket (nb.no) digital collections
- Museum digital collections using IIIF
- Digital libraries worldwide
- Archive viewers using IIIF standard

## Technical Details

### Tile Detection

The detector uses regex to match IIIF URL patterns:

```typescript
;/^(.+\/)([^/]+)\/([0-9]+,[0-9]+,[0-9]+,[0-9]+)\/([^/]+)\/([0-9]+)\/([^/.]+)\.(jpg|jpeg|png|webp|gif|tif|tiff)$/i
```

### Resolution Selection

When multiple tiles exist for the same position (different resolutions), the tile with the highest `scaledWidth` parameter is selected automatically.

### Stitching Algorithm

1. Create a canvas with full image dimensions (calculated from max x+width, y+height)
2. Load each tile as an Image
3. Draw each tile at its correct position (x, y) with original dimensions
4. Export canvas as PNG data URL

## Components

- `IIIF.tsx` - Main tab with filtering, sorting, display options, and export
- `IIIFItem.tsx` - Individual image in list view with drag handle, delete, and click-to-view
- `ImageModal.tsx` - Full-size image modal viewer
- `Filter.tsx` - Filter controls for finding specific images
- `Sorting.tsx` - Sort controls for organizing images
- `Export.tsx` - PDF export with metadata configuration
- `useIIIFDetector.ts` - Hook for detecting and grouping IIIF tiles
- `useIIIFFilter.ts` - Hook for filtering images
- `useIIIFSorting.ts` - Hook for sorting images with manual order support
- `useIIIFDragAndDrop.ts` - Hook for drag-and-drop reordering
- `iiifStitcher.ts` - Utility for combining tiles into one image
