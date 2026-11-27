// Conversion history panel (column on wide screens, drawer on narrow ones).
import { useMemo, useState } from 'react'
import { Icon } from './Icons'
import { formatBytes, relativeTime } from '../lib/format'
import './Sidebar.css'

const GROUPS = [
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['week', 'This week'],
  ['older', 'Older'],
]

function groupByDate(items) {
  const groups = { today: [], yesterday: [], week: [], older: [] }
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const day = 24 * 60 * 60 * 1000
  for (const item of items) {
    const d = new Date(item.timestamp)
    const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    if (itemDay === today) groups.today.push(item)
    else if (itemDay === today - day) groups.yesterday.push(item)
    else if (itemDay >= today - 7 * day) groups.week.push(item)
    else groups.older.push(item)
  }
  return groups
}

export default function Sidebar({
  isOpen,
  overlay,
  history,
  selectedId,
  onSelect,
  onDelete,
  onClear,
  onClose,
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return history
    return history.filter(
      (item) =>
        item.filename?.toLowerCase().includes(q) || item.markdown?.toLowerCase().includes(q)
    )
  }, [query, history])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  if (!isOpen) return null

  return (
    <>
      {overlay && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`sidebar ${overlay ? 'overlay' : ''}`}
        aria-label="Conversion history"
        onKeyDown={(e) => {
          if (overlay && e.key === 'Escape') onClose()
        }}
      >
        <div className="sb-header">
          <h2>History</h2>
          <div className="sb-header-actions">
            {history.length > 0 && (
              <button
                type="button"
                className="icon-btn sm"
                onClick={onClear}
                aria-label="Clear all history"
                title="Clear all history"
              >
                <Icon name="trash" />
              </button>
            )}
            <button
              type="button"
              className="icon-btn sm"
              onClick={onClose}
              aria-label="Hide history"
              title="Hide history"
            >
              <Icon name="x" />
            </button>
          </div>
        </div>

        {history.length > 0 && (
          <div className="sb-search">
            <Icon name="search" className="sb-search-icon" />
            <input
              type="search"
              className="input"
              placeholder="Search history"
              aria-label="Search history"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}

        <div className="sb-list">
          {filtered.length === 0 ? (
            <div className="sb-empty">
              <Icon name={query ? 'search' : 'history'} />
              <p>{query ? 'Nothing found' : 'No conversions yet'}</p>
              <span>{query ? 'Try another search term' : 'Converted files will appear here'}</span>
            </div>
          ) : (
            GROUPS.map(([key, title]) =>
              grouped[key].length ? (
                <div className="sb-group" key={key}>
                  <div className="sb-group-title">{title}</div>
                  <ul>
                    {grouped[key].map((item) => (
                      <li key={item.id} className={`sb-item ${selectedId === item.id ? 'selected' : ''}`}>
                        <button
                          type="button"
                          className="sb-item-btn"
                          onClick={() => onSelect(item)}
                          aria-current={selectedId === item.id ? 'true' : undefined}
                        >
                          <span className="sb-item-name" title={item.filename}>
                            {item.filename}
                          </span>
                          <span className="sb-item-meta">
                            {[
                              relativeTime(item.timestamp),
                              item.fileSize ? formatBytes(item.fileSize) : null,
                              item.pageCount ? `${item.pageCount} p.` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                          <span className="sb-item-preview">
                            {(item.markdown || '').replace(/[#*_`>|-]+/g, ' ').slice(0, 110)}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="icon-btn sm sb-item-del"
                          onClick={() => onDelete(item)}
                          aria-label={`Delete ${item.filename} from history`}
                          title="Delete"
                        >
                          <Icon name="trash" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            )
          )}
        </div>
      </aside>
    </>
  )
}
