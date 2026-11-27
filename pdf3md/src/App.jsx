// src/App.jsx
import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import DropZone from './components/DropZone'
import FileList from './components/FileList'
import ResultViewer from './components/ResultViewer'
import MarkdownToWord from './components/MarkdownToWord'
import ProfileManager from './components/ProfileManager'
import Toaster, { toast } from './components/Toaster'
import { Icon } from './components/Icons'
import { getBackendUrl } from './api/profileApi'
import { fileKind } from './lib/format'
import { readStored, useMediaQuery, useStoredState, useTheme } from './lib/hooks'
import './App.css'

const MODES = [
  { id: 'pdf', label: 'PDF → Markdown', short: 'PDF → MD' },
  { id: 'word', label: 'Word → Markdown', short: 'Word → MD' },
  { id: 'md-to-word', label: 'Markdown → Word', short: 'MD → Word' },
]

const THEME_OPTIONS = [
  { id: 'system', label: 'System theme', icon: 'monitor' },
  { id: 'light', label: 'Light theme', icon: 'sun' },
  { id: 'dark', label: 'Dark theme', icon: 'moon' },
]

const HISTORY_KEY = 'pdf3md-history'
const HISTORY_LIMIT = 50
const POLL_MS = 500
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function loadHistory() {
  const h = readStored(HISTORY_KEY, [])
  return Array.isArray(h) ? h : []
}

