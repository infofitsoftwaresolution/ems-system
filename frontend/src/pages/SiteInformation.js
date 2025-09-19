import React, { useState, useEffect } from 'react';
import './SiteInformation.css';

const SiteInformation = () => {
  const [systemInfo, setSystemInfo] = useState({
    version: '2.1.0',
    buildDate: '2024-01-15',
    uptime: '15 days, 8 hours, 32 minutes',
    lastRestart: '2024-01-01 00:00:00',
    serverTime: new Date().toLocaleString(),
    timezone: 'UTC',
    environment: 'Production'
  });
  const [userStats] = useState({
    totalUsers: 247,
    activeUsers: 189,
    newUsersThisMonth: 23,
    totalSessions: 1247,
    averageSessionTime: '45 minutes'
  });
  const [serverStats] = useState({
    cpuUsage: 23,
    memoryUsage: 67,
    diskUsage: 45,
    networkTraffic: '2.3 GB',
    activeConnections: 89
  });
  const [systemHealth] = useState({
    database: 'healthy',
    cache: 'healthy',
    email: 'healthy',
    backup: 'warning',
    security: 'healthy'
  });
  const [recentActivity] = useState([
    {
      id: 1,
      type: 'user_login',
      message: 'User login: john.doe@company.com',
      timestamp: '2024-01-15 14:30:22',
      severity: 'info'
    },
    {
      id: 2,
      type: 'system_backup',
      message: 'Automated backup completed successfully',
      timestamp: '2024-01-15 02:00:15',
      severity: 'success'
    },
    {
      id: 3,
      type: 'error_log',
      message: 'Database connection timeout (resolved)',
      timestamp: '2024-01-15 01:45:33',
      severity: 'warning'
    },
    {
      id: 4,
      type: 'user_registration',
      message: 'New user registered: jane.smith@company.com',
      timestamp: '2024-01-15 01:20:45',
      severity: 'info'
    }
  ]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setSystemInfo(prev => ({
        ...prev,
        serverTime: new Date().toLocaleString()
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return '#28a745';
      case 'warning': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📋';
    }
  };



  return (
    <div className="site-information-container">
      <div className="content-header">
        <h1>Site Information</h1>
        <p>System overview, statistics, and health monitoring</p>
      </div>

      <div className="info-grid">
        {/* System Information */}
        <div className="info-card">
          <div className="card-header">
            <h3>System Information</h3>
            <span className="card-icon">⚙️</span>
          </div>
          <div className="card-content">
            <div className="info-row">
              <span className="info-label">Version:</span>
              <span className="info-value">{systemInfo.version}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Build Date:</span>
              <span className="info-value">{systemInfo.buildDate}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Uptime:</span>
              <span className="info-value">{systemInfo.uptime}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Last Restart:</span>
              <span className="info-value">{systemInfo.lastRestart}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Server Time:</span>
              <span className="info-value">{systemInfo.serverTime}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Timezone:</span>
              <span className="info-value">{systemInfo.timezone}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Environment:</span>
              <span className="info-value">
                <span className={`env-badge ${systemInfo.environment.toLowerCase()}`}>
                  {systemInfo.environment}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* User Statistics */}
        <div className="info-card">
          <div className="card-header">
            <h3>User Statistics</h3>
            <span className="card-icon">👥</span>
          </div>
          <div className="card-content">
            <div className="stat-grid">
              <div className="stat-item">
                <span className="stat-number">{userStats.totalUsers}</span>
                <span className="stat-label">Total Users</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{userStats.activeUsers}</span>
                <span className="stat-label">Active Users</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{userStats.newUsersThisMonth}</span>
                <span className="stat-label">New This Month</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{userStats.totalSessions}</span>
                <span className="stat-label">Total Sessions</span>
              </div>
            </div>
            <div className="info-row">
              <span className="info-label">Avg Session Time:</span>
              <span className="info-value">{userStats.averageSessionTime}</span>
            </div>
          </div>
        </div>

        {/* Server Statistics */}
        <div className="info-card">
          <div className="card-header">
            <h3>Server Statistics</h3>
            <span className="card-icon">🖥️</span>
          </div>
          <div className="card-content">
            <div className="progress-item">
              <div className="progress-header">
                <span className="progress-label">CPU Usage</span>
                <span className="progress-value">{serverStats.cpuUsage}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${serverStats.cpuUsage}%`, backgroundColor: serverStats.cpuUsage > 80 ? '#dc3545' : serverStats.cpuUsage > 60 ? '#ffc107' : '#28a745' }}
                ></div>
              </div>
            </div>
            <div className="progress-item">
              <div className="progress-header">
                <span className="progress-label">Memory Usage</span>
                <span className="progress-value">{serverStats.memoryUsage}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${serverStats.memoryUsage}%`, backgroundColor: serverStats.memoryUsage > 80 ? '#dc3545' : serverStats.memoryUsage > 60 ? '#ffc107' : '#28a745' }}
                ></div>
              </div>
            </div>
            <div className="progress-item">
              <div className="progress-header">
                <span className="progress-label">Disk Usage</span>
                <span className="progress-value">{serverStats.diskUsage}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${serverStats.diskUsage}%`, backgroundColor: serverStats.diskUsage > 80 ? '#dc3545' : serverStats.diskUsage > 60 ? '#ffc107' : '#28a745' }}
                ></div>
              </div>
            </div>
            <div className="info-row">
              <span className="info-label">Network Traffic:</span>
              <span className="info-value">{serverStats.networkTraffic}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Active Connections:</span>
              <span className="info-value">{serverStats.activeConnections}</span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="info-card">
          <div className="card-header">
            <h3>System Health</h3>
            <span className="card-icon">🏥</span>
          </div>
          <div className="card-content">
            {Object.entries(systemHealth).map(([service, status]) => (
              <div key={service} className="health-item">
                <div className="health-info">
                  <span className="health-service">{service.charAt(0).toUpperCase() + service.slice(1)}</span>
                  <span 
                    className="health-status"
                    style={{ backgroundColor: getHealthColor(status) }}
                  >
                    {status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <div className="section-header">
          <h3>Recent Activity</h3>
          <button className="btn-secondary">View All Logs</button>
        </div>
        <div className="activity-list">
          {recentActivity.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {getSeverityIcon(activity.severity)}
              </div>
              <div className="activity-content">
                <div className="activity-message">{activity.message}</div>
                <div className="activity-time">{activity.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn">
            <span className="action-icon">🔄</span>
            <span className="action-text">Refresh Stats</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">📊</span>
            <span className="action-text">Generate Report</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">🔧</span>
            <span className="action-text">System Maintenance</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">📋</span>
            <span className="action-text">View Logs</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SiteInformation; 