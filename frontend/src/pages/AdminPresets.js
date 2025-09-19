import React, { useState, useEffect } from 'react';
import './AdminPresets.css';

const AdminPresets = () => {
  const [presets, setPresets] = useState([
    {
      id: 1,
      name: 'Default Admin Layout',
      description: 'Standard admin dashboard configuration',
      category: 'Dashboard',
      createdBy: 'System Admin',
      createdDate: '2024-01-01',
      isDefault: true,
      settings: {
        sidebarCollapsed: false,
        theme: 'light',
        notifications: true,
        quickActions: true,
        recentActivity: true,
        statsWidgets: ['employees', 'departments', 'reports', 'calendar']
      }
    },
    {
      id: 2,
      name: 'Minimal Dashboard',
      description: 'Clean, minimal interface for focused work',
      category: 'Dashboard',
      createdBy: 'John Doe',
      createdDate: '2024-01-10',
      isDefault: false,
      settings: {
        sidebarCollapsed: true,
        theme: 'light',
        notifications: false,
        quickActions: false,
        recentActivity: false,
        statsWidgets: ['employees', 'reports']
      }
    },
    {
      id: 3,
      name: 'Analytics Focus',
      description: 'Dashboard optimized for data analysis',
      category: 'Analytics',
      createdBy: 'Jane Smith',
      createdDate: '2024-01-15',
      isDefault: false,
      settings: {
        sidebarCollapsed: false,
        theme: 'dark',
        notifications: true,
        quickActions: true,
        recentActivity: true,
        statsWidgets: ['reports', 'analytics', 'performance', 'trends']
      }
    }
  ]);
  const [activePreset, setActivePreset] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [newPreset, setNewPreset] = useState({
    name: '',
    description: '',
    category: 'Dashboard',
    settings: {
      sidebarCollapsed: false,
      theme: 'light',
      notifications: true,
      quickActions: true,
      recentActivity: true,
      statsWidgets: ['employees', 'departments', 'reports', 'calendar']
    }
  });

  useEffect(() => {
    const saved = localStorage.getItem('adminPresets');
    const savedActive = localStorage.getItem('activePreset');
    if (saved) setPresets(JSON.parse(saved));
    if (savedActive) setActivePreset(parseInt(savedActive));
  }, []);

  const handleApplyPreset = (presetId) => {
    setActivePreset(presetId);
    localStorage.setItem('activePreset', presetId.toString());
    alert(`Applied preset: ${presets.find(p => p.id === presetId)?.name}`);
  };

  const handleCreatePreset = () => {
    if (!newPreset.name.trim()) {
      alert('Please enter a preset name');
      return;
    }
    
    const preset = {
      ...newPreset,
      id: Date.now(),
      createdBy: 'Current User',
      createdDate: new Date().toISOString().split('T')[0],
      isDefault: false
    };
    
    setPresets(prev => [...prev, preset]);
    setNewPreset({
      name: '',
      description: '',
      category: 'Dashboard',
      settings: {
        sidebarCollapsed: false,
        theme: 'light',
        notifications: true,
        quickActions: true,
        recentActivity: true,
        statsWidgets: ['employees', 'departments', 'reports', 'calendar']
      }
    });
    setShowCreateModal(false);
    localStorage.setItem('adminPresets', JSON.stringify([...presets, preset]));
  };

  const handleEditPreset = (preset) => {
    setEditingPreset(preset);
    setShowEditModal(true);
  };

  const handleUpdatePreset = () => {
    if (!editingPreset.name.trim()) {
      alert('Please enter a preset name');
      return;
    }
    
    setPresets(prev => prev.map(p => p.id === editingPreset.id ? editingPreset : p));
    setShowEditModal(false);
    setEditingPreset(null);
    localStorage.setItem('adminPresets', JSON.stringify(presets.map(p => p.id === editingPreset.id ? editingPreset : p)));
  };

  const handleDeletePreset = (presetId) => {
    if (window.confirm('Are you sure you want to delete this preset?')) {
      const updatedPresets = presets.filter(p => p.id !== presetId);
      setPresets(updatedPresets);
      localStorage.setItem('adminPresets', JSON.stringify(updatedPresets));
      
      if (activePreset === presetId) {
        setActivePreset(1);
        localStorage.setItem('activePreset', '1');
      }
    }
  };

  const handleDuplicatePreset = (preset) => {
    const duplicated = {
      ...preset,
      id: Date.now(),
      name: `${preset.name} (Copy)`,
      createdBy: 'Current User',
      createdDate: new Date().toISOString().split('T')[0],
      isDefault: false
    };
    
    setPresets(prev => [...prev, duplicated]);
    localStorage.setItem('adminPresets', JSON.stringify([...presets, duplicated]));
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Dashboard': return '📊';
      case 'Analytics': return '📈';
      case 'Management': return '⚙️';
      case 'Custom': return '🎨';
      default: return '📋';
    }
  };

  return (
    <div className="admin-presets-container">
      <div className="content-header">
        <h1>Admin Presets</h1>
        <p>Save and manage dashboard layouts and settings configurations</p>
      </div>

      <div className="presets-overview">
        <div className="overview-stats">
          <div className="stat-item">
            <span className="stat-number">{presets.length}</span>
            <span className="stat-label">Total Presets</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{presets.filter(p => p.isDefault).length}</span>
            <span className="stat-label">System Presets</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{presets.filter(p => !p.isDefault).length}</span>
            <span className="stat-label">Custom Presets</span>
          </div>
        </div>
      </div>

      <div className="presets-section">
        <div className="section-header">
          <h3>Available Presets</h3>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            Create New Preset
          </button>
        </div>

        <div className="presets-grid">
          {presets.map(preset => (
            <div key={preset.id} className={`preset-card ${activePreset === preset.id ? 'active' : ''}`}>
              <div className="preset-header">
                <div className="preset-info">
                  <span className="category-icon">{getCategoryIcon(preset.category)}</span>
                  <div>
                    <h4>{preset.name}</h4>
                    <span className="preset-category">{preset.category}</span>
                  </div>
                </div>
                <div className="preset-actions">
                  {preset.isDefault && <span className="default-badge">System</span>}
                  <button 
                    className="btn-secondary"
                    onClick={() => handleEditPreset(preset)}
                    disabled={preset.isDefault}
                  >
                    Edit
                  </button>
                </div>
              </div>
              
              <p className="preset-description">{preset.description}</p>
              
              <div className="preset-settings">
                <h5>Configuration</h5>
                <div className="settings-grid">
                  <div className="setting-item">
                    <span className="setting-label">Theme:</span>
                    <span className="setting-value">{preset.settings.theme}</span>
                  </div>
                  <div className="setting-item">
                    <span className="setting-label">Sidebar:</span>
                    <span className="setting-value">{preset.settings.sidebarCollapsed ? 'Collapsed' : 'Expanded'}</span>
                  </div>
                  <div className="setting-item">
                    <span className="setting-label">Widgets:</span>
                    <span className="setting-value">{preset.settings.statsWidgets.length}</span>
                  </div>
                </div>
              </div>
              
              <div className="preset-meta">
                <small>Created by {preset.createdBy} on {preset.createdDate}</small>
              </div>
              
              <div className="preset-actions-bottom">
                <button 
                  className={`btn-primary ${activePreset === preset.id ? 'active' : ''}`}
                  onClick={() => handleApplyPreset(preset.id)}
                >
                  {activePreset === preset.id ? 'Active' : 'Apply'}
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => handleDuplicatePreset(preset)}
                >
                  Duplicate
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => handleDeletePreset(preset.id)}
                  disabled={preset.isDefault}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Preset Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Preset</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Preset Name</label>
                <input 
                  type="text" 
                  value={newPreset.name}
                  onChange={(e) => setNewPreset(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter preset name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={newPreset.description}
                  onChange={(e) => setNewPreset(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this preset"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select 
                  value={newPreset.category}
                  onChange={(e) => setNewPreset(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="Dashboard">Dashboard</option>
                  <option value="Analytics">Analytics</option>
                  <option value="Management">Management</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreatePreset}>Create Preset</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Preset Modal */}
      {showEditModal && editingPreset && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Preset</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Preset Name</label>
                <input 
                  type="text" 
                  value={editingPreset.name}
                  onChange={(e) => setEditingPreset(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={editingPreset.description}
                  onChange={(e) => setEditingPreset(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select 
                  value={editingPreset.category}
                  onChange={(e) => setEditingPreset(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="Dashboard">Dashboard</option>
                  <option value="Analytics">Analytics</option>
                  <option value="Management">Management</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdatePreset}>Update Preset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPresets; 