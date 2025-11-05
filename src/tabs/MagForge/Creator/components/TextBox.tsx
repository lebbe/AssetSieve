import { useState, useRef, useEffect, useCallback } from 'react'
import { PlacedTextBox, GridSettings } from '../types/page'
import { TextFormatPanel } from './TextFormatPanel'
import { snapToGrid } from '../utils/gridSnapping'
import './TextBox.css'

type Props = {
  textBox: PlacedTextBox
  isSelected: boolean
  onClick: () => void
  onUpdate: (updated: PlacedTextBox) => void
  scale: number
  canvasWidth: number
  gridSettings: GridSettings
}

type InteractionMode = 'none' | 'dragging' | 'resizing'

// Constants
const MIN_TEXT_BOX_WIDTH = 100
const MIN_TEXT_BOX_HEIGHT = 50

export function TextBox({
  textBox,
  isSelected,
  onClick,
  onUpdate,
  scale,
  canvasWidth,
  gridSettings,
}: Props) {
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode>('none')
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(textBox.text)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dragStart = useRef({
    x: 0,
    y: 0,
    textBoxX: 0,
    textBoxY: 0,
    width: 0,
    height: 0,
  })

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (interactionMode === 'none') return

      const dx = (e.clientX - dragStart.current.x) / scale
      const dy = (e.clientY - dragStart.current.y) / scale

      if (interactionMode === 'dragging') {
        const rawX = dragStart.current.textBoxX + dx
        const rawY = dragStart.current.textBoxY + dy

        // Apply grid snapping
        const snapped = snapToGrid(
          rawX,
          rawY,
          textBox.width,
          textBox.height,
          canvasWidth,
          gridSettings,
          e.altKey,
        )

        onUpdate({
          ...textBox,
          x: snapped.x,
          y: snapped.y,
        })
      } else if (interactionMode === 'resizing') {
        const newWidth = Math.max(
          MIN_TEXT_BOX_WIDTH,
          dragStart.current.width + dx,
        )
        const newHeight = Math.max(
          MIN_TEXT_BOX_HEIGHT,
          dragStart.current.height + dy,
        )

        onUpdate({
          ...textBox,
          width: newWidth,
          height: newHeight,
        })
      }
    },
    [interactionMode, scale, textBox, onUpdate, canvasWidth, gridSettings],
  )

  const handleMouseUp = useCallback(() => {
    setInteractionMode('none')
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isEditing) return

    if (!isSelected) {
      onClick()
    }

    setInteractionMode('dragging')
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      textBoxX: textBox.x,
      textBoxY: textBox.y,
      width: textBox.width,
      height: textBox.height,
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isSelected) {
      setIsEditing(true)
      setEditText(textBox.text)
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
    setInteractionMode('resizing')

    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      textBoxX: textBox.x,
      textBoxY: textBox.y,
      width: textBox.width,
      height: textBox.height,
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value)
  }

  const handleTextBlur = () => {
    setIsEditing(false)
    onUpdate({
      ...textBox,
      text: editText,
    })
  }

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false)
      setEditText(textBox.text)
    }
    // Don't prevent Enter for multiline text
  }

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    if (interactionMode !== 'none') {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
    return undefined
  }, [interactionMode, handleMouseMove, handleMouseUp])

  const getFontWeight = () => {
    return textBox.isBold ? '700' : '400'
  }

  const getFontStyle = () => {
    return textBox.isItalic ? 'italic' : 'normal'
  }

  const getTextDecoration = () => {
    return textBox.isUnderline ? 'underline' : 'none'
  }

  return (
    <>
      <div
        className={`text-box ${isSelected ? 'text-box--selected' : ''} ${isEditing ? 'text-box--editing' : ''}`}
        style={{
          left: `${textBox.x}px`,
          top: `${textBox.y}px`,
          width: `${textBox.width}px`,
          height: `${textBox.height}px`,
          zIndex: textBox.zIndex,
          fontFamily: textBox.fontFamily,
          fontSize: `${textBox.fontSize}px`,
          fontWeight: getFontWeight(),
          fontStyle: getFontStyle(),
          textDecoration: getTextDecoration(),
          color: textBox.color,
          cursor: isEditing ? 'text' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="text-box-textarea"
            value={editText}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={handleTextKeyDown}
            style={{
              fontFamily: textBox.fontFamily,
              fontSize: `${textBox.fontSize}px`,
              fontWeight: getFontWeight(),
              fontStyle: getFontStyle(),
              textDecoration: getTextDecoration(),
              color: textBox.color,
            }}
          />
        ) : (
          <div className="text-box-content">{textBox.text}</div>
        )}
        {isSelected && !isEditing && (
          <div className="resize-handle" onMouseDown={handleResizeMouseDown} />
        )}
      </div>
      {isSelected && !isEditing && (
        <TextFormatPanel textBox={textBox} onUpdate={onUpdate} scale={scale} />
      )}
    </>
  )
}
