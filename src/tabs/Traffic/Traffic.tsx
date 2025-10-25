import { NetworkRequest } from '../../hooks/useRequestSniffing'
import { useTrafficFilter } from './components/useTrafficFilter'
import { useTrafficSorting } from './components/useTrafficSorting'
import { Filter } from './components/Filter'
import { Sorting } from './components/Sorting'
import { Export } from './components/Export'
import { TrafficItem } from './components/TrafficItem'
import { PanelCard } from '../../components/PanelCard'
import './Traffic.css'

type Props = {
  requests: NetworkRequest[]
}

export function Traffic({ requests }: Props) {
  const {
    filteredRequests,
    filters,
    availableMethods,
    availableStatuses,
    availableMimeTypes,
    handleInputChange,
    clearFilters,
  } = useTrafficFilter(requests)

  const { sortedRequests, sortBy, sortDirection, handleSort } =
    useTrafficSorting(filteredRequests)

  return (
    <div className="traffic-container">
      <div className="traffic-controls">
        <Filter
          filters={filters}
          availableMethods={availableMethods}
          availableStatuses={availableStatuses}
          availableMimeTypes={availableMimeTypes}
          onFilterChange={handleInputChange}
          onClearFilters={clearFilters}
        />

        <div className="control-panels">
          <Sorting
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
          />

          <Export requests={sortedRequests} />
        </div>
      </div>

      <PanelCard title={`Network Requests (${sortedRequests.length})`}>
        <div className="traffic-results">
          {sortedRequests.length === 0 ? (
            <div className="no-requests">
              {requests.length === 0
                ? 'No network requests captured yet. Navigate to a page to see traffic.'
                : 'No requests match the current filters.'}
            </div>
          ) : (
            <div className="traffic-list">
              {sortedRequests.map((request, index) => (
                <TrafficItem
                  key={`${request.url}-${request.time}-${index}`}
                  request={request}
                />
              ))}
            </div>
          )}
        </div>
      </PanelCard>
    </div>
  )
}
