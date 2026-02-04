// ProfileEditor component - form for editing profile settings
import { useState } from 'react';
import './ProfileEditor.css';

function ProfileEditor({ profile, onSave, onCancel }) {
    const [formData, setFormData] = useState(profile);
    const [activeTab, setActiveTab] = useState('page');
    const [saving, setSaving] = useState(false);

    const handleChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleTopLevelChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFontChange = (fontType, field, value) => {
        setFormData(prev => ({
            ...prev,
            fonts: {
                ...prev.fonts,
                [fontType]: {
                    ...prev.fonts[fontType],
                    [field]: value
                }
            }
        }));
    };

    const handleSave = async () => {
        if (!formData.name?.trim()) {
            alert('Profile name is required');
            return;
        }
        setSaving(true);
        try {
            await onSave(formData);
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'page', label: 'Page Setup', icon: '📄' },
        { id: 'fonts', label: 'Fonts', icon: '🔤' },
        { id: 'headings', label: 'Headings', icon: '📰' },
        { id: 'tables', label: 'Tables', icon: '📊' },
        { id: 'pageNumbers', label: 'Page Numbers', icon: '#️⃣' },
    ];

    return (
        <div className="profile-editor-overlay">
            <div className="profile-editor-modal">
                <div className="pe-header">
                    <h2>{profile.name === 'New Profile' ? 'Create Profile' : `Edit: ${profile.name}`}</h2>
                    <button className="pe-close-btn" onClick={onCancel}>×</button>
                </div>

                <div className="pe-info">
                    <div className="pe-field">
                        <label>Profile Name</label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => handleTopLevelChange('name', e.target.value)}
                            placeholder="Enter profile name"
                        />
                    </div>
                    <div className="pe-field">
                        <label>Description</label>
                        <input
                            type="text"
                            value={formData.description || ''}
                            onChange={(e) => handleTopLevelChange('description', e.target.value)}
                            placeholder="Brief description"
                        />
                    </div>
                </div>

                <div className="pe-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`pe-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-label">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="pe-content">
                    {activeTab === 'page' && (
                        <div className="pe-section">
                            <h3>Page Dimensions</h3>
                            <div className="pe-grid">
                                <div className="pe-field">
                                    <label>Width (inches)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.page?.width || 8.5}
                                        onChange={(e) => handleChange('page', 'width', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="pe-field">
                                    <label>Height (inches)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.page?.height || 11}
                                        onChange={(e) => handleChange('page', 'height', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>

                            <h3>Margins</h3>
                            <div className="pe-grid four">
                                <div className="pe-field">
                                    <label>Top</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.page?.top_margin || 0.3}
                                        onChange={(e) => handleChange('page', 'top_margin', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="pe-field">
                                    <label>Bottom</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.page?.bottom_margin || 0.3}
                                        onChange={(e) => handleChange('page', 'bottom_margin', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="pe-field">
                                    <label>Left</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.page?.left_margin || 0.79}
                                        onChange={(e) => handleChange('page', 'left_margin', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="pe-field">
                                    <label>Right</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.page?.right_margin || 0.33}
                                        onChange={(e) => handleChange('page', 'right_margin', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>

                            <h3>Header/Footer Distance</h3>
                            <div className="pe-grid">
                                <div className="pe-field">
                                    <label>Header Distance</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.page?.header_distance || 0}
                                        onChange={(e) => handleChange('page', 'header_distance', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="pe-field">
                                    <label>Footer Distance</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.page?.footer_distance || 0.2}
                                        onChange={(e) => handleChange('page', 'footer_distance', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'fonts' && (
                        <div className="pe-section">
                            <h3>Body Font</h3>
                            <div className="pe-grid">
                                <div className="pe-field">
                                    <label>Font Name</label>
                                    <select
                                        value={formData.fonts?.body?.name || 'Calibri'}
                                        onChange={(e) => handleFontChange('body', 'name', e.target.value)}
                                    >
                                        <option value="Calibri">Calibri</option>
                                        <option value="Arial">Arial</option>
                                        <option value="Times New Roman">Times New Roman</option>
                                        <option value="Helvetica">Helvetica</option>
                                        <option value="Georgia">Georgia</option>
                                        <option value="Verdana">Verdana</option>
                                    </select>
                                </div>
                                <div className="pe-field">
                                    <label>Size (pt)</label>
                                    <input
                                        type="number"
                                        min="8"
                                        max="24"
                                        value={formData.fonts?.body?.size || 11}
                                        onChange={(e) => handleFontChange('body', 'size', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            <h3>Table Header Font</h3>
                            <div className="pe-grid three">
                                <div className="pe-field">
                                    <label>Font Name</label>
                                    <select
                                        value={formData.fonts?.table_header?.name || 'Calibri'}
                                        onChange={(e) => handleFontChange('table_header', 'name', e.target.value)}
                                    >
                                        <option value="Calibri">Calibri</option>
                                        <option value="Arial">Arial</option>
                                        <option value="Times New Roman">Times New Roman</option>
                                        <option value="Helvetica">Helvetica</option>
                                    </select>
                                </div>
                                <div className="pe-field">
                                    <label>Size (pt)</label>
                                    <input
                                        type="number"
                                        min="8"
                                        max="24"
                                        value={formData.fonts?.table_header?.size || 10}
                                        onChange={(e) => handleFontChange('table_header', 'size', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="pe-field checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.fonts?.table_header?.bold !== false}
                                            onChange={(e) => handleFontChange('table_header', 'bold', e.target.checked)}
                                        />
                                        Bold
                                    </label>
                                </div>
                            </div>

                            <h3>Table Body Font</h3>
                            <div className="pe-grid">
                                <div className="pe-field">
                                    <label>Font Name</label>
                                    <select
                                        value={formData.fonts?.table_body?.name || 'Calibri'}
                                        onChange={(e) => handleFontChange('table_body', 'name', e.target.value)}
                                    >
                                        <option value="Calibri">Calibri</option>
                                        <option value="Arial">Arial</option>
                                        <option value="Times New Roman">Times New Roman</option>
                                        <option value="Helvetica">Helvetica</option>
                                    </select>
                                </div>
                                <div className="pe-field">
                                    <label>Size (pt)</label>
                                    <input
                                        type="number"
                                        min="8"
                                        max="24"
                                        value={formData.fonts?.table_body?.size || 10}
                                        onChange={(e) => handleFontChange('table_body', 'size', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'headings' && (
                        <div className="pe-section">
                            <h3>Heading Sizes (pt)</h3>
                            <div className="pe-grid three">
                                <div className="pe-field">
                                    <label>H1 Size</label>
                                    <input
                                        type="number"
                                        min="8"
                                        max="36"
                                        value={formData.headings?.h1_size || 14}
                                        onChange={(e) => handleChange('headings', 'h1_size', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="pe-field">
                                    <label>H2 Size</label>
                                    <input
                                        type="number"
                                        min="8"
                                        max="36"
                                        value={formData.headings?.h2_size || 12}
                                        onChange={(e) => handleChange('headings', 'h2_size', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="pe-field">
                                    <label>H3 Size</label>
                                    <input
                                        type="number"
                                        min="8"
                                        max="36"
                                        value={formData.headings?.h3_size || 11}
                                        onChange={(e) => handleChange('headings', 'h3_size', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="pe-field">
                                    <label>H4 Size</label>
                                    <input
                                        type="number"
                                        min="8"
                                        max="36"
                                        value={formData.headings?.h4_size || 10}
                                        onChange={(e) => handleChange('headings', 'h4_size', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="pe-field">
                                    <label>H5 Size</label>
                                    <input
                                        type="number"
                                        min="8"
                                        max="36"
                                        value={formData.headings?.h5_size || 9}
                                        onChange={(e) => handleChange('headings', 'h5_size', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="pe-field">
                                    <label>H6 Size</label>
                                    <input
                                        type="number"
                                        min="8"
                                        max="36"
                                        value={formData.headings?.h6_size || 9}
                                        onChange={(e) => handleChange('headings', 'h6_size', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="pe-field checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.headings?.bold !== false}
                                        onChange={(e) => handleChange('headings', 'bold', e.target.checked)}
                                    />
                                    Bold Headings
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tables' && (
                        <div className="pe-section">
                            <h3>Border Settings</h3>
                            <div className="pe-grid three">
                                <div className="pe-field">
                                    <label>Border Style</label>
                                    <select
                                        value={formData.tables?.border_style || 'single'}
                                        onChange={(e) => handleChange('tables', 'border_style', e.target.value)}
                                    >
                                        <option value="single">Single</option>
                                        <option value="double">Double</option>
                                        <option value="dotted">Dotted</option>
                                        <option value="dashed">Dashed</option>
                                    </select>
                                </div>
                                <div className="pe-field">
                                    <label>Border Width</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="24"
                                        value={formData.tables?.border_width || 8}
                                        onChange={(e) => handleChange('tables', 'border_width', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="pe-field">
                                    <label>Border Color</label>
                                    <input
                                        type="color"
                                        value={`#${formData.tables?.border_color || '000000'}`}
                                        onChange={(e) => handleChange('tables', 'border_color', e.target.value.slice(1))}
                                    />
                                </div>
                            </div>

                            <h3>Header Options</h3>
                            <div className="pe-checkboxes">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.tables?.header_bold !== false}
                                        onChange={(e) => handleChange('tables', 'header_bold', e.target.checked)}
                                    />
                                    Bold Header
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.tables?.header_center !== false}
                                        onChange={(e) => handleChange('tables', 'header_center', e.target.checked)}
                                    />
                                    Center Header
                                </label>
                            </div>

                            <h3>Column Width (inches)</h3>
                            <div className="pe-grid">
                                <div className="pe-field">
                                    <label>Min Width</label>
                                    <input
                                        type="number"
                                        step="0.05"
                                        min="0.1"
                                        max="2"
                                        value={formData.tables?.min_col_width || 0.35}
                                        onChange={(e) => handleChange('tables', 'min_col_width', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="pe-field">
                                    <label>Max Width</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="1"
                                        max="6"
                                        value={formData.tables?.max_col_width || 3.0}
                                        onChange={(e) => handleChange('tables', 'max_col_width', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'pageNumbers' && (
                        <div className="pe-section">
                            <div className="pe-field checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.page_numbers?.enabled !== false}
                                        onChange={(e) => handleChange('page_numbers', 'enabled', e.target.checked)}
                                    />
                                    Enable Page Numbers
                                </label>
                            </div>

                            {formData.page_numbers?.enabled !== false && (
                                <div className="pe-grid">
                                    <div className="pe-field">
                                        <label>Position</label>
                                        <select
                                            value={formData.page_numbers?.position || 'footer_right'}
                                            onChange={(e) => handleChange('page_numbers', 'position', e.target.value)}
                                        >
                                            <option value="footer_left">Footer Left</option>
                                            <option value="footer_center">Footer Center</option>
                                            <option value="footer_right">Footer Right</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="pe-footer">
                    <button className="pe-cancel-btn" onClick={onCancel} disabled={saving}>
                        Cancel
                    </button>
                    <button className="pe-save-btn" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProfileEditor;
