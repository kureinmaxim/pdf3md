// Profile API client functions

const getBackendUrl = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;

    if (import.meta.env.PROD) {
        const portPart = port ? `:${port}` : '';
        return `${protocol}//${hostname}${portPart}`;
    }

    if (hostname === 'localhost') {
        return 'http://localhost:6201';
    } else if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        return `${protocol}//${hostname}:6201`;
    } else {
        return `${protocol}//${hostname}/api`;
    }
};

export const fetchProfiles = async () => {
    const response = await fetch(`${getBackendUrl()}/api/profiles`);
    if (!response.ok) throw new Error('Failed to fetch profiles');
    const data = await response.json();
    return data.profiles;
};

export const fetchProfile = async (name) => {
    const response = await fetch(`${getBackendUrl()}/api/profiles/${encodeURIComponent(name)}`);
    if (!response.ok) throw new Error(`Failed to fetch profile: ${name}`);
    return await response.json();
};

export const createProfile = async (profileData) => {
    const response = await fetch(`${getBackendUrl()}/api/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create profile');
    }
    return await response.json();
};

export const updateProfile = async (name, profileData) => {
    const response = await fetch(`${getBackendUrl()}/api/profiles/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
    }
    return await response.json();
};

export const deleteProfile = async (name) => {
    const response = await fetch(`${getBackendUrl()}/api/profiles/${encodeURIComponent(name)}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete profile');
    }
    return await response.json();
};

export const duplicateProfile = async (sourceName, newName) => {
    const response = await fetch(`${getBackendUrl()}/api/profiles/${encodeURIComponent(sourceName)}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to duplicate profile');
    }
    return await response.json();
};

export const fetchProfileTemplate = async (name = 'New Profile', description = '') => {
    const params = new URLSearchParams({ name, description });
    const response = await fetch(`${getBackendUrl()}/api/profiles/template?${params}`);
    if (!response.ok) throw new Error('Failed to fetch profile template');
    return await response.json();
};
