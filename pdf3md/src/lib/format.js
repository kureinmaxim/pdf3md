export function formatBytes(bytes) {
  if (typeof bytes === 'string') return bytes
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fileKind(file) {
  const name = file.name.toLowerCase()
  if (file.type.includes('pdf') || name.endsWith('.pdf')) return 'pdf'
  if (
    file.type.includes('vnd.openxmlformats-officedocument.wordprocessingml.document') ||
    name.endsWith('.docx')
  )
    return 'docx'
  return null
}

export function markdownFilename(name) {
  const base = (name || 'document').replace(/\.(pdf|docx)$/i, '')
  return `${base}.md`
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  const ok = document.execCommand('copy')
  ta.remove()
  if (!ok) throw new Error('Copy command was rejected')
}

export function relativeTime(timestamp) {
  const time = new Date(timestamp)
  if (Number.isNaN(time.getTime())) return ''
  const diff = Date.now() - time.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return time.toLocaleDateString()
}
