# MagForge Tab - Technical Documentation

## Overview

**MagForge** is a tab component for creating PDF magazines from images detected by the AssetSieve network sniffer. The name combines "Magazine" with "Forge" to convey the idea of crafting/creating publications.

## Architecture

### State Management Pattern

MagForge uses a **two-tier state architecture** to achieve independence from the Images tab:

```
┌─────────────────┐
│   panel.tsx     │
│                 │
│  magForgeImages │ ← Shared state (transfer mechanism)
│  (useState)     │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌──────────────────┐
│  Images Tab     │  │  MagForge Tab    │
│                 │  │                  │
│  sortedImages   │  │  magazineImages  │ ← Local state (persistent)
│  (filtered)     │  │  (useState)      │
└─────────────────┘  └──────────────────┘
```

#### Tier 1: Shared State (`magForgeImages`)

- **Location**: `panel.tsx`
- **Type**: `useState<ImageData[]>([])`
- **Purpose**: Acts as a transfer mechanism between tabs
- **Lifecycle**: Cleared and reused for each transfer operation

#### Tier 2: Local State (`magazineImages`)

- **Location**: `MagForge.tsx`
- **Type**: `useState<ImageData[]>([])`
- **Purpose**: Persistent storage of magazine images
- **Lifecycle**: Independent of Images tab - survives filter changes, clears, etc.

### Data Flow

1. **Detection**: Images detected in the Images tab via network sniffing
2. **Filtering**: User applies filters in Images tab (file type, dimensions, etc.)
3. **Transfer**: User clicks "Send to MagForge" button in Images Export panel
4. **Callback**: `onSendToMagForge(sortedImages)` is called
5. **Deduplication**: `setUniqueMagForgeImages` filters out images with duplicate URLs
6. **State Update**: `magForgeImages` in `panel.tsx` is updated with unique images
7. **Props Flow**: MagForge receives updated `importedImages` prop
8. **Render**: MagForge displays all images from `importedImages`
9. **Independence**: Images tab can be cleared/filtered without affecting MagForge

## Component Interface

### Props

```typescript
type Props = {
  importedImages?: ImageData[]
}
```

#### `importedImages`

- **Type**: `ImageData[] | undefined`
- **Source**: Passed from `panel.tsx` via `useMagForge` hook
- **Purpose**: The complete list of magazine images to display
- **Flow**: `Images.Export.button.onClick` → `useMagForge.setUniqueMagForgeImages` → `panel.magForgeImages` → `MagForge.importedImages`

### ImageData Interface

```typescript
interface ImageData {
  url: string // Image URL
  mimeType: string // e.g., 'image/png', 'image/jpeg'
  size: number // File size in bytes
  width: number // Image width in pixels
  height: number // Image height in pixels
  base64: string // Base64-encoded image data
}
```

## Key Implementation Details

### Custom Hook: `useMagForge`

The state management is encapsulated in a custom hook located at `hooks/useMagForge.ts`:

```typescript
export function useMagForge() {
  const [magForgeImages, setMagForgeImages] = useState<ImageData[]>([])

  const setUniqueMagForgeImages = (newImages: ImageData[]) => {
    setMagForgeImages((prev) => {
      const existingUrls = new Set(prev.map((img) => img.url))
      const uniqueNewImages = newImages.filter(
        (img) => !existingUrls.has(img.url),
      )
      return [...prev, ...uniqueNewImages]
    })
  }

  return {
    magForgeImages,
    setUniqueMagForgeImages,
  }
}
```

**Benefits of this hook:**

- ✅ **Encapsulation**: State and logic bundled together
- ✅ **Reusability**: Can be used in other components if needed
- ✅ **Testability**: Hook can be tested independently
- ✅ **Cleaner Panel**: Panel component stays focused on composition
- ✅ **Colocation**: Hook lives in MagForge directory with related code

### Deduplication Logic

Deduplication is handled by the `useMagForge` hook:

**In `hooks/useMagForge.ts`:**

```typescript
const setUniqueMagForgeImages = (newImages: ImageData[]) => {
  setMagForgeImages((prev) => {
    const existingUrls = new Set(prev.map((img) => img.url))
    const uniqueNewImages = newImages.filter(
      (img) => !existingUrls.has(img.url),
    )
    return [...prev, ...uniqueNewImages]
  })
}
```

**In `MagForge.tsx`:**

```typescript
export function MagForge({ importedImages }: Props) {
  // Simply use the prop - no local state needed!
  const magazineImages = importedImages || []

  return (
    <div className="magforge">
      {/* Render images */}
    </div>
  )
}
```

**Design rationale:**

- Uses URL as unique identifier for deduplication
- Prevents duplicate images from being added across multiple "Send to MagForge" operations
- Preserves insertion order
- Non-destructive: existing images remain unchanged
- **Encapsulated Logic**: State management lives in dedicated hook
- **Single Source of Truth**: State lives only in panel via hook, not duplicated in child
- **Simpler Architecture**: No synchronization needed between parent and child state
- **Pure Component**: MagForge is a pure display component with no internal state management

### Why This Pattern?

**Problem**: How to "send" filtered images from one tab to another without creating tight coupling, while preventing duplicate images?

**Solution**: Lifted state in parent + wrapper function for deduplication + props-only child component

**Benefits**:

