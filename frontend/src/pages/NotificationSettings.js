import React, { useState, useEffect } from 'react';
import './NotificationSettings.css';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    email: true,
    sms: false,
    inApp: true,
    emailTemplate: 'Welcome {{name}} to our platform!',
    smsTemplate: 'Hi {{name}}, your account is ready.',
    inAppTemplate: 'Hello {{name}}, you have a new notification.'
  });
  const [testResult, setTestResult] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e) => {
    const fieldName = e.target.name;
    const { value } = e.target;
    setSettings(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      setSaving(false);
      alert('Notification settings saved!');
    }, 800);
  };

  const handleTest = (type) => {
    setTestResult(`Test ${type} notification sent! (Simulated)`);
    setTimeout(() => setTestResult(''), 2000);
  };

  return (
    <div className="notification-settings-container">
      <div className="content-header">
        <h1>Notifications Settings</h1>
        <p>Configure how notifications are sent to users</p>
      </div>
      <div className="settings-section">
        <div className="toggle-row">
          <label>Email Notifications</label>
          <input type="checkbox" checked={settings.email} onChange={() => handleToggle('email')} />
        </div>
        <div className="toggle-row">
          <label>SMS Notifications</label>
          <input type="checkbox" checked={settings.sms} onChange={() => handleToggle('sms')} />
        </div>
        <div className="toggle-row">
          <label>In-App Notifications</label>
          <input type="checkbox" checked={settings.inApp} onChange={() => handleToggle('inApp')} />
        </div>
      </div>
      <div className="templates-section">
        <h3>Notification Templates</h3>
        <div className="template-group">
          <label>Email Template</label>
          <textarea name="emailTemplate" value={settings.emailTemplate} onChange={handleChange} />
          <button className="btn-secondary" onClick={() => handleTest('Email')}>Test Email</button>
        </div>
        <div className="template-group">
          <label>SMS Template</label>
          <textarea name="smsTemplate" value={settings.smsTemplate} onChange={handleChange} />
          <button className="btn-secondary" onClick={() => handleTest('SMS')}>Test SMS</button>
        </div>
        <div className="template-group">
          <label>In-App Template</label>
          <textarea name="inAppTemplate" value={settings.inAppTemplate} onChange={handleChange} />
          <button className="btn-secondary" onClick={() => handleTest('In-App')}>Test In-App</button>
        </div>
      </div>
      <div className="actions-row">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
        {testResult && <span className="test-result">{testResult}</span>}
      </div>
    </div>
  );
};

export default NotificationSettings;