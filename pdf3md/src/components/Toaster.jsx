// Minimal toast notifications: call toast('text', 'success' | 'error' | 'info')
// from anywhere; <Toaster /> renders them.
/* eslint-disable react-refresh/only-export-components */
import { useSyncExternalStore } from 'react'
import { Icon } from './Icons'
import './Toaster.css'

let toasts = []
let nextId = 1
const listeners = new Set()

function emit() {
  for (const l of listeners) l()
}

export function dismissToast(id) {
  toasts = toasts.filter(t => t.id !== id)
  emit()
}

export function toast(message, type = 'info', { duration = 4000, action } = {}) {
  const id = nextId++
  toasts = [...toasts, { id, message, type, action }].slice(-4)
  emit()
  if (duration > 0) setTimeout(() => dismissToast(id), duration)
  return id
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const iconFor = { success: 'check', error: 'alert', info: 'info' }

export default function Toaster() {
  const items = useSyncExternalStore(subscribe, () => toasts)
  return (
    <div className="toaster" role="region" aria-label="Notifications">
      {items.map(t => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          role={t.type === 'error' ? 'alert' : 'status'}
        >
          <Icon name={iconFor[t.type] || 'info'} className="toast-icon" />
          <span className="toast-msg">{t.message}</span>
          {t.action && (
            <button
              type="button"
              className="btn btn-sm btn-ghost toast-action"
              onClick={() => {
                t.action.onClick()
                dismissToast(t.id)
              }}
            >
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            className="icon-btn sm"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss notification"
          >
            <Icon name="x" />
          </button>
        </div>
      ))}
    </div>
  )
}
