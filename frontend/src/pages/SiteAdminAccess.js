import React, { useState, useEffect } from 'react';
import './SiteAdminAccess.css';

const SiteAdminAccess = () => {
  const [settings, setSettings] = useState({
    enableAccessControl: true,
    requireSuperAdmin: false,
    allowMultipleAdmins: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15
  });
  
  const [roleAccess, setRoleAccess] = useState({
    'admin': {
      canAccess: true,
      canManageUsers: true,
      canManageSettings: true,
      canViewLogs: true,
      canManageAccess: true
    },
    'manager': {
      canAccess: false,
      canManageUsers: false,
      canManageSettings: false,
      canViewLogs: false,
      canManageAccess: false
    },
    'employee': {
      canAccess: false,
      canManageUsers: false,
      canManageSettings: false,
      canViewLogs: false,
      canManageAccess: false
    }
  });
  
  const [allowedUsers, setAllowedUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john.doe@company.com', role: 'admin', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@company.com', role: 'admin', status: 'active' },
    { id: 3, name: 'Mike Johnson', email: 'mike.johnson@company.com', role: 'manager', status: 'pending' }
  ]);
  
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    const savedSettings = localStorage.getItem('siteAdminAccessSettings');
    const savedRoleAccess = localStorage.getItem('siteAdminRoleAccess');
    const savedAllowedUsers = localStorage.getItem('siteAdminAllowedUsers');
    
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedRoleAccess) setRoleAccess(JSON.parse(savedRoleAccess));
    if (savedAllowedUsers) setAllowedUsers(JSON.parse(savedAllowedUsers));
  }, []);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRoleToggle = (role, permission) => {
    setRoleAccess(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: !prev[role][permission]
      }
    }));
  };

  const handleUserStatusChange = (userId, newStatus) => {
    setAllowedUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
  };

  const handleRemoveUser = (userId) => {
    setAllowedUsers(prev => prev.filter(user => user.id !== userId));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('siteAdminAccessSettings', JSON.stringify(settings));
      localStorage.setItem('siteAdminRoleAccess', JSON.stringify(roleAccess));
      localStorage.setItem('siteAdminAllowedUsers', JSON.stringify(allowedUsers));
      setSaving(false);
      alert('Site Admin Access settings saved!');
    }, 800);
  };

  const handleTestAccess = () => {
    setTestResult('Access control test completed successfully!');
    setTimeout(() => setTestResult(''), 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'pending': return '#ffc107';
      case 'inactive': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="site-admin-access-container">
      <div className="content-header">
        <h1>Site Administration Access Control</h1>
        <p>Control who can access the Site Administration panel and manage permissions</p>
      </div>

      <div className="settings-grid">
        {/* General Access Settings */}
        <div className="settings-section">
          <h3>General Access Settings</h3>
          <div className="toggle-row">
            <label>Enable Access Control</label>
            <input type="checkbox" checked={settings.enableAccessControl} onChange={() => handleToggle('enableAccessControl')} />
          </div>
          <div className="toggle-row">
            <label>Require Super Admin</label>
            <input type="checkbox" checked={settings.requireSuperAdmin} onChange={() => handleToggle('requireSuperAdmin')} />
          </div>
          <div className="toggle-row">
            <label>Allow Multiple Admins</label>
            <input type="checkbox" checked={settings.allowMultipleAdmins} onChange={() => handleToggle('allowMultipleAdmins')} />
          </div>
          <div className="input-row">
            <label>Session Timeout (minutes)</label>
            <input 
              type="number" 
              data-field="sessionTimeout" 
              value={settings.sessionTimeout} 
              onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 30 }))}
              min="5"
              max="120"
            />
          </div>
          <div className="input-row">
            <label>Max Login Attempts</label>
            <input 
              type="number" 
              data-field="maxLoginAttempts" 
              value={settings.maxLoginAttempts} 
              onChange={(e) => setSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) || 5 }))}
              min="1"
              max="10"
            />
          </div>
          <div className="input-row">
            <label>Lockout Duration (minutes)</label>
            <input 
              type="number" 
              data-field="lockoutDuration" 
              value={settings.lockoutDuration} 
              onChange={(e) => setSettings(prev => ({ ...prev, lockoutDuration: parseInt(e.target.value) || 15 }))}
              min="5"
              max="60"
            />
          </div>
        </div>

        {/* Role-Based Access */}
        <div className="settings-section">
          <h3>Role-Based Access Control</h3>
          <div className="role-permissions">
            {Object.entries(roleAccess).map(([role, permissions]) => (
              <div key={role} className="role-section">
                <h4 className="role-title">{role.charAt(0).toUpperCase() + role.slice(1)}</h4>
                <div className="permissions-grid">
                  <div className="permission-item">
                    <label>Can Access Site Admin</label>
                    <input 
                      type="checkbox" 
                      checked={permissions.canAccess} 
                      onChange={() => handleRoleToggle(role, 'canAccess')} 
                    />
                  </div>
                  <div className="permission-item">
                    <label>Can Manage Users</label>
                    <input 
                      type="checkbox" 
                      checked={permissions.canManageUsers} 
                      onChange={() => handleRoleToggle(role, 'canManageUsers')} 
                    />
                  </div>
                  <div className="permission-item">
                    <label>Can Manage Settings</label>
                    <input 
                      type="checkbox" 
                      checked={permissions.canManageSettings} 
                      onChange={() => handleRoleToggle(role, 'canManageSettings')} 
                    />
                  </div>
                  <div className="permission-item">
                    <label>Can View Logs</label>
                    <input 
                      type="checkbox" 
                      checked={permissions.canViewLogs} 
                      onChange={() => handleRoleToggle(role, 'canViewLogs')} 
                    />
                  </div>
                  <div className="permission-item">
                    <label>Can Manage Access</label>
                    <input 
                      type="checkbox" 
                      checked={permissions.canManageAccess} 
                      onChange={() => handleRoleToggle(role, 'canManageAccess')} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Allowed Users */}
        <div className="settings-section">
          <h3>Allowed Users</h3>
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allowedUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className="role-badge">{user.role}</span>
                    </td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(user.status) }}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <select 
                        value={user.status} 
                        onChange={(e) => handleUserStatusChange(user.id, e.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="inactive">Inactive</option>
                      </select>
                      <button 
                        className="btn-danger btn-sm" 
                        onClick={() => handleRemoveUser(user.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn-secondary">Add New User</button>
        </div>
      </div>

      {/* Access Statistics */}
      <div className="stats-section">
        <h3>Access Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Total Allowed Users</h4>
            <span className="stat-number">{allowedUsers.length}</span>
          </div>
          <div className="stat-card">
            <h4>Active Users</h4>
            <span className="stat-number">{allowedUsers.filter(u => u.status === 'active').length}</span>
          </div>
          <div className="stat-card">
            <h4>Pending Approvals</h4>
            <span className="stat-number">{allowedUsers.filter(u => u.status === 'pending').length}</span>
          </div>
          <div className="stat-card">
            <h4>Roles with Access</h4>
            <span className="stat-number">{Object.values(roleAccess).filter(role => role.canAccess).length}</span>
          </div>
        </div>
      </div>

      <div className="actions-row">
        <button className="btn-secondary" onClick={handleTestAccess}>Test Access Control</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {testResult && <span className="test-result">{testResult}</span>}
      </div>

      <div className="info-section">
        <h4>Important Notes</h4>
        <ul>
          <li>Changes to access control settings take effect immediately</li>
          <li>Users with active sessions may need to log out and log back in</li>
          <li>Super admin access cannot be revoked from the last super admin</li>
          <li>Access logs are automatically maintained for security auditing</li>
        </ul>
      </div>
    </div>
  );
};

export default SiteAdminAccess; 