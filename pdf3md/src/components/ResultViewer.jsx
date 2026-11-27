// Shows a converted Markdown document: preview / raw / split + copy & download.
import { useState } from 'react'
import { Icon } from './Icons'
import MarkdownView from './MarkdownView'
import { toast } from './Toaster'
import { useStoredState } from '../lib/hooks'
import { copyText, downloadBlob, formatBytes, markdownFilename } from '../lib/format'
import './ResultViewer.css'

const VIEWS = [
  { id: 'preview', label: 'Preview', icon: 'eye' },
  { id: 'raw', label: 'Markdown', icon: 'code' },
  { id: 'split', label: 'Split', icon: 'columns' },
]

export default function ResultViewer({ result, onClose }) {
  const [view, setView] = useStoredState('pdf3md-result-view', 'preview', (v) =>
    VIEWS.some((x) => x.id === v)
  )
  const [copied, setCopied] = useState(false)
  const { markdown = '', filename, pageCount, fileSize } = result

  const handleCopy = async () => {
    try {
      await copyText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (err) {
      toast(`Could not copy: ${err.message}`, 'error')
    }
  }

  const handleDownload = () => {
    downloadBlob(
      new Blob([markdown], { type: 'text/markdown;charset=utf-8' }),
      markdownFilename(filename)
    )
  }

  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0

  return (
    <section className="result card" aria-label="Conversion result">
      <header className="result-header">
        <div className="result-title">
          <span className="result-icon" aria-hidden="true">
            <Icon name="docText" />
          </span>
          <div className="result-title-text">
            <h2 title={filename}>{filename || 'Converted document'}</h2>
            <p className="result-meta">
              {[
                fileSize ? formatBytes(fileSize) : null,
                pageCount ? `${pageCount} pages` : null,
                `${words.toLocaleString()} words`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        <div className="result-actions">
          <div className="segmented sm" role="radiogroup" aria-label="View mode">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={view === v.id}
                className={`seg-btn ${view === v.id ? 'active' : ''} ${v.id === 'split' ? 'hide-narrow' : ''}`}
                onClick={() => setView(v.id)}
                title={v.label}
              >
                <Icon name={v.icon} />
                <span className="seg-label">{v.label}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-sm" onClick={handleCopy}>
            <Icon name={copied ? 'check' : 'copy'} />
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={handleDownload}>
            <Icon name="download" />
            .md
          </button>
          {onClose && (
            <button
              type="button"
              className="icon-btn sm"
              onClick={onClose}
              aria-label="Close result"
              title="Close"
            >
              <Icon name="x" />
            </button>
          )}
        </div>
      </header>

      <div className={`result-body view-${view}`}>
        {(view === 'raw' || view === 'split') && (
          <pre className="result-raw" tabIndex={0} aria-label="Markdown source">
            {markdown}
          </pre>
        )}
        {(view === 'preview' || view === 'split') && (
          <div className="result-preview" tabIndex={0} aria-label="Rendered preview">
            <MarkdownView markdown={markdown} />
          </div>
        )}
      </div>
    </section>
  )
}
