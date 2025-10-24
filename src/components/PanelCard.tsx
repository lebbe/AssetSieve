import React from 'react'

interface PanelCardProps {
  children: React.ReactNode
  className?: string
}

export function PanelCard({ children, className = '' }: PanelCardProps) {
  return <div className={`panel-card ${className}`}>{children}</div>
}
