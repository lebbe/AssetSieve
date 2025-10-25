import { useMemo, useState } from 'react'
import { NetworkRequest } from '../../../hooks/useRequestSniffing'

export interface TrafficFilterState {
  url: string
  method: string
  status: string
  mimeType: string
  minSize: string
  maxSize: string
}

export function useTrafficFilter(requests: NetworkRequest[]) {
  const [filters, setFilters] = useState<TrafficFilterState>({
    url: '',
    method: '',
    status: '',
    mimeType: '',
    minSize: '',
    maxSize: '',
  })

  // Get unique values for filter options
  const availableMethods = useMemo(() => {
    const methods = new Set<string>()
    requests.forEach((request) => {
      if (request.method) {
        methods.add(request.method)
      }
    })
    return Array.from(methods).sort()
  }, [requests])

  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>()
    requests.forEach((request) => {
      if (request.status) {
        statuses.add(request.status.toString())
      }
    })
    return Array.from(statuses).sort((a, b) => parseInt(a) - parseInt(b))
  }, [requests])

  const availableMimeTypes = useMemo(() => {
    const types = new Set<string>()
    requests.forEach((request) => {
      if (request.mimeType) {
        const baseType = request.mimeType.split('/')[0]
        types.add(baseType)
      }
    })
    return Array.from(types).sort()
  }, [requests])

  // Filter requests based on current filters
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      // URL filter
      if (
        filters.url &&
        !request.url.toLowerCase().includes(filters.url.toLowerCase())
      ) {
        return false
      }

      // Method filter
      if (filters.method && request.method !== filters.method) {
        return false
      }

      // Status filter
      if (filters.status && request.status.toString() !== filters.status) {
        return false
      }

      // MIME type filter
      if (filters.mimeType && !request.mimeType.startsWith(filters.mimeType)) {
        return false
      }

      // Size filters
      if (filters.minSize) {
        const minSizeBytes = parseInt(filters.minSize) * 1024 // Convert KB to bytes
        if (!isNaN(minSizeBytes) && request.size < minSizeBytes) {
          return false
        }
      }

      if (filters.maxSize) {
        const maxSizeBytes = parseInt(filters.maxSize) * 1024 // Convert KB to bytes
        if (!isNaN(maxSizeBytes) && request.size > maxSizeBytes) {
          return false
        }
      }

      return true
    })
  }, [requests, filters])

  const handleInputChange = (
    field: keyof TrafficFilterState,
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      url: '',
      method: '',
      status: '',
      mimeType: '',
      minSize: '',
      maxSize: '',
    })
  }

  return {
    filteredRequests,
    filters,
    availableMethods,
    availableStatuses,
    availableMimeTypes,
    handleInputChange,
    clearFilters,
  }
}
