import React, { useState, useEffect } from 'react';
import './AdvancedFeatures.css';

const AdvancedFeatures = () => {
  const [features, setFeatures] = useState({
    betaMode: false,
    experimentalUI: false,
    advancedAnalytics: true,
    apiAccess: false,
    debugMode: false,
    performanceMonitoring: true,
    realTimeUpdates: false,
    advancedSearch: true,
    bulkOperations: false,
    customThemes: false,
    webhooks: false,
    dataExport: true,
    multiLanguage: false,
    darkMode: true,
    accessibilityMode: false
  });
  const [saving, setSaving] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('advancedFeatures');
    if (saved) setFeatures(JSON.parse(saved));
  }, []);

  const handleToggle = (key) => {
    if (['betaMode', 'experimentalUI', 'debugMode'].includes(key)) {
      setShowWarning(true);
    }
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('advancedFeatures', JSON.stringify(features));
      setSaving(false);
      alert('Advanced features configuration saved!');
    }, 800);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all advanced features to default?')) {
      setFeatures({
        betaMode: false,
        experimentalUI: false,
        advancedAnalytics: true,
        apiAccess: false,
        debugMode: false,
        performanceMonitoring: true,
        realTimeUpdates: false,
        advancedSearch: true,
        bulkOperations: false,
        customThemes: false,
        webhooks: false,
        dataExport: true,
        multiLanguage: false,
        darkMode: true,
        accessibilityMode: false
      });
    }
  };

  const featureCategories = [
    {
      name: 'Development & Testing',
      features: [
        { key: 'betaMode', label: 'Beta Mode', description: 'Enable beta features and experimental functionality', warning: true },
        { key: 'experimentalUI', label: 'Experimental UI', description: 'Try new interface designs and layouts', warning: true },
        { key: 'debugMode', label: 'Debug Mode', description: 'Enable detailed logging and debugging information', warning: true },
        { key: 'apiAccess', label: 'API Access', description: 'Enable REST API access for external integrations' }
      ]
    },
    {
      name: 'Performance & Monitoring',
      features: [
        { key: 'performanceMonitoring', label: 'Performance Monitoring', description: 'Track system performance metrics' },
        { key: 'realTimeUpdates', label: 'Real-time Updates', description: 'Enable live updates without page refresh' },
        { key: 'advancedAnalytics', label: 'Advanced Analytics', description: 'Enhanced reporting and data analysis' }
      ]
    },
    {
      name: 'User Experience',
      features: [
        { key: 'advancedSearch', label: 'Advanced Search', description: 'Enhanced search with filters and operators' },
        { key: 'bulkOperations', label: 'Bulk Operations', description: 'Perform actions on multiple items at once' },
        { key: 'customThemes', label: 'Custom Themes', description: 'Allow users to customize interface themes' },
        { key: 'darkMode', label: 'Dark Mode', description: 'Enable dark theme option' },
        { key: 'accessibilityMode', label: 'Accessibility Mode', description: 'Enhanced accessibility features' }
      ]
    },
    {
      name: 'Data & Integration',
      features: [
        { key: 'dataExport', label: 'Data Export', description: 'Export data in various formats (CSV, JSON, XML)' },
        { key: 'webhooks', label: 'Webhooks', description: 'Send real-time notifications to external systems' },
        { key: 'multiLanguage', label: 'Multi-language Support', description: 'Enable multiple language interfaces' }
      ]
    }
  ];

  return (
    <div className="advanced-features-container">
      <div className="content-header">
        <h1>Advanced Features</h1>
        <p>Configure experimental and advanced functionality</p>
      </div>

      {showWarning && (
        <div className="warning-banner">
          <div className="warning-content">
            <span className="warning-icon">⚠️</span>
            <div>
              <h4>Experimental Features Enabled</h4>
              <p>Some features may be unstable or not fully tested. Use with caution in production environments.</p>
            </div>
            <button className="warning-close" onClick={() => setShowWarning(false)}>×</button>
          </div>
        </div>
      )}

      <div className="features-grid">
        {featureCategories.map(category => (
          <div key={category.name} className="feature-category">
            <h3>{category.name}</h3>
            <div className="category-features">
              {category.features.map(feature => (
                <div key={feature.key} className="feature-item">
                  <div className="feature-info">
                    <div className="feature-header">
                      <label className="feature-label">
                        <input 
                          type="checkbox" 
                          checked={features[feature.key]} 
                          onChange={() => handleToggle(feature.key)}
                        />
                        <span className="feature-name">{feature.label}</span>
                        {feature.warning && <span className="warning-badge">Experimental</span>}
                      </label>
                    </div>
                    <p className="feature-description">{feature.description}</p>
                  </div>
                  <div className="feature-status">
                    <span className={`status-indicator ${features[feature.key] ? 'enabled' : 'disabled'}`}>
                      {features[feature.key] ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="feature-stats">
        <div className="stat-card">
          <h4>Enabled Features</h4>
          <span className="stat-number">
            {Object.values(features).filter(Boolean).length}
          </span>
          <span className="stat-total">of {Object.keys(features).length}</span>
        </div>
        <div className="stat-card">
          <h4>Experimental Features</h4>
          <span className="stat-number">
            {Object.entries(features).filter(([key, value]) => 
              ['betaMode', 'experimentalUI', 'debugMode'].includes(key) && value
            ).length}
          </span>
          <span className="stat-total">enabled</span>
        </div>
        <div className="stat-card">
          <h4>System Impact</h4>
          <span className="stat-number">
            {Object.entries(features).filter(([key, value]) => 
              ['performanceMonitoring', 'realTimeUpdates', 'advancedAnalytics'].includes(key) && value
            ).length > 0 ? 'Medium' : 'Low'}
          </span>
          <span className="stat-total">performance impact</span>
        </div>
      </div>

      <div className="actions-row">
        <button className="btn-secondary" onClick={handleReset}>
          Reset to Defaults
        </button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="info-section">
        <h4>Important Notes</h4>
        <ul>
          <li>Experimental features may be unstable and could affect system performance</li>
          <li>Some features require additional server resources</li>
          <li>Changes may take effect after a system restart</li>
          <li>Backup your data before enabling experimental features</li>
        </ul>
      </div>
    </div>
  );
};

export default AdvancedFeatures; 