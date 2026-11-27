// Large drag-and-drop target that also opens the file picker (click / Enter / Space).
import { useRef } from 'react'
import { Icon } from './Icons'
import './DropZone.css'

export default function DropZone({
  accept,
  title,
  hint,
  compact = false,
  dragging = false,
  busy = false,
  onFiles,
}) {
  const inputRef = useRef(null)

  const open = () => inputRef.current?.click()

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open()
    }
  }

  const onChange = (e) => {
    const files = e.target.files
    if (files && files.length) onFiles(files)
    e.target.value = ''
  }

  return (
    <div
      className={`dropzone ${compact ? 'compact' : ''} ${dragging ? 'dragging' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${title}. ${hint}`}
      aria-busy={busy || undefined}
      onClick={open}
      onKeyDown={onKeyDown}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={onChange}
        tabIndex={-1}
      />
      <div className="dz-icon" aria-hidden="true">
        <Icon name="upload" />
      </div>
      <div className="dz-text">
        <p className="dz-title">{dragging ? 'Release to upload' : title}</p>
        <p className="dz-hint">{hint}</p>
      </div>
      <span className="btn btn-primary dz-btn" aria-hidden="true">
        <Icon name="folder" />
        Browse files
      </span>
    </div>
  )
}
