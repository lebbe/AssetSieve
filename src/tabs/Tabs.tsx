import { useState } from 'react'
import React from 'react'

import './Tabs.css'

export type Tab = {
  name: string
  content: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
}

export function Tabs({ tabs }: TabsProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="tabs-container">
      <nav className="tabs-navigation" role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={tab.name}
            role="tab"
            aria-selected={index === activeIndex}
            aria-controls={`tab-panel-${tab.name.replace(/\s+/g, '-')}`}
            className={
              index === activeIndex
                ? 'tab-button tab-button--active'
                : 'tab-button'
            }
            onClick={() => setActiveIndex(index)}
          >
            {tab.name}
          </button>
        ))}
      </nav>

      <div className="tabs-content">
        {tabs.map(({ name, content }, index) => (
          <div
            key={name}
            role="tabpanel"
            id={`tab-panel-${name.replace(/\s+/g, '-')}`}
            className={`tab-panel ${
              index === activeIndex ? 'tab-panel--active' : 'tab-panel--hidden'
            }`}
          >
            {content}
          </div>
        ))}
      </div>
    </div>
  )
}
