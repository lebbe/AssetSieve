# Copilot Instructions for AssetSieve

## Project Overview

AssetSieve is a Chrome extension DevTools panel for capturing, organizing, and exporting web assets (images, network traffic). It's built with React, TypeScript, and Vite.

## Code Style & Formatting

### Syntax Rules

- **No semicolons** - This project does not use semicolons
- **Single quotes** - Always use single quotes for strings
- **Function declarations** - Prefer function declarations over arrow functions for top-level exports

  ```typescript
  // ✅ Good
  export function ComponentName({ prop1, prop2 }: Props) {}
  export function useHookName() {}
  export function utilityFunction() {}

  // ❌ Avoid
  export const ComponentName = ({ prop1, prop2 }: Props) => {}
  ```

### TypeScript

- Use TypeScript interfaces for props and types
- Define props interface right before the component
- Use type inference where obvious, explicit types where needed
- Prefer `interface` over `type` for object shapes

## Architectural Principles

### 1. DIVIDE AND CONQUER

**Use folders and files to separate code appropriately.**

Follow the existing structure:

```
src/
├── components/        # Reusable UI components
├── hooks/            # Reusable hooks
├── tabs/             # Feature modules (one folder per tab)
│   ├── TabName/
│   │   ├── TabName.tsx        # Main component
│   │   ├── TabName.css        # Styles
│   │   ├── components/        # Tab-specific components
│   │   ├── hooks/            # Tab-specific hooks
│   │   └── utils/            # Tab-specific utilities
└── utils/            # Shared utilities
```

- Keep global reusable components in `src/components/`
- Keep tab-specific code within its tab folder
- Don't create deeply nested folders unnecessarily
- Each component should have its own CSS file when it needs styles

### 2. PUT STATE IN HOOKS

**Provide a hook with the same name as the component to contain logic.**

This pattern is used throughout the codebase:

- **Component-specific hooks**: When a component has significant logic, create a hook with the same name
  - Example: `Filter.tsx` uses `useFilter.ts` or `useTrafficFilter.ts`
  - Example: `Images.tsx` uses `useImageSniffer.ts`
- **Hook location**:
  - Shared hooks go in `src/hooks/`
  - Tab-specific hooks go in `src/tabs/[TabName]/hooks/`
  - Component-specific hooks can live alongside components in the `components/` subfolder

- **Hook naming**: Use descriptive names that indicate what they manage
  - `useCombiner` for combining images
  - `useTrafficFilter` for filtering traffic
  - `useFlippingBookSorting` for sorting FlippingBook items

**Example pattern:**

```typescript
// Filter.tsx
export function Filter({ data }: Props) {
  const { filtered, handleChange } = useFilter(data)
  return <div>...</div>
}

// useFilter.ts
export function useFilter(data: DataType[]) {
  const [filters, setFilters] = useState({...})
  const filteredData = useMemo(() => {...}, [data, filters])
  return { filtered: filteredData, handleChange: ... }
}
```

### 3. NO FILES SHOULD BE NAMED "INDEX"

**Use file naming that actually explains the content of the file.**

- ✅ `Filter.tsx`, `useFilter.ts`, `TrafficItem.tsx`
- ❌ `index.tsx`, `index.ts`

When you see what file is changing in a git diff or search results, the filename should immediately tell you what it contains.

### 4. KISS (Keep It Simple, Stupid)

**Whenever possible keep the code simple and straightforward.**

- Write clear, readable code over clever code
- Prefer explicit over implicit
- Use descriptive variable and function names
- Avoid unnecessary complexity
- Keep functions focused on a single responsibility

### 5. AVOID HASTY ABSTRACTIONS

**Keeping code DRY is less important than keeping code readable.**

- Don't create abstractions until you have 3+ similar use cases
- Some duplication is better than the wrong abstraction
- Each tab/feature can have its own implementations even if similar to others
- Only extract shared code when the pattern is truly stable and reused
- It's okay to have `useTrafficFilter`, `useIIIFFilter`, and `useFilter` as separate implementations if they have different requirements

## Component Patterns

### React Components

```typescript
// Component with props
interface ComponentNameProps {
  data: DataType[]
  onAction: (item: Item) => void
}

export function ComponentName({ data, onAction }: ComponentNameProps) {
  // Hooks at the top
  const { filtered } = useFilter(data)

  // Event handlers
  const handleClick = () => {
    onAction(someItem)
  }

  // Render
  return (
    <div className="component-name">
      {/* JSX */}
    </div>
  )
}
```

### Custom Hooks

```typescript
export function useCustomHook(input: InputType) {
  const [state, setState] = useState(initialValue)

  const derivedValue = useMemo(() => {
    // Expensive computation
    return computed
  }, [dependencies])

  const handleAction = useCallback(() => {
    // Handler logic
  }, [dependencies])

  return {
    state,
    derivedValue,
    handleAction,
  }
}
```

## Common Patterns in This Codebase

### Filtering Pattern

Most tabs implement a filtering system with:

- A `Filter` component for UI
- A `useFilter` or `use[Feature]Filter` hook for logic
- Filter state includes available options and current selections
- Filters are applied via `useMemo` for performance

### Sorting Pattern

Most tabs implement sorting with:

- A `Sorting` component for UI
- A `useSorting` or `use[Feature]Sorting` hook for logic
- Support for sort field, direction (reversed), and custom ordering

### Drag and Drop

Reorderable lists use:

- `useDragAndDrop` hook or feature-specific variant
- HTML5 drag and drop events
- Visual feedback during dragging

### Export Functionality

Each tab can export data:

- `Export` component in the tab's components folder
- PDF generation using jsPDF
- Metadata export functionality

## Testing & Quality

- Run `npm run lint` before committing (uses oxlint)
- Run `npm run type-check` to verify TypeScript
- Run `npm run prettier` to check formatting
- Run `npm run qa` to run all checks together
- Use `npm run prettier:fix` to auto-format code

## Chrome Extension Specific

- Background scripts in `src/background.ts`
- DevTools integration in `src/devtools.ts`
- Main panel in `src/panel.tsx`
- Network request interception via Chrome DevTools protocol
- All processing happens client-side (no external servers)

## Important Notes

- This is a DevTools panel extension, not a popup or page action
- Network requests are captured via `chrome.devtools.network` API
- Images and assets are processed entirely in the browser
- Some features (IIIF, FlippingBook) have specialized parsers for specific formats
- The Traffic tab acts as an enhanced Network panel with export capabilities

## When Adding New Features

1. **Determine scope**: Is it global or tab-specific?
2. **Create structure**: Component + hooks + styles
3. **Name clearly**: No index files, descriptive names
4. **Separate concerns**: UI in components, logic in hooks
5. **Keep it simple**: Don't over-engineer
6. **Follow patterns**: Look at similar existing features
7. **Avoid premature abstraction**: Duplicate first, abstract later if needed

## Build & Development

- `npm run dev` - Build and watch for changes
- `npm run build` - Production build
- `npm run devbuild` - Development build
- Load the `dist/` folder as an unpacked extension in Chrome

The extension must be loaded in Chrome via Developer Mode > Load Unpacked, then accessed through Chrome DevTools (F12).
