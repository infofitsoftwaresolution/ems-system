import React, { useState, useEffect } from 'react';
import './UserPermissions.css';

const UserPermissions = () => {
  const [permissions, setPermissions] = useState({
    admin: {
      'manage-users': true,
      'manage-courses': true,
      'manage-grades': true,
      'view-reports': true,
      'system-settings': true,
      'delete-data': true,
      'export-data': true,
      'import-data': true
    },
    manager: {
      'manage-users': false,
      'manage-courses': true,
      'manage-grades': true,
      'view-reports': true,
      'system-settings': false,
      'delete-data': false,
      'export-data': true,
      'import-data': false
    },
    employee: {
      'manage-users': false,
      'manage-courses': false,
      'manage-grades': false,
      'view-reports': false,
      'system-settings': false,
      'delete-data': false,
      'export-data': false,
      'import-data': false
    }
  });

  const [activeRole, setActiveRole] = useState('admin');
  const [saving, setSaving] = useState(false);

  const permissionCategories = {
    'User Management': ['manage-users'],
    'Course Management': ['manage-courses'],
    'Grade Management': ['manage-grades'],
    'Reporting': ['view-reports'],
    'System Administration': ['system-settings'],
    'Data Operations': ['delete-data', 'export-data', 'import-data']
  };

  const permissionDescriptions = {
    'manage-users': 'Create, edit, and delete user accounts',
    'manage-courses': 'Create, edit, and delete courses',
    'manage-grades': 'Assign and modify grades',
    'view-reports': 'Access system reports and analytics',
    'system-settings': 'Modify system configuration',
    'delete-data': 'Permanently delete data from the system',
    'export-data': 'Export data to external formats',
    'import-data': 'Import data from external sources'
  };

  const handlePermissionChange = (permission, value) => {
    setPermissions(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [permission]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Save to localStorage
    localStorage.setItem('userPermissions', JSON.stringify(permissions));
    setSaving(false);
    alert('Permissions updated successfully!');
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all permissions to default?')) {
      const defaultPermissions = {
        admin: {
          'manage-users': true,
          'manage-courses': true,
          'manage-grades': true,
          'view-reports': true,
          'system-settings': true,
          'delete-data': true,
          'export-data': true,
          'import-data': true
        },
        manager: {
          'manage-users': false,
          'manage-courses': true,
          'manage-grades': true,
          'view-reports': true,
          'system-settings': false,
          'delete-data': false,
          'export-data': true,
          'import-data': false
        },
        employee: {
          'manage-users': false,
          'manage-courses': false,
          'manage-grades': false,
          'view-reports': false,
          'system-settings': false,
          'delete-data': false,
          'export-data': false,
          'import-data': false
        }
      };
      setPermissions(defaultPermissions);
    }
  };

  useEffect(() => {
    // Load saved permissions from localStorage
    const savedPermissions = localStorage.getItem('userPermissions');
    if (savedPermissions) {
      setPermissions(JSON.parse(savedPermissions));
    }
  }, []);

  return (
    <div className="user-permissions-container">
      <div className="content-header">
        <h1>User Permissions</h1>
        <p>Configure access levels and permissions for different user roles</p>
      </div>

      <div className="permissions-content">
        <div className="role-selector">
          <h3>Select Role</h3>
          <div className="role-tabs">
            {Object.keys(permissions).map(role => (
              <button
                key={role}
                className={`role-tab ${activeRole === role ? 'active' : ''}`}
                onClick={() => setActiveRole(role)}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="permissions-panel">
          <div className="panel-header">
            <h3>{activeRole.charAt(0).toUpperCase() + activeRole.slice(1)} Permissions</h3>
            <div className="panel-actions">
              <button className="btn-secondary" onClick={handleReset}>
                🔄 Reset to Default
              </button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '💾 Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>

          <div className="permissions-grid">
            {Object.entries(permissionCategories).map(([category, perms]) => (
              <div key={category} className="permission-category">
                <h4 className="category-title">{category}</h4>
                <div className="permission-items">
                  {perms.map(permission => (
                    <div key={permission} className="permission-item">
                      <div className="permission-info">
                        <label className="permission-label">
                          <input
                            type="checkbox"
                            checked={permissions[activeRole][permission]}
                            onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                          />
                          <span className="permission-name">
                            {permission.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </label>
                        <p className="permission-description">
                          {permissionDescriptions[permission]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="permissions-summary">
          <h3>Summary</h3>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Total Permissions:</span>
              <span className="stat-value">{Object.keys(permissions[activeRole]).length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Enabled:</span>
              <span className="stat-value">
                {Object.values(permissions[activeRole]).filter(Boolean).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Disabled:</span>
              <span className="stat-value">
                {Object.values(permissions[activeRole]).filter(p => !p).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPermissions; 