function App() {
  const { theme, setTheme } = useTheme()
  const narrow = useMediaQuery('(max-width: 900px)')

  const [mode, setMode] = useStoredState('pdf3md-mode', 'pdf', (v) =>
    MODES.some((m) => m.id === v)
  )
  const [history, setHistory] = useState(loadHistory)
  // History is a column on wide screens (open by default) and a drawer on narrow ones (closed by default)
  const [historyColumnOpen, setHistoryColumnOpen] = useState(true)
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false)
  const historyOpen = narrow ? historyDrawerOpen : historyColumnOpen
  const setHistoryOpen = narrow ? setHistoryDrawerOpen : setHistoryColumnOpen
  const [result, setResult] = useState(null) // { id?, filename, markdown, fileSize, pageCount }
  const [files, setFiles] = useState([]) // batch of file cards
  const [dragging, setDragging] = useState(false)
  const [versionInfo, setVersionInfo] = useState(null)
  const [showAbout, setShowAbout] = useState(false)
  const [showProfiles, setShowProfiles] = useState(false)
  const [profilesVersion, setProfilesVersion] = useState(0)

  const queueRef = useRef([]) // [{ id, file }]
  const runningRef = useRef(false)
  const dragDepth = useRef(0)
  const nextFileId = useRef(1)

  const isFileMode = mode !== 'md-to-word'
  const busy = files.some((f) => f.status === 'Uploading' || f.status === 'Processing')

  // ---------- persistence ----------
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    } catch (err) {
      console.error('Could not save history:', err)
    }
  }, [history])

  useEffect(() => {
    let cancelled = false
    fetch(`${getBackendUrl()}/version`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setVersionInfo(data)
      })
      .catch((err) => console.warn('Failed to load version info:', err))
    return () => {
      cancelled = true
    }
  }, [])

  // ---------- conversion queue ----------
  const patchFile = useCallback((id, patch) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }, [])

  const addToHistory = useCallback((data) => {
    const item = {
      id: Date.now() + Math.random(),
      filename: data.filename,
      markdown: data.markdown,
      fileSize: data.fileSize,
      pageCount: data.pageCount,
      timestamp: data.timestamp || new Date().toISOString(),
    }
    setHistory((prev) => [item, ...prev].slice(0, HISTORY_LIMIT))
    return item
  }, [])

  const finishSuccess = useCallback(
    (id, data) => {
      const item = addToHistory(data)
      patchFile(id, {
        status: 'Completed',
        progress: 100,
        stage: 'Done',
        markdown: data.markdown,
        historyId: item.id,
        totalPages: data.pageCount || 0,
      })
      setResult(item)
    },
    [addToHistory, patchFile]
  )

  const convertPdf = useCallback(
    async (id, file) => {
      const form = new FormData()
      form.append('pdf', file)
      const res = await fetch(`${getBackendUrl()}/convert`, { method: 'POST', body: form })
      if (!res.ok) throw new Error(`Upload failed (HTTP ${res.status})`)
      const data = await res.json()
      if (!data.success || !data.conversion_id) throw new Error(data.error || 'Conversion did not start')

      patchFile(id, { status: 'Processing', stage: 'Waiting for converter…' })
      for (;;) {
        await sleep(POLL_MS)
        const pr = await fetch(`${getBackendUrl()}/progress/${data.conversion_id}`)
        if (!pr.ok) throw new Error(`Progress check failed (HTTP ${pr.status})`)
        const p = await pr.json()
        if (p.status === 'completed' && p.result) {
          finishSuccess(id, p.result)
          return
        }
        if (p.status === 'error') throw new Error(p.error || 'Conversion failed')
        patchFile(id, {
          progress: p.progress || 0,
          stage: p.stage || 'Converting…',
          totalPages: p.total_pages || 0,
          currentPage: p.current_page || 0,
        })
      }
    },
    [finishSuccess, patchFile]
  )

  const convertDocx = useCallback(
    async (id, file) => {
      const form = new FormData()
      form.append('document', file)
      patchFile(id, { progress: 30 })
      const res = await fetch(`${getBackendUrl()}/convert-word-to-markdown`, {
        method: 'POST',
        body: form,
      })
      let data = null
      try {
        data = await res.json()
      } catch {
        /* non-JSON error page */
      }
      if (!res.ok || !data?.success || data.markdown == null) {
        throw new Error(data?.error || `Conversion failed (HTTP ${res.status})`)
      }
      finishSuccess(id, data)
    },
    [finishSuccess, patchFile]
  )

  const pump = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    try {
      while (queueRef.current.length) {
        const { id, file } = queueRef.current.shift()
        const kind = fileKind(file)
        patchFile(id, { status: 'Uploading', progress: 0, stage: 'Uploading…', error: null })
        try {
          if (kind === 'pdf') await convertPdf(id, file)
          else await convertDocx(id, file)
        } catch (err) {
          console.error(`Conversion failed for ${file.name}:`, err)
          patchFile(id, { status: 'Error', error: err.message, progress: 0 })
          toast(`${file.name}: ${err.message}`, 'error', { duration: 7000 })
        }
      }
    } finally {
      runningRef.current = false
    }
  }, [convertDocx, convertPdf, patchFile])

  const addFiles = useCallback(
    (fileList) => {
      const all = Array.from(fileList)
      const accepted = all.filter((f) => fileKind(f))
      const rejected = all.length - accepted.length
      if (rejected) {
        toast(
          rejected === all.length
            ? 'Only PDF and Word (.docx) files can be converted'
            : `${rejected} file(s) skipped: only PDF and .docx are supported`,
          'error'
        )
      }
      if (!accepted.length) return

      const entries = accepted.map((file) => ({
        id: nextFileId.current++,
        name: file.name,
        size: file.size,
        kind: fileKind(file),
        status: 'Queued',
        progress: 0,
        stage: 'Queued',
        totalPages: 0,
        currentPage: 0,
        markdown: null,
        error: null,
        file,
      }))
      setFiles((prev) => {
        const prevDone = prev.every((f) => ['Completed', 'Error', 'Skipped'].includes(f.status))
        return prevDone ? entries : [...prev, ...entries]
      })
      queueRef.current.push(...entries.map(({ id, file }) => ({ id, file })))
      pump()
    },
    [pump]
  )

  const retryFile = (f) => {
    patchFile(f.id, { status: 'Queued', stage: 'Queued', progress: 0, error: null })
    queueRef.current.unshift({ id: f.id, file: f.file })
    pump()
  }

  const openFileResult = (f) => {
    const item = history.find((h) => h.id === f.historyId)
    setResult(item || { filename: f.name, markdown: f.markdown, fileSize: f.size })
  }

  // ---------- page-wide drag & drop (file modes) ----------
  const dragHandlers = isFileMode
    ? {
        onDragEnter: (e) => {
          if (!e.dataTransfer?.types?.includes('Files')) return
          e.preventDefault()
          dragDepth.current += 1
          setDragging(true)
        },
        onDragOver: (e) => {
          if (e.dataTransfer?.types?.includes('Files')) e.preventDefault()
        },
        onDragLeave: () => {
          dragDepth.current = Math.max(0, dragDepth.current - 1)
          if (dragDepth.current === 0) setDragging(false)
        },
        onDrop: (e) => {
          e.preventDefault()
          dragDepth.current = 0
          setDragging(false)
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
        },
      }
    : {}

  // ---------- history ----------
  const selectHistory = (item) => {
    setResult(item)
    if (narrow) setHistoryOpen(false)
  }

  const deleteHistory = (item) => {
    setHistory((prev) => prev.filter((h) => h.id !== item.id))
    if (result?.id === item.id) setResult(null)
    toast(`Removed “${item.filename}” from history`, 'info', {
      action: {
        label: 'Undo',
        onClick: () =>
          setHistory((prev) =>
            [...prev, item].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          ),
      },
    })
  }

  const clearHistory = () => {
    const saved = history
    setHistory([])
    setResult(null)
    toast('History cleared', 'info', {
      duration: 6000,
      action: { label: 'Undo', onClick: () => setHistory(saved) },
    })
  }

  // ---------- mode tabs keyboard navigation ----------
  const onTabsKeyDown = (e) => {
    const i = MODES.findIndex((m) => m.id === mode)
    let next = null
    if (e.key === 'ArrowRight') next = (i + 1) % MODES.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + MODES.length) % MODES.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = MODES.length - 1
    if (next === null) return
    e.preventDefault()
    setMode(MODES[next].id)
    document.getElementById(`tab-${MODES[next].id}`)?.focus()
  }

  const cycleTheme = () => {
    const i = THEME_OPTIONS.findIndex((t) => t.id === theme)
    setTheme(THEME_OPTIONS[(i + 1) % THEME_OPTIONS.length].id)
  }
  const themeOpt = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0]

  const dz =
    mode === 'word'
      ? {
          accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          title: 'Drop Word documents here',
          hint: 'Converts .docx files to clean Markdown. PDFs work too.',
        }
      : {
          accept: '.pdf,application/pdf',
          title: 'Drop PDF files here',
          hint: 'Converts PDFs to Markdown with headings, lists and tables. Word .docx works too.',
        }

  const showHistory = isFileMode && historyOpen

  return (
    <div className={`app ${dragging ? 'is-dragging' : ''}`} {...dragHandlers}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="app-header">
        <div className="brand">
          {isFileMode && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => setHistoryOpen((o) => !o)}
              aria-label={historyOpen ? 'Hide history' : 'Show history'}
              aria-expanded={historyOpen}
              title="History"
            >
              <Icon name="history" />
            </button>
          )}
          <img className="brand-logo" src="/favicon.svg" alt="" width="30" height="30" />
          <span className="brand-name">PDF3MD</span>
        </div>

        <nav
          className="segmented mode-tabs"
          role="tablist"
          aria-label="Conversion mode"
          onKeyDown={onTabsKeyDown}
        >
          {MODES.map((m) => (
            <button
              key={m.id}
              id={`tab-${m.id}`}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              aria-controls="main"
              tabIndex={mode === m.id ? 0 : -1}
              className={`seg-btn ${mode === m.id ? 'active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              <span className="tab-long">{m.label}</span>
              <span className="tab-short">{m.short}</span>
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={cycleTheme}
            aria-label={`${themeOpt.label}. Click to change.`}
            title={`${themeOpt.label} (click to change)`}
          >
            <Icon name={themeOpt.icon} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowAbout(true)}
            aria-label="About PDF3MD"
            title="About"
          >
            <Icon name="info" />
          </button>
        </div>
      </header>

      <div className="app-body">
        {isFileMode && (
          <Sidebar
            isOpen={showHistory}
            overlay={narrow}
            history={history}
            selectedId={result?.id}
            onSelect={selectHistory}
            onDelete={deleteHistory}
            onClear={clearHistory}
            onClose={() => setHistoryOpen(false)}
          />
        )}

        <main id="main" className="main" role="tabpanel" aria-labelledby={`tab-${mode}`} tabIndex={-1}>
          {isFileMode ? (
            <div className={`file-mode ${result ? 'has-result' : ''}`}>
              <DropZone
                key={mode}
                {...dz}
                compact={Boolean(result) || files.length > 0}
                dragging={dragging}
                busy={busy}
                onFiles={addFiles}
              />
              <FileList
                files={files}
                onOpen={openFileResult}
                onRetry={retryFile}
                onRemove={(f) => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                onClear={() => setFiles([])}
              />
              {result ? (
                <ResultViewer key={result.id ?? result.filename} result={result} onClose={() => setResult(null)} />
              ) : (
                files.length === 0 && (
                  <ul className="features" aria-label="Features">
                    <li>
                      <strong>Private</strong>
                      <span>Files are converted on this computer.</span>
                    </li>
                    <li>
                      <strong>Batch</strong>
                      <span>Drop several files at once; they are queued.</span>
                    </li>
                    <li>
                      <strong>History</strong>
                      <span>Recent results stay available in the sidebar.</span>
                    </li>
                  </ul>
                )
              )}
            </div>
          ) : (
            <MarkdownToWord
              profilesVersion={profilesVersion}
              onManageProfiles={() => setShowProfiles(true)}
            />
          )}
        </main>
      </div>

      {versionInfo && (
        <footer className="app-footer">
          PDF3MD {versionInfo.version}
          {versionInfo.release_date && <> · {versionInfo.release_date}</>}
          {versionInfo.developer && <> · {versionInfo.developer}</>}
        </footer>
      )}

      {dragging && (
        <div className="drop-overlay" aria-hidden="true">
          <div className="drop-overlay-inner">
            <Icon name="upload" />
            Drop to convert
          </div>
        </div>
      )}

      {showAbout && (
        <AboutDialog versionInfo={versionInfo} onClose={() => setShowAbout(false)} />
      )}

      {showProfiles && (
        <ProfileManager
          onClose={() => setShowProfiles(false)}
          onProfilesChanged={() => setProfilesVersion((v) => v + 1)}
        />
      )}

      <Toaster />
    </div>
  )
}

function AboutDialog({ versionInfo, onClose }) {
  const dev = !import.meta.env.PROD
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const rows = versionInfo
    ? [
        ['Version', versionInfo.version],
        ['Release date', versionInfo.release_date],
        ['Developer', versionInfo.developer],
        ...(dev
          ? [
              ['Git commit', `${versionInfo.git_commit || 'unknown'}${versionInfo.git_dirty ? ' (dirty)' : ''}`],
              ['Git branch', versionInfo.git_branch || 'unknown'],
              ['Build time', versionInfo.generated_at],
            ]
          : []),
      ].filter(([, v]) => v)
    : []

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal about-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="about-hero">
          <img src="/favicon.svg" alt="" width="64" height="64" />
          <h2 id="about-title">PDF3MD</h2>
          <p>PDF and Word to Markdown, Markdown to Word.</p>
        </div>
        <dl className="about-rows">
          {rows.length ? (
            rows.map(([k, v]) => (
              <div key={k} className="about-row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))
          ) : (
            <div className="about-row">
              <dt>Version</dt>
              <dd>unavailable (backend not reachable)</dd>
            </div>
          )}
        </dl>
        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose} autoFocus>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
