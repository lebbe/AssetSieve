import { createRoot } from 'react-dom/client'

import './panel.css'
import './components/Button.css'
import { useRequestSniffing } from './hooks/useRequestSniffing'
import { PanelCard } from './components/PanelCard'
import { Images } from './tabs/Images/Images'

function Panel() {
  const {
    requests,
    isListening,
    toggleListening,
    reloadPage,
    resetRequests,
    removeRequest,
  } = useRequestSniffing()
  return (
    <div>
      <h1>AssetSieve</h1>
      <PanelCard title="Network">
        <div className="controls">
          <button
            onClick={toggleListening}
            className={`btn ${isListening ? 'btn-red' : 'btn-green'}`}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </button>
          <button onClick={reloadPage} className="btn btn-blue">
            Reload Page
          </button>
          <button onClick={resetRequests} className="btn">
            Clear Images
          </button>
          <span className="listening-status">
            {isListening
              ? 'Listening for network traffic...'
              : 'Network monitoring paused'}
          </span>
        </div>
      </PanelCard>
      <Images requests={requests} removeRequest={removeRequest} />
    </div>
  )
}

// Mount the React component
const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<Panel />)
}
