import { createRoot } from 'react-dom/client'
import { useMemo } from 'react'

import './panel.css'
import './components/Button.css'
import './components/Input.css'
import { useRequestSniffing } from './hooks/useRequestSniffing'
import { PanelCard } from './components/PanelCard'
import { Images } from './tabs/Images/Images'
import { Flippingbook } from './tabs/Flippingbook/Flippingbook'
import { Tabs } from './tabs/Tabs'
import { Traffic } from './tabs/Traffic/Traffic'

function Panel() {
  const {
    requests,
    isListening,
    toggleListening,
    reloadPage,
    resetRequests,
    removeRequest,
  } = useRequestSniffing()

  // Create stable tabs array with pre-rendered content to prevent remounting
  const tabs = useMemo(
    () => [
      {
        name: 'Images',
        content: (
          <Images
            key={requests.length === 0 ? 'empty' : 'filled'}
            requests={requests}
            removeRequest={removeRequest}
          />
        ),
      },
      {
        name: 'Flippingbook',
        content: (
          <Flippingbook
            key={requests.length === 0 ? 'empty' : 'filled'}
            requests={requests}
            removeRequest={removeRequest}
          />
        ),
      },
      {
        name: 'Traffic',
        content: <Traffic requests={requests} />,
      },
    ],
    [requests, removeRequest],
  )
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
      <Tabs tabs={tabs} />
    </div>
  )
}

// Mount the React component
const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<Panel />)
}
