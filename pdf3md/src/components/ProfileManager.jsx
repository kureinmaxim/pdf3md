// ProfileManager - modal for listing, creating, editing, duplicating and deleting profiles.
// Rendered only while open (the parent mounts/unmounts it).
import { useCallback, useEffect, useState } from 'react'
import {
  fetchProfiles,
  fetchProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  duplicateProfile,
  fetchProfileTemplate,
} from '../api/profileApi'
import ProfileEditor from './ProfileEditor'
import { Icon } from './Icons'
import { toast } from './Toaster'
import './ProfileManager.css'

const isDefault = (name) => name.toLowerCase() === 'default'

function ProfileManager({ onClose, onProfilesChanged }) {
  const [profiles, setProfiles] = useState(null) // null = loading
  const [error, setError] = useState(null)
  const [editingProfile, setEditingProfile] = useState(null)
  const [editingOriginalName, setEditingOriginalName] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const loadProfiles = useCallback(async () => {
    try {
      const data = await fetchProfiles()
      setProfiles(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load profiles:', err)
      setProfiles([])
      setError('Could not load profiles')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchProfiles()
      .then((data) => {
        if (!cancelled) setProfiles(data)
      })
      .catch((err) => {
        console.error('Failed to load profiles:', err)
        if (!cancelled) {
          setProfiles([])
          setError('Could not load profiles')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (editingProfile) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editingProfile, onClose])

  const changed = async () => {
    await loadProfiles()
    onProfilesChanged?.()
  }

  const handleEdit = async (name) => {
    try {
      setActionLoading(name)
      setEditingProfile(await fetchProfile(name))
      setEditingOriginalName(name)
    } catch (err) {
      toast(`Could not load profile: ${err.message}`, 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreate = async () => {
    try {
      setIsCreating(true)
      setEditingProfile(await fetchProfileTemplate('New Profile', 'Custom formatting profile'))
      setEditingOriginalName(null)
    } catch (err) {
      toast(`Could not create profile template: ${err.message}`, 'error')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDuplicate = async (name) => {
    const names = new Set((profiles || []).map((p) => p.name.toLowerCase()))
    let newName = `${name} copy`
    for (let i = 2; names.has(newName.toLowerCase()); i++) newName = `${name} copy ${i}`
    try {
      setActionLoading(name)
      await duplicateProfile(name, newName)
      await changed()
      toast(`Created “${newName}”`, 'success')
    } catch (err) {
      toast(`Could not duplicate profile: ${err.message}`, 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (name) => {
    setConfirmDelete(null)
    try {
      setActionLoading(name)
      await deleteProfile(name)
      await changed()
      toast(`Deleted “${name}”`, 'success')
    } catch (err) {
      toast(`Could not delete profile: ${err.message}`, 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSave = async (profile) => {
    try {
      if (editingOriginalName) {
        const nextName = profile.name?.trim() || editingOriginalName
        if (nextName.toLowerCase() !== editingOriginalName.toLowerCase()) {
          await createProfile(profile)
          await deleteProfile(editingOriginalName)
        } else {
          await updateProfile(editingOriginalName, profile)
        }
      } else {
        await createProfile(profile)
      }
      setEditingProfile(null)
      setEditingOriginalName(null)
      await changed()
      toast('Profile saved', 'success')
    } catch (err) {
      toast(`Could not save profile: ${err.message}`, 'error')
    }
  }

  if (editingProfile) {
    return (
      <ProfileEditor
        profile={editingProfile}
        onSave={handleSave}
        onCancel={() => {
          setEditingProfile(null)
          setEditingOriginalName(null)
        }}
      />
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal pm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="pm-title">Formatting profiles</h2>
          <button type="button" className="icon-btn sm" onClick={onClose} aria-label="Close" autoFocus>
            <Icon name="x" />
          </button>
        </div>

        <div className="modal-body">
          {profiles === null ? (
            <div className="pm-state">
              <span className="spinner" aria-hidden="true" /> Loading profiles…
            </div>
          ) : error ? (
            <div className="pm-state pm-error">
              <Icon name="alert" />
              <span>{error}</span>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setProfiles(null)
                  setError(null)
                  loadProfiles()
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <ul className="pm-list">
              {profiles.map((p) => {
                const busy = actionLoading === p.name
                const def = isDefault(p.name)
                return (
                  <li key={p.name} className="pm-item">
                    <div className="pm-item-info">
                      <span className="pm-item-name">
                        {p.name}
                        {def && <span className="pm-badge">Default</span>}
                      </span>
                      {p.description && <span className="pm-item-desc">{p.description}</span>}
                    </div>
                    {confirmDelete === p.name ? (
                      <div className="pm-item-actions">
                        <span className="pm-confirm">Delete?</span>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(p.name)}>
                          Delete
                        </button>
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmDelete(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="pm-item-actions">
                        {!def && (
                          <button type="button" className="btn btn-sm" onClick={() => handleEdit(p.name)} disabled={busy}>
                            Edit
                          </button>
                        )}
                        <button type="button" className="btn btn-sm" onClick={() => handleDuplicate(p.name)} disabled={busy}>
                          Duplicate
                        </button>
                        {!def && (
                          <button
                            type="button"
                            className="icon-btn sm pm-del"
                            onClick={() => setConfirmDelete(p.name)}
                            disabled={busy}
                            aria-label={`Delete ${p.name}`}
                            title="Delete"
                          >
                            <Icon name="trash" />
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose}>
            Done
          </button>
          <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={isCreating}>
            <Icon name="plus" />
            {isCreating ? 'Creating…' : 'New profile'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileManager
