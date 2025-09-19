import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = () => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    phone: '',
    avatar: ''
  });
  
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: true,
      showPhone: false
    },
    theme: 'light',
    language: 'en',
    timezone: 'UTC'
  });

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Extract name from email if name is not set properly
    let displayName = userData.name;
    if (!displayName || displayName === 'prabhat') {
      // Extract name from email (e.g., "shubhamsingh6087@gmail.com" -> "shubham")
      const emailName = userData.email?.split('@')[0];
      if (emailName) {
        displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }
    }
    
    setUser({
      name: displayName || 'User',
      email: userData.email || 'user@company.com',
      role: userData.role || 'Employee',
      department: userData.department || 'IT',
      phone: userData.phone || '+1 (555) 123-4567',
      avatar: displayName ? displayName.charAt(0).toUpperCase() : 'U'
    });
    setLoading(false);
  }, []);

  const handleSaveProfile = () => {
    // In a real app, this would save to the backend
    localStorage.setItem('user', JSON.stringify(user));
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleSaveSettings = () => {
    // In a real app, this would save to the backend
    localStorage.setItem('settings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  const handleNotificationChange = (type) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };

  const handlePrivacyChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [setting]: value
      }
    }));
  };

  const handleThemeChange = (theme) => {
    setSettings(prev => ({ ...prev, theme }));
    // In a real app, this would apply the theme
    document.body.className = theme;
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="loading">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your profile and system preferences</p>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            <button 
              className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              👤 Profile
            </button>
            <button 
              className={`nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              🔔 Notifications
            </button>
            <button 
              className={`nav-tab ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              🔒 Privacy & Security
            </button>
            <button 
              className={`nav-tab ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              🎨 Appearance
            </button>
            <button 
              className={`nav-tab ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              ⚙️ Account
            </button>
          </nav>
        </div>

        <div className="settings-main">
          {activeTab === 'profile' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Profile Information</h2>
                <button 
                  className="edit-btn"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              <div className="profile-form">
                <div className="avatar-section">
                  <div className="avatar-preview">
                    <span className="avatar-text">{user.avatar}</span>
                  </div>
                  {isEditing && (
                    <input
                      type="text"
                      value={user.avatar}
                      onChange={(e) => setUser({...user, avatar: e.target.value})}
                      placeholder="Avatar initials"
                      className="avatar-input"
                    />
                  )}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={user.name}
                      onChange={(e) => setUser({...user, name: e.target.value})}
                      disabled={!isEditing}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={user.email}
                      onChange={(e) => setUser({...user, email: e.target.value})}
                      disabled={!isEditing}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <input
                      type="text"
                      value={user.role}
                      disabled
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      value={user.department}
                      onChange={(e) => setUser({...user, department: e.target.value})}
                      disabled={!isEditing}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={user.phone}
                      onChange={(e) => setUser({...user, phone: e.target.value})}
                      disabled={!isEditing}
                      className="form-input"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="form-actions">
                    <button className="save-btn" onClick={handleSaveProfile}>
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Notification Preferences</h2>
                <button className="save-btn" onClick={handleSaveSettings}>
                  Save Settings
                </button>
              </div>

              <div className="notification-settings">
                <div className="setting-group">
                  <h3>Notification Channels</h3>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Email Notifications</h4>
                      <p>Receive notifications via email</p>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={settings.notifications.email}
                        onChange={() => handleNotificationChange('email')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Push Notifications</h4>
                      <p>Receive notifications in the browser</p>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={settings.notifications.push}
                        onChange={() => handleNotificationChange('push')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>SMS Notifications</h4>
                      <p>Receive notifications via SMS</p>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={settings.notifications.sms}
                        onChange={() => handleNotificationChange('sms')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                <div className="setting-group">
                  <h3>Notification Types</h3>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>System Updates</h4>
                      <p>Important system maintenance and updates</p>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Team Messages</h4>
                      <p>Messages from team members</p>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Meeting Reminders</h4>
                      <p>Reminders for upcoming meetings</p>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Privacy & Security</h2>
                <button className="save-btn" onClick={handleSaveSettings}>
                  Save Settings
                </button>
              </div>

              <div className="privacy-settings">
                <div className="setting-group">
                  <h3>Profile Visibility</h3>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Profile Visibility</h4>
                      <p>Control who can see your profile information</p>
                    </div>
                    <select
                      value={settings.privacy.profileVisibility}
                      onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                      className="form-select"
                    >
                      <option value="public">Public</option>
                      <option value="team">Team Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Show Email Address</h4>
                      <p>Allow others to see your email address</p>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={settings.privacy.showEmail}
                        onChange={() => handlePrivacyChange('showEmail', !settings.privacy.showEmail)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Show Phone Number</h4>
                      <p>Allow others to see your phone number</p>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={settings.privacy.showPhone}
                        onChange={() => handlePrivacyChange('showPhone', !settings.privacy.showPhone)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                <div className="setting-group">
                  <h3>Security</h3>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Two-Factor Authentication</h4>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                    <button className="setup-btn">Setup 2FA</button>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Change Password</h4>
                      <p>Update your account password</p>
                    </div>
                    <button className="setup-btn">Change Password</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Appearance</h2>
                <button className="save-btn" onClick={handleSaveSettings}>
                  Save Settings
                </button>
              </div>

              <div className="appearance-settings">
                <div className="setting-group">
                  <h3>Theme</h3>
                  
                  <div className="theme-options">
                    <div 
                      className={`theme-option ${settings.theme === 'light' ? 'active' : ''}`}
                      onClick={() => handleThemeChange('light')}
                    >
                      <div className="theme-preview light"></div>
                      <span>Light</span>
                    </div>
                    
                    <div 
                      className={`theme-option ${settings.theme === 'dark' ? 'active' : ''}`}
                      onClick={() => handleThemeChange('dark')}
                    >
                      <div className="theme-preview dark"></div>
                      <span>Dark</span>
                    </div>
                    
                    <div 
                      className={`theme-option ${settings.theme === 'auto' ? 'active' : ''}`}
                      onClick={() => handleThemeChange('auto')}
                    >
                      <div className="theme-preview auto"></div>
                      <span>Auto</span>
                    </div>
                  </div>
                </div>

                <div className="setting-group">
                  <h3>Language & Region</h3>
                  
                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Language</h4>
                      <p>Choose your preferred language</p>
                    </div>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({...settings, language: e.target.value})}
                      className="form-select"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <h4>Timezone</h4>
                      <p>Set your local timezone</p>
                    </div>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                      className="form-select"
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time</option>
                      <option value="PST">Pacific Time</option>
                      <option value="GMT">GMT</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Account Management</h2>
              </div>

              <div className="account-settings">
                <div className="setting-group">
                  <h3>Account Actions</h3>
                  
                  <div className="account-actions">
                    <div className="action-item">
                      <div className="action-info">
                        <h4>Download Data</h4>
                        <p>Download a copy of your data</p>
                      </div>
                      <button className="action-btn">Download</button>
                    </div>

                    <div className="action-item">
                      <div className="action-info">
                        <h4>Delete Account</h4>
                        <p>Permanently delete your account and all data</p>
                      </div>
                      <button className="action-btn danger">Delete Account</button>
                    </div>
                  </div>
                </div>

                <div className="setting-group">
                  <h3>Account Information</h3>
                  
                  <div className="account-info">
                    <div className="info-item">
                      <span className="info-label">Account Created:</span>
                      <span className="info-value">January 15, 2024</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Last Login:</span>
                      <span className="info-value">Today at 10:30 AM</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Account Status:</span>
                      <span className="info-value active">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 