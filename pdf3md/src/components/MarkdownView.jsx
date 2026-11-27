// Renders Markdown as sanitized HTML (marked + DOMPurify).
import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import './MarkdownView.css'

marked.setOptions({ gfm: true, breaks: false })

// Open links from converted documents in a new tab, safely.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export default function MarkdownView({ markdown, className = '' }) {
  const html = useMemo(() => {
    if (!markdown) return ''
    const raw = marked.parse(markdown, { async: false })
    return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
  }, [markdown])

  return (
    <div
      className={`md-view ${className}`}
      // Content is sanitized by DOMPurify above.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
