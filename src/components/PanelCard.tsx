import React from 'react'

import './PanelCard.css'

interface PanelCardProps {
  children: React.ReactNode
  className?: string
  title?: string
}

export function PanelCard({ children, className = '', title }: PanelCardProps) {
  return (
    <div className={`panel-card ${className}`}>
      {title && <h3 className="panel-card-title">{title}</h3>}
      <div className="panel-card-content">{children}</div>
    </div>
  )
}
