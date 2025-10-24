import React from 'react'
import './InputContainer.css'

interface InputContainerProps {
  label: string
  children: React.ReactNode
  htmlFor?: string
}

export function InputContainer({
  label,
  children,
  htmlFor,
}: InputContainerProps) {
  return (
    <div className="input-container">
      <label htmlFor={htmlFor} className="input-label">
        {label}
      </label>
      <div className="input-wrapper">{children}</div>
    </div>
  )
}
