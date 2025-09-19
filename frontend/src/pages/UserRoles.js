import React, { useState, useEffect } from 'react';
import './UserRoles.css';

const UserRoles = () => {
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: 'Administrator',
      description: 'Full system access with all permissions',
      permissions: ['manage-users', 'manage-courses', 'manage-grades', 'view-reports', 'system-settings', 'delete-data', 'export-data', 'import-data'],
      userCount: 2,
      color: '#dc3545'
    },
    {
      id: 2,
      name: 'Manager',
      description: 'Department management with limited system access',
      permissions: ['manage-courses', 'manage-grades', 'view-reports', 'export-data'],
      userCount: 3,
      color: '#fd7e14'
    },
    {
      id: 3,
      name: 'Employee',
      description: 'Basic access to view and update personal information',
      permissions: ['view-reports'],
      userCount: 8,
      color: '#28a745'
    },
    {
      id: 4,
      name: 'Guest',
      description: 'Read-only access to public information',
      permissions: [],
      userCount: 0,
      color: '#6c757d'
    }
  ]);

  const [users, setUsers] = useState([
    { id: 1, name: 'Admin User', email: 'admin@company.com', currentRole: 'Administrator' },
    { id: 2, name: 'Manager User', email: 'manager@company.com', currentRole: 'Manager' },
    { id: 3, name: 'Employee User', email: 'employee@company.com', currentRole: 'Employee' },
    { id: 4, name: 'John Doe', email: 'john.doe@company.com', currentRole: 'Employee' },
    { id: 5, name: 'Jane Smith', email: 'jane.smith@company.com', currentRole: 'Manager' }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [],
    color: '#007bff'
  });

  const availablePermissions = [
    { id: 'manage-users', name: 'Manage Users', description: 'Create, edit, and delete user accounts' },
    { id: 'manage-courses', name: 'Manage Courses', description: 'Create, edit, and delete courses' },
    { id: 'manage-grades', name: 'Manage Grades', description: 'Assign and modify grades' },
    { id: 'view-reports', name: 'View Reports', description: 'Access system reports and analytics' },
    { id: 'system-settings', name: 'System Settings', description: 'Modify system configuration' },
    { id: 'delete-data', name: 'Delete Data', description: 'Permanently delete data from the system' },
    { id: 'export-data', name: 'Export Data', description: 'Export data to external formats' },
    { id: 'import-data', name: 'Import Data', description: 'Import data from external sources' }
  ];

  const handleCreateRole = () => {
    if (newRole.name.trim() === '') {
      alert('Please enter a role name');
      return;
    }

    const role = {
      id: Date.now(),
      ...newRole,
      userCount: 0
    };

    setRoles([...roles, role]);
    setNewRole({ name: '', description: '', permissions: [], color: '#007bff' });
    setShowCreateModal(false);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setNewRole({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
      color: role.color
    });
    setShowCreateModal(true);
  };

  const handleUpdateRole = () => {
    if (newRole.name.trim() === '') {
      alert('Please enter a role name');
      return;
    }

    setRoles(roles.map(role => 
      role.id === editingRole.id 
        ? { ...role, ...newRole }
        : role
    ));

    setEditingRole(null);
    setNewRole({ name: '', description: '', permissions: [], color: '#007bff' });
    setShowCreateModal(false);
  };

  const handleDeleteRole = (roleId) => {
    if (window.confirm('Are you sure you want to delete this role? Users with this role will need to be reassigned.')) {
      setRoles(roles.filter(role => role.id !== roleId));
    }
  };

  const handleAssignRole = (user, newRoleName) => {
    setUsers(users.map(u => 
      u.id === user.id 
        ? { ...u, currentRole: newRoleName }
        : u
    ));

    // Update user counts
    setRoles(roles.map(role => ({
      ...role,
      userCount: users.filter(u => u.currentRole === role.name).length
    })));

    setShowAssignModal(false);
    setSelectedUser(null);
  };

  const togglePermission = (permissionId) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  return (
    <div className="user-roles-container">
      <div className="content-header">
        <h1>User Roles Management</h1>
        <p>Create, edit, and manage user roles and their assignments</p>
      </div>

      <div className="roles-content">
        <div className="roles-header">
          <h2>System Roles</h2>
          <button 
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            ➕ Create New Role
          </button>
        </div>

        <div className="roles-grid">
          {roles.map(role => (
            <div key={role.id} className="role-card">
              <div className="role-header">
                <div className="role-info">
                  <div 
                    className="role-color-indicator"
                    style={{ backgroundColor: role.color }}
                  ></div>
                  <div>
                    <h3 className="role-name">{role.name}</h3>
                    <p className="role-description">{role.description}</p>
                  </div>
                </div>
                <div className="role-actions">
                  <button 
                    className="btn-icon"
                    onClick={() => handleEditRole(role)}
                    title="Edit Role"
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn-icon"
                    onClick={() => handleDeleteRole(role.id)}
                    title="Delete Role"
                    disabled={role.userCount > 0}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="role-stats">
                <div className="stat">
                  <span className="stat-label">Users:</span>
                  <span className="stat-value">{role.userCount}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Permissions:</span>
                  <span className="stat-value">{role.permissions.length}</span>
                </div>
              </div>

              <div className="role-permissions">
                <h4>Permissions</h4>
                <div className="permissions-list">
                  {role.permissions.length > 0 ? (
                    role.permissions.map(permId => {
                      const permission = availablePermissions.find(p => p.id === permId);
                      return (
                        <span key={permId} className="permission-tag">
                          {permission?.name}
                        </span>
                      );
                    })
                  ) : (
                    <span className="no-permissions">No permissions assigned</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="user-assignments">
          <h2>User Role Assignments</h2>
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span 
                        className="role-badge"
                        style={{ 
                          backgroundColor: roles.find(r => r.name === user.currentRole)?.color || '#6c757d' 
                        }}
                      >
                        {user.currentRole}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-secondary btn-sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowAssignModal(true);
                        }}
                      >
                        Change Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Role Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Role Name</label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                  placeholder="Enter role name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                  placeholder="Enter role description"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="color"
                  value={newRole.color}
                  onChange={(e) => setNewRole({...newRole, color: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Permissions</label>
                <div className="permissions-checkboxes">
                  {availablePermissions.map(permission => (
                    <label key={permission.id} className="permission-checkbox">
                      <input
                        type="checkbox"
                        checked={newRole.permissions.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                      />
                      <div>
                        <span className="permission-name">{permission.name}</span>
                        <span className="permission-desc">{permission.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={editingRole ? handleUpdateRole : handleCreateRole}
                >
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showAssignModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Role to {selectedUser.name}</h3>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Select a new role for {selectedUser.name}:</p>
              <div className="role-options">
                {roles.map(role => (
                  <button
                    key={role.id}
                    className={`role-option ${selectedUser.currentRole === role.name ? 'active' : ''}`}
                    onClick={() => handleAssignRole(selectedUser, role.name)}
                  >
                    <div 
                      className="role-color-indicator"
                      style={{ backgroundColor: role.color }}
                    ></div>
                    <div>
                      <span className="role-name">{role.name}</span>
                      <span className="role-desc">{role.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoles; 