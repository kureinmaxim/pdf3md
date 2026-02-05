// ProfileManager component - modal for managing profiles (list, create, edit, delete)
import { useState, useEffect } from 'react';
import { fetchProfiles, fetchProfile, createProfile, deleteProfile, duplicateProfile, fetchProfileTemplate } from '../api/profileApi';
import ProfileEditor from './ProfileEditor';
import './ProfileManager.css';

function ProfileManager({ isOpen, onClose, onProfilesChanged }) {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingProfile, setEditingProfile] = useState(null);
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
            await createProfile(profile);
            setEditingProfile(null);
            await loadProfiles();
            onProfilesChanged?.();
        } catch (err) {
            console.error('Failed to save profile:', err);
            alert(`Failed to save profile: ${err.message}`);
        }
    };

    const handleEditorClose = () => {
        setEditingProfile(null);
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
                                                disabled={actionLoading === profile.name}
                                                title="Edit"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                </svg>
                                            </button>
                                            <button
                                                className="pm-action-btn duplicate"
                                                onClick={() => handleDuplicate(profile.name)}
                                                disabled={actionLoading === profile.name}
                                                title="Duplicate"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                                                </svg>
                                            </button>
                                            {profile.name.toLowerCase() !== 'default' && (
                                                <button
                                                    className="pm-action-btn delete"
                                                    onClick={() => handleDelete(profile.name)}
                                                    disabled={actionLoading === profile.name}
                                                    title="Delete"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                    </svg>
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
