import { useState } from 'react'

export type PreviewSize = 'small' | 'medium' | 'large'
export type Density = 'compact' | 'comfortable' | 'spacious'
export type ShowDetails = 'full' | 'minimal' | 'none'

export function useDisplayOptions() {
  const [previewSize, setPreviewSize] = useState<PreviewSize>('small')
  const [density, setDensity] = useState<Density>('comfortable')
  const [showDetails, setShowDetails] = useState<ShowDetails>('full')

  return {
    previewSize,
    setPreviewSize,
    density,
    setDensity,
    showDetails,
    setShowDetails,
  }
}
