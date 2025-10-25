import { useMemo, useState } from 'react'
import { NetworkRequest } from '../../../hooks/useRequestSniffing'

export type TrafficSortBy =
  | 'time'
  | 'url'
  | 'method'
  | 'status'
  | 'size'
  | 'mimeType'
export type SortDirection = 'asc' | 'desc'

export function useTrafficSorting(requests: NetworkRequest[]) {
  const [sortBy, setSortBy] = useState<TrafficSortBy>('time')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const sortedRequests = useMemo(() => {
    const sorted = [...requests].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'time':
          comparison = a.time - b.time
          break
        case 'url':
          comparison = a.url.localeCompare(b.url)
          break
        case 'method':
          comparison = a.method.localeCompare(b.method)
          break
        case 'status':
          comparison = a.status - b.status
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'mimeType':
          comparison = a.mimeType.localeCompare(b.mimeType)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [requests, sortBy, sortDirection])

  const handleSort = (field: TrafficSortBy) => {
    if (field === sortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDirection('asc')
    }
  }

  return {
    sortedRequests,
    sortBy,
    sortDirection,
    handleSort,
  }
}
