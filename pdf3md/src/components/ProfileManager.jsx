// ProfileManager component - modal for managing profiles (list, create, edit, delete)
import { useState, useEffect } from 'react';
import { fetchProfiles, fetchProfile, createProfile, updateProfile, deleteProfile, duplicateProfile, fetchProfileTemplate } from '../api/profileApi';
import ProfileEditor from './ProfileEditor';
import './ProfileManager.css';

function ProfileManager({ isOpen, onClose, onProfilesChanged }) {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingProfile, setEditingProfile] = useState(null);
    const [editingOriginalName, setEditingOriginalName] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadProfiles();
        }
    }, [isOpen]);

    const loadProfiles = async () => {
        try {
            setLoading(true);
            const data = await fetchProfiles();
            setProfiles(data);
            setError(null);
        } catch (err) {
            console.error('Failed to load profiles:', err);
            setError('Failed to load profiles');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (profileName) => {
        try {
            setActionLoading(profileName);
            const profile = await fetchProfile(profileName);
            setEditingProfile(profile);
            setEditingOriginalName(profileName);
        } catch (err) {
            console.error('Failed to load profile:', err);
            alert(`Failed to load profile: ${err.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreate = async () => {
        try {
            setIsCreating(true);
            const template = await fetchProfileTemplate('New Profile', 'Custom formatting profile');
            setEditingProfile(template);
            setEditingOriginalName(null);
        } catch (err) {
            console.error('Failed to create template:', err);
            alert(`Failed to create profile template: ${err.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDuplicate = async (profileName) => {
        const newName = prompt(`Enter name for the copy of "${profileName}":`);
        if (!newName || !newName.trim()) return;

        try {
            setActionLoading(profileName);
            await duplicateProfile(profileName, newName.trim());
            await loadProfiles();
            onProfilesChanged?.();
        } catch (err) {
            console.error('Failed to duplicate profile:', err);
            alert(`Failed to duplicate profile: ${err.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (profileName) => {
        if (profileName.toLowerCase() === 'default') {
            alert('Cannot delete the default profile');
            return;
        }

        if (!confirm(`Are you sure you want to delete "${profileName}"?`)) return;

        try {
            setActionLoading(profileName);
            await deleteProfile(profileName);
            await loadProfiles();
            onProfilesChanged?.();
        } catch (err) {
            console.error('Failed to delete profile:', err);
            alert(`Failed to delete profile: ${err.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleSave = async (profile) => {
        try {
            if (editingOriginalName) {
                const originalName = editingOriginalName;
                const nextName = profile.name?.trim() || originalName;

                if (nextName.toLowerCase() !== originalName.toLowerCase()) {
                    await createProfile(profile);
                    await deleteProfile(originalName);
                } else {
                    await updateProfile(originalName, profile);
                }
            } else {
                await createProfile(profile);
            }
            setEditingProfile(null);
            setEditingOriginalName(null);
            await loadProfiles();
            onProfilesChanged?.();
        } catch (err) {
            console.error('Failed to save profile:', err);
            alert(`Failed to save profile: ${err.message}`);
        }
    };

    const handleEditorClose = () => {
        setEditingProfile(null);
        setEditingOriginalName(null);
    };

    if (!isOpen) return null;

    // Show editor if editing
    if (editingProfile) {
        return (
            <ProfileEditor
                profile={editingProfile}
                onSave={handleSave}
                onCancel={handleEditorClose}
            />
        );
    }

    return (
        <div className="profile-manager-overlay" onClick={onClose}>
            <div className="profile-manager-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pm-header">
                    <h2>Manage Profiles</h2>
                    <button className="pm-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="pm-content">
                    {loading ? (
                        <div className="pm-loading">Loading profiles...</div>
                    ) : error ? (
                        <div className="pm-error">
                            <span>{error}</span>
                            <button onClick={loadProfiles}>Retry</button>
                        </div>
                    ) : (
                        <>
                            <div className="pm-toolbar">
                                <button
                                    className="pm-create-btn"
                                    onClick={handleCreate}
                                    disabled={isCreating}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    {isCreating ? 'Creating...' : 'New Profile'}
                                </button>
                            </div>

                            <div className="pm-list">
                                {profiles.map(profile => (
                                    <div key={profile.name} className="pm-item">
                                        <div className="pm-item-info">
                                            <span className="pm-item-name">
                                                {profile.name}
                                                {profile.name.toLowerCase() === 'default' && (
                                                    <span className="pm-badge">Default</span>
                                                )}
                                            </span>
                                            <span className="pm-item-desc">{profile.description}</span>
                                        </div>
                                        <div className="pm-item-actions">
                                            <button
                                                className="pm-action-btn edit"
                                                onClick={() => handleEdit(profile.name)}
                                                disabled={actionLoading === profile.name || profile.name.toLowerCase() === 'default'}
                                                title={profile.name.toLowerCase() === 'default' ? "Cannot edit default profile" : "Edit"}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="pm-action-btn duplicate"
                                                onClick={() => handleDuplicate(profile.name)}
                                                disabled={actionLoading === profile.name}
                                                title="Duplicate"
                                            >
                                                Copy
                                            </button>
                                            {profile.name.toLowerCase() !== 'default' && (
                                                <button
                                                    className="pm-action-btn delete"
                                                    onClick={() => handleDelete(profile.name)}
                                                    disabled={actionLoading === profile.name}
                                                    title="Delete"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfileManager;
