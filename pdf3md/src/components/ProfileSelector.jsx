// ProfileSelector - dropdown for choosing a DOCX formatting profile
import { useEffect, useState } from 'react'
import { fetchProfiles } from '../api/profileApi'
import { Icon } from './Icons'
import './ProfileSelector.css'

function ProfileSelector({ selectedProfile, onProfileChange, onManageClick, disabled }) {
  const [profiles, setProfiles] = useState(null) // null = loading
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchProfiles()
      .then((data) => {
        if (cancelled) return
        setProfiles(data)
        setError(null)
        const names = data.map((p) => p.name)
        if (data.length > 0 && !names.includes(selectedProfile)) {
          const fallback = data.find((p) => p.name.toLowerCase() === 'default') || data[0]
          onProfileChange(fallback.name)
        }
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load profiles:', err)
        setError('Could not load profiles')
        setProfiles([])
        if (!selectedProfile) onProfileChange('default')
      })
    return () => {
      cancelled = true
    }
    // Load once per mount / retry; selection changes must not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])

  if (profiles === null) {
    return (
      <div className="profile-selector">
        <span className="ps-muted">
          <span className="spinner" aria-hidden="true" /> Loading profiles…
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-selector">
        <span className="ps-error">{error}</span>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            setProfiles(null)
            setAttempt((a) => a + 1)
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="profile-selector">
      <label className="ps-label" htmlFor="profile-select">
        Profile
      </label>
      <select
        id="profile-select"
        className="select"
        value={selectedProfile || ''}
        onChange={(e) => onProfileChange(e.target.value)}
        disabled={disabled}
      >
        {profiles.map((p) => (
          <option key={p.name} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="icon-btn sm"
        onClick={onManageClick}
        disabled={disabled}
        title="Manage profiles"
        aria-label="Manage profiles"
      >
        <Icon name="sliders" />
      </button>
    </div>
  )
}

export default ProfileSelector
