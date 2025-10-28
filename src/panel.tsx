import { createRoot } from 'react-dom/client'
import { useMemo } from 'react'

import './panel.css'
import './components/Button.css'
import './components/Input.css'
import { useRequestSniffing } from './hooks/useRequestSniffing'
import { PanelCard } from './components/PanelCard'
import { Images } from './tabs/Images/Images'
import { Flippingbook } from './tabs/Flippingbook/Flippingbook'
import { MagForge } from './tabs/MagForge/MagForge'
import { Tabs } from './tabs/Tabs'
import { Traffic } from './tabs/Traffic/Traffic'
import { useMagForge } from './tabs/MagForge/hooks/useMagForge'

function Panel() {
  const {
    requests,
    isListening,
    toggleListening,
    reloadPage,
    resetRequests,
    removeRequest,
  } = useRequestSniffing()

  const {
    magForgeImages,
    setUniqueMagForgeImages,
    deleteMagForgeImage,
    countUniqueImages,
  } = useMagForge()

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
            onSendToMagForge={setUniqueMagForgeImages}
            countUniqueImages={countUniqueImages}
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
        name: 'MagForge',
        content: (
          <MagForge
            key={requests.length === 0 ? 'empty' : 'filled'}
            importedImages={magForgeImages}
            deleteImage={deleteMagForgeImage}
          />
        ),
      },
      {
        name: 'Traffic',
        content: <Traffic requests={requests} />,
      },
    ],
    [
      requests,
      removeRequest,
      magForgeImages,
      deleteMagForgeImage,
      countUniqueImages,
    ],
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
