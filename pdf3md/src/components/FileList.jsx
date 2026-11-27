// Cards for the files in the current conversion batch.
import { Icon } from './Icons'
import { formatBytes } from '../lib/format'
import './FileList.css'

const ACTIVE = new Set(['Uploading', 'Processing'])
const DONE = new Set(['Completed', 'Error', 'Skipped'])

function statusLabel(f) {
  switch (f.status) {
    case 'Queued':
      return 'Queued'
    case 'Uploading':
      return 'Uploading…'
    case 'Processing':
      return f.stage || 'Converting…'
    case 'Completed':
      return 'Done'
    case 'Error':
      return f.error || 'Conversion failed'
    case 'Skipped':
      return f.error || 'Skipped'
    default:
      return f.status
  }
}

function FileCard({ file, onOpen, onRetry, onRemove }) {
  const active = ACTIVE.has(file.status)
  const status = file.status.toLowerCase()
  const pages =
    file.totalPages > 0
      ? file.currentPage > 0 && active
        ? `Page ${file.currentPage} of ${file.totalPages}`
        : `${file.totalPages} pages`
      : null

  return (
    <li className={`file-card status-${status}`}>
      <div className={`fc-badge kind-${file.kind}`} aria-hidden="true">
        {file.kind === 'pdf' ? 'PDF' : 'DOCX'}
      </div>

      <div className="fc-main">
        <div className="fc-row">
          <span className="fc-name" title={file.name}>
            {file.name}
          </span>
          <span className="fc-size">{formatBytes(file.size)}</span>
        </div>

        <div className="fc-row fc-status-row">
          <span className={`fc-status ${status}`} role={file.status === 'Error' ? 'alert' : undefined}>
            {active && <span className="spinner" aria-hidden="true" />}
            {file.status === 'Completed' && <Icon name="check" />}
            {file.status === 'Error' && <Icon name="alert" />}
            <span className="fc-status-text">{statusLabel(file)}</span>
          </span>
          {pages && <span className="fc-pages">{pages}</span>}
          {active && <span className="fc-pct">{Math.round(file.progress || 0)}%</span>}
        </div>

        {(active || file.status === 'Queued') && (
          <div
            className="fc-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(file.progress || 0)}
            aria-label={`${file.name} progress`}
          >
            <div className="fc-progress-fill" style={{ width: `${file.progress || 0}%` }} />
          </div>
        )}
      </div>

      <div className="fc-actions">
        {file.status === 'Completed' && file.markdown != null && (
          <button type="button" className="btn btn-sm" onClick={() => onOpen(file)}>
            Open
          </button>
        )}
        {file.status === 'Error' && (
          <button type="button" className="btn btn-sm" onClick={() => onRetry(file)}>
            <Icon name="retry" />
            Retry
          </button>
        )}
        {DONE.has(file.status) && (
          <button
            type="button"
            className="icon-btn sm"
            onClick={() => onRemove(file)}
            aria-label={`Remove ${file.name} from the list`}
            title="Remove"
          >
            <Icon name="x" />
          </button>
        )}
      </div>
    </li>
  )
}

export default function FileList({ files, onOpen, onRetry, onRemove, onClear }) {
  if (!files.length) return null
  const done = files.filter((f) => f.status === 'Completed').length
  const failed = files.filter((f) => f.status === 'Error').length
  const allDone = files.every((f) => DONE.has(f.status))

  return (
    <section className="file-list" aria-label="Files">
      <div className="fl-header">
        <h2>
          Files <span className="fl-count">{done}/{files.length} done{failed ? ` · ${failed} failed` : ''}</span>
        </h2>
        {allDone && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
            Clear list
          </button>
        )}
      </div>
      <ul className="fl-items">
        {files.map((f) => (
          <FileCard key={f.id} file={f} onOpen={onOpen} onRetry={onRetry} onRemove={onRemove} />
        ))}
      </ul>
    </section>
  )
}
