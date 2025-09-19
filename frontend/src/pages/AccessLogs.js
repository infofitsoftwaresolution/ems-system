import React, { useState, useEffect } from 'react';
import './AccessLogs.css';

const AccessLogs = () => {
  const [logs, setLogs] = useState([
    {
      id: 1,
      timestamp: '2024-01-15 14:30:25',
      user: 'John Doe',
      email: 'john.doe@company.com',
      action: 'Login',
      status: 'Success',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      sessionDuration: '45 minutes'
    },
    {
      id: 2,
      timestamp: '2024-01-15 14:25:10',
      user: 'Jane Smith',
      email: 'jane.smith@company.com',
      action: 'Access Site Admin',
      status: 'Success',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      sessionDuration: '30 minutes'
    },
    {
      id: 3,
      timestamp: '2024-01-15 14:20:15',
      user: 'Mike Johnson',
      email: 'mike.johnson@company.com',
      action: 'Login Attempt',
      status: 'Failed',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      sessionDuration: 'N/A'
    },
    {
      id: 4,
      timestamp: '2024-01-15 14:15:30',
      user: 'Sarah Wilson',
      email: 'sarah.wilson@company.com',
      action: 'Logout',
      status: 'Success',
      ipAddress: '192.168.1.103',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      sessionDuration: '2 hours 15 minutes'
    },
    {
      id: 5,
      timestamp: '2024-01-15 14:10:45',
      user: 'Unknown',
      email: 'unknown@external.com',
      action: 'Login Attempt',
      status: 'Blocked',
      ipAddress: '203.0.113.45',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      sessionDuration: 'N/A'
    }
  ]);

  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    action: 'all',
    dateRange: 'all',
    searchQuery: ''
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const savedLogs = localStorage.getItem('accessLogs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
  }, []);

  useEffect(() => {
    let filtered = [...logs];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(log => log.status.toLowerCase() === filters.status);
    }

    // Filter by action
    if (filters.action !== 'all') {
      filtered = filtered.filter(log => log.action.toLowerCase().includes(filters.action.toLowerCase()));
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        switch (filters.dateRange) {
          case 'today':
            return logDate >= today;
          case 'yesterday':
            return logDate >= yesterday && logDate < today;
          case 'lastWeek':
            return logDate >= lastWeek;
          case 'lastMonth':
            return logDate >= lastMonth;
          default:
            return true;
        }
      });
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.user.toLowerCase().includes(query) ||
        log.email.toLowerCase().includes(query) ||
        log.ipAddress.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query)
      );
    }

    setFilteredLogs(filtered);
  }, [logs, filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const handleLogClick = (log) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedLog(null);
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      const csvContent = generateCSV(filteredLogs);
      downloadCSV(csvContent, 'access_logs.csv');
      setExporting(false);
    }, 1000);
  };

  const generateCSV = (logs) => {
    const headers = ['Timestamp', 'User', 'Email', 'Action', 'Status', 'IP Address', 'User Agent', 'Session Duration'];
    const rows = logs.map(log => [
      log.timestamp,
      log.user,
      log.email,
      log.action,
      log.status,
      log.ipAddress,
      log.userAgent,
      log.sessionDuration
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'success': return '#28a745';
      case 'failed': return '#dc3545';
      case 'blocked': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getActionIcon = (action) => {
    switch (action.toLowerCase()) {
      case 'login': return '🔑';
      case 'logout': return '🚪';
      case 'access site admin': return '🔧';
      case 'login attempt': return '⚠️';
      default: return '📝';
    }
  };

  return (
    <div className="access-logs-container">
      <div className="content-header">
        <h1>Access Logs</h1>
        <p>Monitor and review Site Administration access attempts and activities</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Action</label>
            <select 
              value={filters.action} 
              onChange={(e) => handleFilterChange('action', e.target.value)}
            >
              <option value="all">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="access site admin">Access Site Admin</option>
              <option value="login attempt">Login Attempt</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Date Range</label>
            <select 
              value={filters.dateRange} 
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="lastWeek">Last Week</option>
              <option value="lastMonth">Last Month</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Search</label>
            <input 
              type="text" 
              placeholder="Search users, emails, IPs..."
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            />
          </div>
        </div>

        <div className="filters-actions">
          <button className="btn-secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <span className="results-count">
            Showing {filteredLogs.length} of {logs.length} logs
          </span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="logs-section">
        <div className="logs-table">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Status</th>
                <th>IP Address</th>
                <th>Session Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} className={`log-row ${log.status.toLowerCase()}`}>
                  <td>{log.timestamp}</td>
                  <td>
                    <div className="user-info">
                      <span className="user-name">{log.user}</span>
                      <span className="user-email">{log.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className="action-cell">
                      <span className="action-icon">{getActionIcon(log.action)}</span>
                      <span className="action-text">{log.action}</span>
                    </div>
                  </td>
                  <td>
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(log.status) }}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td>{log.ipAddress}</td>
                  <td>{log.sessionDuration}</td>
                  <td>
                    <button 
                      className="btn-details" 
                      onClick={() => handleLogClick(log)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-section">
        <h3>Access Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Total Logs</h4>
            <span className="stat-number">{logs.length}</span>
          </div>
          <div className="stat-card">
            <h4>Successful Logins</h4>
            <span className="stat-number">{logs.filter(log => log.status === 'Success').length}</span>
          </div>
          <div className="stat-card">
            <h4>Failed Attempts</h4>
            <span className="stat-number">{logs.filter(log => log.status === 'Failed').length}</span>
          </div>
          <div className="stat-card">
            <h4>Blocked Attempts</h4>
            <span className="stat-number">{logs.filter(log => log.status === 'Blocked').length}</span>
          </div>
        </div>
      </div>

      {/* Log Details Modal */}
      {showDetails && selectedLog && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log Details</h3>
              <button className="modal-close" onClick={handleCloseDetails}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <label>Timestamp:</label>
                <span>{selectedLog.timestamp}</span>
              </div>
              <div className="detail-row">
                <label>User:</label>
                <span>{selectedLog.user}</span>
              </div>
              <div className="detail-row">
                <label>Email:</label>
                <span>{selectedLog.email}</span>
              </div>
              <div className="detail-row">
                <label>Action:</label>
                <span>{selectedLog.action}</span>
              </div>
              <div className="detail-row">
                <label>Status:</label>
                <span 
                  className="status-badge" 
                  style={{ backgroundColor: getStatusColor(selectedLog.status) }}
                >
                  {selectedLog.status}
                </span>
              </div>
              <div className="detail-row">
                <label>IP Address:</label>
                <span>{selectedLog.ipAddress}</span>
              </div>
              <div className="detail-row">
                <label>User Agent:</label>
                <span className="user-agent">{selectedLog.userAgent}</span>
              </div>
              <div className="detail-row">
                <label>Session Duration:</label>
                <span>{selectedLog.sessionDuration}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleCloseDetails}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessLogs; 