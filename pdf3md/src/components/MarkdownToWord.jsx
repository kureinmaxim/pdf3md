// Markdown → Word: editor with live preview, profile choice and .docx download.
import { useRef, useState } from 'react'
import { Icon } from './Icons'
import MarkdownView from './MarkdownView'
import ProfileSelector from './ProfileSelector'
import { toast } from './Toaster'
import { useStoredState } from '../lib/hooks'
import { downloadBlob } from '../lib/format'
import { getBackendUrl } from '../api/profileApi'
import './MarkdownToWord.css'

const SAMPLE = `# Project report

A short **Markdown** sample. Replace it with your own text.

## Highlights

- Converts headings, lists and tables
- Uses the selected *formatting profile*

| Item | Status |
|------|--------|
| Draft | Done |
| Review | In progress |
`

export default function MarkdownToWord({ profilesVersion, onManageProfiles }) {
  const [text, setText] = useStoredState('pdf3md-md-draft', '')
  const [profile, setProfile] = useStoredState('pdf3md-profile', 'default')
  const [filename, setFilename] = useState('document')
  const [converting, setConverting] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)

  const loadFile = async (file) => {
    if (!file) return
    if (!/\.(md|markdown|txt)$/i.test(file.name)) {
      toast(`${file.name}: only .md, .markdown or .txt files can be opened`, 'error')
      return
    }
    setText(await file.text())
    setFilename(file.name.replace(/\.(md|markdown|txt)$/i, ''))
    toast(`Opened ${file.name}`, 'success')
  }

  const convert = async () => {
    if (!text.trim()) return
    setConverting(true)
    try {
      const response = await fetch(`${getBackendUrl()}/convert-markdown-to-word`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown: text,
          filename: filename || 'document',
          profile,
        }),
      })
      if (!response.ok) {
        let msg = `HTTP ${response.status}`
        try {
          msg = (await response.json()).error || msg
        } catch {
          /* not JSON */
        }
        throw new Error(msg)
      }
      const blob = await response.blob()
      const cd = response.headers.get('content-disposition') || ''
      const match = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
      const name = match ? decodeURIComponent(match[1]) : `${filename || 'document'}.docx`
      downloadBlob(blob, name)
      toast(`Word document ready: ${name}`, 'success')
    } catch (err) {
      toast(`Conversion to Word failed: ${err.message}`, 'error', { duration: 7000 })
    } finally {
      setConverting(false)
    }
  }

  const words = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div className="m2w">
      <div className="m2w-toolbar card">
        <ProfileSelector
          key={profilesVersion}
          selectedProfile={profile}
          onProfileChange={setProfile}
          onManageClick={onManageProfiles}
          disabled={converting}
        />
        <label className="m2w-name">
          <span className="sr-only">File name</span>
          <input
            className="input"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="File name"
            aria-label="File name for the Word document"
          />
          <span className="m2w-ext">.docx</span>
        </label>
        <div className="m2w-toolbar-actions">
          <input
            ref={fileRef}
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            hidden
            onChange={(e) => {
              loadFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
            <Icon name="folder" />
            Open .md
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setText('')}
            disabled={!text || converting}
          >
            Clear
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={convert}
            disabled={converting || !text.trim()}
          >
            {converting ? <span className="spinner" aria-hidden="true" /> : <Icon name="download" />}
            {converting ? 'Converting…' : 'Download Word'}
          </button>
        </div>
      </div>

      <div className="m2w-panes">
        <div
          className={`m2w-pane card ${dragging ? 'dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            loadFile(e.dataTransfer.files?.[0])
          }}
        >
          <div className="m2w-pane-head">
            <span>Markdown</span>
            <span className="m2w-count">{words.toLocaleString()} words</span>
          </div>
          <textarea
            className="m2w-editor"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste Markdown here, or drop a .md file…"
            spellCheck={false}
            aria-label="Markdown input"
            disabled={converting}
          />
        </div>

        <div className="m2w-pane card">
          <div className="m2w-pane-head">
            <span>Preview</span>
          </div>
          <div className="m2w-preview" tabIndex={0} aria-label="Preview">
            {text.trim() ? (
              <MarkdownView markdown={text} />
            ) : (
              <div className="m2w-empty">
                <Icon name="docText" />
                <p>Nothing to preview yet</p>
                <button type="button" className="btn btn-sm" onClick={() => setText(SAMPLE)}>
                  Insert sample
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