1. ✅ **Independence**: Magazine images persist when Images tab filters change
2. ✅ **Decoupling**: Tabs don't directly reference each other
3. ✅ **Flexibility**: User can build magazine incrementally from different filter sets
4. ✅ **No Duplicates**: Users don't have to scroll through the same images multiple times
5. ✅ **Clean Architecture**: Deduplication logic centralized where state is managed
6. ✅ **Single Source of Truth**: State lives only in panel, no synchronization issues
7. ✅ **Simpler Components**: MagForge is a pure component, easier to test and maintain
8. ✅ **Scalability**: Pattern can be extended to other tabs if needed

## Integration with Panel

In `panel.tsx`:

```typescript
import { useMagForge } from './tabs/MagForge/hooks/useMagForge'

function Panel() {
  // ... other hooks ...

  const { magForgeImages, setUniqueMagForgeImages } = useMagForge()

  // Tab configuration - Images tab
  {
    name: 'Images',
    content: (
      <Images
        key={requests.length === 0 ? 'empty' : 'filled'}
        requests={requests}
        removeRequest={removeRequest}
        onSendToMagForge={setUniqueMagForgeImages}  // Hook's setter
      />
    ),
  }

  // Tab configuration - MagForge tab
  {
    name: 'MagForge',
    content: (
      <MagForge
        key={requests.length === 0 ? 'empty' : 'filled'}
        importedImages={magForgeImages}  // Hook's state
      />
    ),
  }
}
```

### Key Point: Remounting Prevention

- The `key` prop prevents unnecessary remounting when request state changes
- Uses `'empty' | 'filled'` to only remount when transitioning between states
- No local state in MagForge means no concerns about state preservation during remounts

## Integration with Images Tab

In `Images.tsx`:

```typescript
type Props = {
  requests: NetworkRequest[]
  removeRequest: (url: string) => void
  onSendToMagForge: (images: ImageData[]) => void // Required callback
}
```

In `Export.tsx`:

```typescript
const handleSendToMagForge = () => {
  if (sortedImages.length === 0) {
    alert('No images to send to MagForge')
    return
  }

  onSendToMagForge(sortedImages)
  alert(`Sent ${sortedImages.length} images to MagForge!`)
}
```

## File Structure

```
src/tabs/MagForge/
├── README.md              # This file
├── MagForge.tsx          # Main component (pure display component)
├── MagForge.css          # Styling
├── components/           # Future: UI components for magazine layout
│   └── (empty)
├── hooks/                # Custom hooks for state management
│   └── useMagForge.ts   # State management and deduplication logic
└── utils/                # Future: Magazine generation utilities
    └── (empty)
```

## Future Development Areas

### Components to Add (`components/`)

- `MagazineLayout.tsx` - Grid/layout manager for pages
- `PageEditor.tsx` - Individual page editing interface
- `ImagePlacement.tsx` - Drag-and-drop image positioning
- `TextOverlay.tsx` - Add text to magazine pages
- `ExportControls.tsx` - PDF export with customization

### Hooks to Add (`hooks/`)

- ✅ `useMagForge.ts` - **Already implemented!** Manages magazine state and deduplication
- `useMagazineLayout.ts` - Manage page layout and image placement
- `usePDFGeneration.ts` - Handle PDF creation from magazine data
- `usePageManagement.ts` - Add/remove/reorder pages

### Utils to Add (`utils/`)

- `magazinePdfGenerator.ts` - Multi-page PDF generation with layouts
- `layoutTemplates.ts` - Predefined magazine layouts (2-col, 3-col, grid, etc.)
- `imageTransform.ts` - Crop, resize, position images for layouts

## Design Decisions

### Why Manage State in Panel Instead of MagForge?

- **Single Source of Truth**: State lives only in `panel.tsx`, no duplication
- **Simpler Component**: MagForge is a pure display component with no state management
- **No Synchronization**: No need for useEffect to sync parent and child state
- **Persistence**: State naturally persists because it lives in the parent component
- **Clarity**: Clear data flow - parent owns and manages state, child renders it
- **Easier Testing**: Pure components are simpler to test

### Why Not Use Images Tab Data Directly?

- **User Experience**: Clearing filters in Images tab would clear the magazine
- **Flexibility**: Users can build magazines from multiple filter operations
- **Workflow**: Iterative selection process (filter → send → filter again → send)

### Why Not Use `requests` and `removeRequest` in MagForge?

- **Single Responsibility**: MagForge manages its own image collection
- **Decoupling**: MagForge doesn't need to know about network requests
- **Clarity**: Clear boundary between detection (Images) and composition (MagForge)

### Why Alert on Send?

- **User Feedback**: Immediate confirmation that action succeeded
- **Count Verification**: Shows how many images were transferred
- **Temporary**: Can be replaced with toast notifications or status messages

## Testing Considerations

When testing MagForge:

1. **State Independence**:
   - Send images to MagForge
   - Clear filters in Images tab
   - Verify MagForge still has its images

2. **Deduplication**:
   - Send same images twice
   - Verify no duplicates in MagForge

3. **Empty State**:
   - Load MagForge with no images
   - Verify helpful message appears

4. **Large Datasets**:
   - Send 50+ images
   - Verify performance remains acceptable

## Code Style Notes

Following project conventions:

- No semicolons
- Single quotes
- Functions over arrow functions for exports
- Props destructured in function signature
- Type imports kept separate from value imports
