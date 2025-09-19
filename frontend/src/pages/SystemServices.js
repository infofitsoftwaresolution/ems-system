import React, { useState, useEffect } from 'react';
import './SystemServices.css';

const SystemServices = () => {
  const [services, setServices] = useState({
    email: {
      enabled: true,
      provider: 'smtp',
      host: 'smtp.gmail.com',
      port: 587,
      username: 'admin@company.com',
      secure: true,
      status: 'running'
    },
    sms: {
      enabled: false,
      provider: 'twilio',
      accountSid: '',
      authToken: '',
      fromNumber: '',
      status: 'stopped'
    },
    backup: {
      enabled: true,
      frequency: 'daily',
      retention: 30,
      location: 'cloud',
      lastBackup: '2024-01-15 02:00:00',
      status: 'running'
    },
    monitoring: {
      enabled: true,
      interval: 5,
      alerts: true,
      status: 'running'
    }
  });
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('systemServices');
    if (saved) setServices(JSON.parse(saved));
  }, []);

  const handleToggle = (serviceKey) => {
    setServices(prev => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        enabled: !prev[serviceKey].enabled,
        status: !prev[serviceKey].enabled ? 'running' : 'stopped'
      }
    }));
  };

  const handleServiceChange = (serviceKey, field, value) => {
    setServices(prev => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('systemServices', JSON.stringify(services));
      setSaving(false);
      alert('System services configuration saved!');
    }, 800);
  };

  const handleTest = (serviceKey) => {
    setTestResult(`Testing ${serviceKey} service...`);
    setTimeout(() => {
      setTestResult(`${serviceKey} service test completed successfully!`);
      setTimeout(() => setTestResult(''), 2000);
    }, 1500);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return '#28a745';
      case 'stopped': return '#dc3545';
      case 'error': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <div className="system-services-container">
      <div className="content-header">
        <h1>System Services</h1>
        <p>Manage background services and integrations</p>
      </div>

      <div className="services-grid">
        {/* Email Service */}
        <div className="service-card">
          <div className="service-header">
            <h3>Email Service</h3>
            <div className="service-status" style={{ backgroundColor: getStatusColor(services.email.status) }}>
              {services.email.status}
            </div>
          </div>
          <div className="service-content">
            <div className="toggle-row">
              <label>Enable Email Service</label>
              <input type="checkbox" checked={services.email.enabled} onChange={() => handleToggle('email')} />
            </div>
            <div className="config-group">
              <label>SMTP Host</label>
              <input 
                type="text" 
                value={services.email.host} 
                onChange={(e) => handleServiceChange('email', 'host', e.target.value)}
                disabled={!services.email.enabled}
              />
            </div>
            <div className="config-row">
              <div className="config-group">
                <label>Port</label>
                <input 
                  type="number" 
                  value={services.email.port} 
                  onChange={(e) => handleServiceChange('email', 'port', parseInt(e.target.value))}
                  disabled={!services.email.enabled}
                />
              </div>
              <div className="config-group">
                <label>Username</label>
                <input 
                  type="text" 
                  value={services.email.username} 
                  onChange={(e) => handleServiceChange('email', 'username', e.target.value)}
                  disabled={!services.email.enabled}
                />
              </div>
            </div>
            <div className="toggle-row">
              <label>Use SSL/TLS</label>
              <input 
                type="checkbox" 
                checked={services.email.secure} 
                onChange={(e) => handleServiceChange('email', 'secure', e.target.checked)}
                disabled={!services.email.enabled}
              />
            </div>
            <button className="btn-secondary" onClick={() => handleTest('email')} disabled={!services.email.enabled}>
              Test Email Service
            </button>
          </div>
        </div>

        {/* SMS Service */}
        <div className="service-card">
          <div className="service-header">
            <h3>SMS Service</h3>
            <div className="service-status" style={{ backgroundColor: getStatusColor(services.sms.status) }}>
              {services.sms.status}
            </div>
          </div>
          <div className="service-content">
            <div className="toggle-row">
              <label>Enable SMS Service</label>
              <input type="checkbox" checked={services.sms.enabled} onChange={() => handleToggle('sms')} />
            </div>
            <div className="config-group">
              <label>Account SID</label>
              <input 
                type="text" 
                value={services.sms.accountSid} 
                onChange={(e) => handleServiceChange('sms', 'accountSid', e.target.value)}
                disabled={!services.sms.enabled}
                placeholder="Enter Twilio Account SID"
              />
            </div>
            <div className="config-group">
              <label>Auth Token</label>
              <input 
                type="password" 
                value={services.sms.authToken} 
                onChange={(e) => handleServiceChange('sms', 'authToken', e.target.value)}
                disabled={!services.sms.enabled}
                placeholder="Enter Twilio Auth Token"
              />
            </div>
            <div className="config-group">
              <label>From Number</label>
              <input 
                type="text" 
                value={services.sms.fromNumber} 
                onChange={(e) => handleServiceChange('sms', 'fromNumber', e.target.value)}
                disabled={!services.sms.enabled}
                placeholder="+1234567890"
              />
            </div>
            <button className="btn-secondary" onClick={() => handleTest('sms')} disabled={!services.sms.enabled}>
              Test SMS Service
            </button>
          </div>
        </div>

        {/* Backup Service */}
        <div className="service-card">
          <div className="service-header">
            <h3>Backup Service</h3>
            <div className="service-status" style={{ backgroundColor: getStatusColor(services.backup.status) }}>
              {services.backup.status}
            </div>
          </div>
          <div className="service-content">
            <div className="toggle-row">
              <label>Enable Auto Backup</label>
              <input type="checkbox" checked={services.backup.enabled} onChange={() => handleToggle('backup')} />
            </div>
            <div className="config-group">
              <label>Backup Frequency</label>
              <select 
                value={services.backup.frequency} 
                onChange={(e) => handleServiceChange('backup', 'frequency', e.target.value)}
                disabled={!services.backup.enabled}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="config-group">
              <label>Retention (days)</label>
              <input 
                type="number" 
                value={services.backup.retention} 
                onChange={(e) => handleServiceChange('backup', 'retention', parseInt(e.target.value))}
                disabled={!services.backup.enabled}
                min="1"
                max="365"
              />
            </div>
            <div className="config-group">
              <label>Backup Location</label>
              <select 
                value={services.backup.location} 
                onChange={(e) => handleServiceChange('backup', 'location', e.target.value)}
                disabled={!services.backup.enabled}
              >
                <option value="local">Local Storage</option>
                <option value="cloud">Cloud Storage</option>
                <option value="external">External Drive</option>
              </select>
            </div>
            <div className="last-backup">
              <small>Last backup: {services.backup.lastBackup}</small>
            </div>
            <button className="btn-secondary" onClick={() => handleTest('backup')} disabled={!services.backup.enabled}>
              Run Manual Backup
            </button>
          </div>
        </div>

        {/* Monitoring Service */}
        <div className="service-card">
          <div className="service-header">
            <h3>System Monitoring</h3>
            <div className="service-status" style={{ backgroundColor: getStatusColor(services.monitoring.status) }}>
              {services.monitoring.status}
            </div>
          </div>
          <div className="service-content">
            <div className="toggle-row">
              <label>Enable Monitoring</label>
              <input type="checkbox" checked={services.monitoring.enabled} onChange={() => handleToggle('monitoring')} />
            </div>
            <div className="config-group">
              <label>Check Interval (minutes)</label>
              <input 
                type="number" 
                value={services.monitoring.interval} 
                onChange={(e) => handleServiceChange('monitoring', 'interval', parseInt(e.target.value))}
                disabled={!services.monitoring.enabled}
                min="1"
                max="60"
              />
            </div>
            <div className="toggle-row">
              <label>Enable Alerts</label>
              <input 
                type="checkbox" 
                checked={services.monitoring.alerts} 
                onChange={(e) => handleServiceChange('monitoring', 'alerts', e.target.checked)}
                disabled={!services.monitoring.enabled}
              />
            </div>
            <button className="btn-secondary" onClick={() => handleTest('monitoring')} disabled={!services.monitoring.enabled}>
              Test Monitoring
            </button>
          </div>
        </div>
      </div>

      <div className="actions-row">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
        {testResult && <span className="test-result">{testResult}</span>}
      </div>
    </div>
  );
};

export default SystemServices; 