import React, { useState, useEffect } from 'react';
import './RegistrationSettings.css';

const RegistrationSettings = () => {
  const [settings, setSettings] = useState({
    allowRegistration: true,
    requireApproval: false,
    requireEmailVerification: true,
    allowInviteOnly: false,
    maxUsers: 1000,
    welcomeEmail: true,
    welcomeEmailSubject: 'Welcome to our platform!',
    welcomeEmailBody: 'Hi {user},\n\nWelcome to our platform! Your account has been successfully created.\n\nBest regards,\nThe Team'
  });
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('registrationSettings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e) => {
    const fieldName = e.target.getAttribute('data-field');
    const { value, type } = e.target;
    setSettings(prev => ({ 
      ...prev, 
      [fieldName]: type === 'number' ? parseInt(value) || 0 : value 
    }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('registrationSettings', JSON.stringify(settings));
      setSaving(false);
      alert('Registration settings saved!');
    }, 800);
  };

  const handleTestEmail = () => {
    setTestResult('Test welcome email sent! (Simulated)');
    setTimeout(() => setTestResult(''), 2000);
  };

  return (
    <div className="registration-settings-container">
      <div className="content-header">
        <h1>Registration Settings</h1>
        <p>Configure user registration and approval settings</p>
      </div>
      
      <div className="settings-section">
        <h3>Registration Options</h3>
        <div className="toggle-row">
          <label>Allow New User Registration</label>
          <input type="checkbox" checked={settings.allowRegistration} onChange={() => handleToggle('allowRegistration')} />
        </div>
        <div className="toggle-row">
          <label>Require Admin Approval</label>
          <input type="checkbox" checked={settings.requireApproval} onChange={() => handleToggle('requireApproval')} />
        </div>
        <div className="toggle-row">
          <label>Require Email Verification</label>
          <input type="checkbox" checked={settings.requireEmailVerification} onChange={() => handleToggle('requireEmailVerification')} />
        </div>
        <div className="toggle-row">
          <label>Invite-Only Registration</label>
          <input type="checkbox" checked={settings.allowInviteOnly} onChange={() => handleToggle('allowInviteOnly')} />
        </div>
        <div className="input-row">
          <label>Maximum Users Allowed</label>
          <input 
            type="number" 
            data-field="maxUsers" 
            value={settings.maxUsers} 
            onChange={handleChange}
            min="1"
            max="10000"
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>Welcome Email Settings</h3>
        <div className="toggle-row">
          <label>Send Welcome Email</label>
          <input type="checkbox" checked={settings.welcomeEmail} onChange={() => handleToggle('welcomeEmail')} />
        </div>
        <div className="input-group">
          <label>Email Subject</label>
          <input 
            type="text" 
            data-field="welcomeEmailSubject" 
            value={settings.welcomeEmailSubject} 
            onChange={handleChange}
            placeholder="Welcome email subject"
          />
        </div>
        <div className="input-group">
          <label>Email Body</label>
          <textarea 
            data-field="welcomeEmailBody" 
            value={settings.welcomeEmailBody} 
            onChange={handleChange}
            placeholder="Welcome email body (use {user} for user's name)"
            rows="6"
          />
          <small>Use {'{user}'} to include the user's name in the email</small>
        </div>
        <button className="btn-secondary" onClick={handleTestEmail}>Test Welcome Email</button>
      </div>

      <div className="settings-section">
        <h3>Current Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Total Users</h4>
            <span className="stat-number">247</span>
          </div>
          <div className="stat-card">
            <h4>Pending Approvals</h4>
            <span className="stat-number">3</span>
          </div>
          <div className="stat-card">
            <h4>Active Registrations</h4>
            <span className="stat-number">12</span>
          </div>
        </div>
      </div>

      <div className="actions-row">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {testResult && <span className="test-result">{testResult}</span>}
      </div>
    </div>
  );
};

export default RegistrationSettings; 