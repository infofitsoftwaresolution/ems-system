import React, { useState, useEffect } from 'react';
import './AnalyticsSettings.css';

const AnalyticsSettings = () => {
  const [settings, setSettings] = useState({
    enableAnalytics: true,
    trackUserBehavior: true,
    trackPageViews: true,
    trackClicks: true,
    trackFormSubmissions: true,
    trackErrors: true,
    trackPerformance: true,
    anonymizeData: false,
    dataRetention: 365,
    realTimeTracking: true,
    exportData: true,
    thirdPartyAnalytics: false,
    customEvents: true,
    heatmapTracking: false,
    sessionRecording: false
  });
  const [privacySettings, setPrivacySettings] = useState({
    gdprCompliance: true,
    cookieConsent: true,
    dataEncryption: true,
    ipAnonymization: true,
    userConsent: true,
    dataPortability: true,
    rightToDelete: true
  });
  const [trackingRules, setTrackingRules] = useState([
    {
      id: 1,
      name: 'User Login Events',
      description: 'Track user login/logout activities',
      enabled: true,
      category: 'Authentication'
    },
    {
      id: 2,
      name: 'Page Navigation',
      description: 'Track page views and navigation patterns',
      enabled: true,
      category: 'Navigation'
    },
    {
      id: 3,
      name: 'Form Interactions',
      description: 'Track form submissions and field interactions',
      enabled: true,
      category: 'Forms'
    },
    {
      id: 4,
      name: 'Error Tracking',
      description: 'Track application errors and exceptions',
      enabled: true,
      category: 'Errors'
    },
    {
      id: 5,
      name: 'Performance Metrics',
      description: 'Track page load times and performance',
      enabled: true,
      category: 'Performance'
    }
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('analyticsSettings');
    const savedPrivacy = localStorage.getItem('analyticsPrivacySettings');
    const savedRules = localStorage.getItem('analyticsTrackingRules');
    
    if (saved) setSettings(JSON.parse(saved));
    if (savedPrivacy) setPrivacySettings(JSON.parse(savedPrivacy));
    if (savedRules) setTrackingRules(JSON.parse(savedRules));
  }, []);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrivacyToggle = (key) => {
    setPrivacySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRuleToggle = (ruleId) => {
    setTrackingRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const handleChange = (e) => {
    const fieldName = e.target.name;
    const { value, type } = e.target;
    setSettings(prev => ({ 
      ...prev, 
      [fieldName]: type === 'number' ? parseInt(value) || 0 : value 
    }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('analyticsSettings', JSON.stringify(settings));
      localStorage.setItem('analyticsPrivacySettings', JSON.stringify(privacySettings));
      localStorage.setItem('analyticsTrackingRules', JSON.stringify(trackingRules));
      setSaving(false);
      alert('Analytics settings saved successfully!');
    }, 800);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all analytics settings to default?')) {
      setSettings({
        enableAnalytics: true,
        trackUserBehavior: true,
        trackPageViews: true,
        trackClicks: true,
        trackFormSubmissions: true,
        trackErrors: true,
        trackPerformance: true,
        anonymizeData: false,
        dataRetention: 365,
        realTimeTracking: true,
        exportData: true,
        thirdPartyAnalytics: false,
        customEvents: true,
        heatmapTracking: false,
        sessionRecording: false
      });
      setPrivacySettings({
        gdprCompliance: true,
        cookieConsent: true,
        dataEncryption: true,
        ipAnonymization: true,
        userConsent: true,
        dataPortability: true,
        rightToDelete: true
      });
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Authentication': return '🔐';
      case 'Navigation': return '🧭';
      case 'Forms': return '📝';
      case 'Errors': return '⚠️';
      case 'Performance': return '⚡';
      default: return '📊';
    }
  };

  return (
    <div className="analytics-settings-container">
      <div className="content-header">
        <h1>Analytics Settings</h1>
        <p>Configure data tracking, privacy, and analytics preferences</p>
      </div>

      <div className="settings-grid">
        {/* General Analytics Settings */}
        <div className="settings-section">
          <h3>General Analytics</h3>
          <div className="toggle-row">
            <label>Enable Analytics</label>
            <input type="checkbox" checked={settings.enableAnalytics} onChange={() => handleToggle('enableAnalytics')} />
          </div>
          <div className="toggle-row">
            <label>Real-time Tracking</label>
            <input type="checkbox" checked={settings.realTimeTracking} onChange={() => handleToggle('realTimeTracking')} />
          </div>
          <div className="toggle-row">
            <label>Custom Events Tracking</label>
            <input type="checkbox" checked={settings.customEvents} onChange={() => handleToggle('customEvents')} />
          </div>
          <div className="toggle-row">
            <label>Third-party Analytics</label>
            <input type="checkbox" checked={settings.thirdPartyAnalytics} onChange={() => handleToggle('thirdPartyAnalytics')} />
          </div>
          <div className="input-row">
            <label>Data Retention (days)</label>
            <input 
              type="number" 
              name="dataRetention" 
              value={settings.dataRetention} 
              onChange={handleChange}
              min="30"
              max="2555"
            />
          </div>
        </div>

        {/* Data Tracking Settings */}
        <div className="settings-section">
          <h3>Data Tracking</h3>
          <div className="toggle-row">
            <label>Track User Behavior</label>
            <input type="checkbox" checked={settings.trackUserBehavior} onChange={() => handleToggle('trackUserBehavior')} />
          </div>
          <div className="toggle-row">
            <label>Track Page Views</label>
            <input type="checkbox" checked={settings.trackPageViews} onChange={() => handleToggle('trackPageViews')} />
          </div>
          <div className="toggle-row">
            <label>Track Clicks</label>
            <input type="checkbox" checked={settings.trackClicks} onChange={() => handleToggle('trackClicks')} />
          </div>
          <div className="toggle-row">
            <label>Track Form Submissions</label>
            <input type="checkbox" checked={settings.trackFormSubmissions} onChange={() => handleToggle('trackFormSubmissions')} />
          </div>
          <div className="toggle-row">
            <label>Track Errors</label>
            <input type="checkbox" checked={settings.trackErrors} onChange={() => handleToggle('trackErrors')} />
          </div>
          <div className="toggle-row">
            <label>Track Performance</label>
            <input type="checkbox" checked={settings.trackPerformance} onChange={() => handleToggle('trackPerformance')} />
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="settings-section">
          <h3>Privacy & Compliance</h3>
          <div className="toggle-row">
            <label>GDPR Compliance</label>
            <input type="checkbox" checked={privacySettings.gdprCompliance} onChange={() => handlePrivacyToggle('gdprCompliance')} />
          </div>
          <div className="toggle-row">
            <label>Cookie Consent</label>
            <input type="checkbox" checked={privacySettings.cookieConsent} onChange={() => handlePrivacyToggle('cookieConsent')} />
          </div>
          <div className="toggle-row">
            <label>Data Encryption</label>
            <input type="checkbox" checked={privacySettings.dataEncryption} onChange={() => handlePrivacyToggle('dataEncryption')} />
          </div>
          <div className="toggle-row">
            <label>IP Anonymization</label>
            <input type="checkbox" checked={privacySettings.ipAnonymization} onChange={() => handlePrivacyToggle('ipAnonymization')} />
          </div>
          <div className="toggle-row">
            <label>User Consent Required</label>
            <input type="checkbox" checked={privacySettings.userConsent} onChange={() => handlePrivacyToggle('userConsent')} />
          </div>
          <div className="toggle-row">
            <label>Data Portability</label>
            <input type="checkbox" checked={privacySettings.dataPortability} onChange={() => handlePrivacyToggle('dataPortability')} />
          </div>
          <div className="toggle-row">
            <label>Right to Delete</label>
            <input type="checkbox" checked={privacySettings.rightToDelete} onChange={() => handlePrivacyToggle('rightToDelete')} />
          </div>
        </div>

        {/* Advanced Tracking */}
        <div className="settings-section">
          <h3>Advanced Tracking</h3>
          <div className="toggle-row">
            <label>Anonymize Data</label>
            <input type="checkbox" checked={settings.anonymizeData} onChange={() => handleToggle('anonymizeData')} />
          </div>
          <div className="toggle-row">
            <label>Heatmap Tracking</label>
            <input type="checkbox" checked={settings.heatmapTracking} onChange={() => handleToggle('heatmapTracking')} />
          </div>
          <div className="toggle-row">
            <label>Session Recording</label>
            <input type="checkbox" checked={settings.sessionRecording} onChange={() => handleToggle('sessionRecording')} />
          </div>
          <div className="toggle-row">
            <label>Allow Data Export</label>
            <input type="checkbox" checked={settings.exportData} onChange={() => handleToggle('exportData')} />
          </div>
        </div>
      </div>

      {/* Tracking Rules */}
      <div className="tracking-rules-section">
        <div className="section-header">
          <h3>Tracking Rules</h3>
          <button className="btn-secondary">Add New Rule</button>
        </div>
        <div className="rules-grid">
          {trackingRules.map(rule => (
            <div key={rule.id} className="rule-card">
              <div className="rule-header">
                <div className="rule-info">
                  <span className="category-icon">{getCategoryIcon(rule.category)}</span>
                  <div>
                    <h4>{rule.name}</h4>
                    <span className="rule-category">{rule.category}</span>
                  </div>
                </div>
                <div className="rule-toggle">
                  <input 
                    type="checkbox" 
                    checked={rule.enabled} 
                    onChange={() => handleRuleToggle(rule.id)}
                  />
                </div>
              </div>
              <p className="rule-description">{rule.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="analytics-summary">
        <h3>Analytics Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Tracking Enabled</span>
            <span className="summary-value">{Object.values(settings).filter(Boolean).length} / {Object.keys(settings).length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Privacy Features</span>
            <span className="summary-value">{Object.values(privacySettings).filter(Boolean).length} / {Object.keys(privacySettings).length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Active Rules</span>
            <span className="summary-value">{trackingRules.filter(rule => rule.enabled).length} / {trackingRules.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Data Retention</span>
            <span className="summary-value">{settings.dataRetention} days</span>
          </div>
        </div>
      </div>

      <div className="actions-row">
        <button className="btn-secondary" onClick={handleReset}>
          Reset to Defaults
        </button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="info-section">
        <h4>Important Notes</h4>
        <ul>
          <li>Changes to analytics settings may take up to 24 hours to take effect</li>
          <li>Disabling certain tracking features may affect reporting accuracy</li>
          <li>Ensure compliance with local privacy laws and regulations</li>
          <li>Regular data retention cleanup occurs automatically</li>
        </ul>
      </div>
    </div>
  );
};

export default AnalyticsSettings; 