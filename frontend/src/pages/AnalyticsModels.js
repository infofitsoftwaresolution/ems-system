import React, { useState, useEffect } from 'react';
import './AnalyticsModels.css';

const AnalyticsModels = () => {
  const [models, setModels] = useState([
    {
      id: 1,
      name: 'User Engagement Predictor',
      description: 'Predicts user engagement based on activity patterns',
      type: 'Machine Learning',
      status: 'active',
      accuracy: 87.5,
      lastTrained: '2024-01-10',
      version: '2.1.0',
      dataSource: 'User Activity Logs',
      algorithm: 'Random Forest',
      performance: 'excellent'
    },
    {
      id: 2,
      name: 'Churn Prediction Model',
      description: 'Identifies users likely to leave the platform',
      type: 'Predictive Analytics',
      status: 'active',
      accuracy: 92.3,
      lastTrained: '2024-01-12',
      version: '1.8.2',
      dataSource: 'User Behavior Data',
      algorithm: 'Gradient Boosting',
      performance: 'excellent'
    },
    {
      id: 3,
      name: 'Content Recommendation Engine',
      description: 'Recommends relevant content to users',
      type: 'Recommendation System',
      status: 'training',
      accuracy: 78.9,
      lastTrained: '2024-01-15',
      version: '3.0.1',
      dataSource: 'Content Interaction Data',
      algorithm: 'Collaborative Filtering',
      performance: 'good'
    },
    {
      id: 4,
      name: 'Performance Anomaly Detector',
      description: 'Detects unusual system performance patterns',
      type: 'Anomaly Detection',
      status: 'inactive',
      accuracy: 94.1,
      lastTrained: '2024-01-08',
      version: '1.5.3',
      dataSource: 'System Metrics',
      algorithm: 'Isolation Forest',
      performance: 'excellent'
    }
  ]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [newModel, setNewModel] = useState({
    name: '',
    description: '',
    type: 'Machine Learning',
    dataSource: '',
    algorithm: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('analyticsModels');
    if (saved) setModels(JSON.parse(saved));
  }, []);

  const handleCreateModel = () => {
    if (!newModel.name.trim() || !newModel.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    
    const model = {
      ...newModel,
      id: Date.now(),
      status: 'inactive',
      accuracy: 0,
      lastTrained: 'Never',
      version: '1.0.0',
      performance: 'pending'
    };
    
    setModels(prev => [...prev, model]);
    setNewModel({
      name: '',
      description: '',
      type: 'Machine Learning',
      dataSource: '',
      algorithm: ''
    });
    setShowCreateModal(false);
    localStorage.setItem('analyticsModels', JSON.stringify([...models, model]));
  };

  const handleEditModel = (model) => {
    setEditingModel(model);
    setShowEditModal(true);
  };

  const handleUpdateModel = () => {
    if (!editingModel.name.trim() || !editingModel.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    
    setModels(prev => prev.map(m => m.id === editingModel.id ? editingModel : m));
    setShowEditModal(false);
    setEditingModel(null);
    localStorage.setItem('analyticsModels', JSON.stringify(models.map(m => m.id === editingModel.id ? editingModel : m)));
  };

  const handleDeleteModel = (modelId) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      const updatedModels = models.filter(m => m.id !== modelId);
      setModels(updatedModels);
      localStorage.setItem('analyticsModels', JSON.stringify(updatedModels));
    }
  };

  const handleTrainModel = (modelId) => {
    setModels(prev => prev.map(m => 
      m.id === modelId 
        ? { 
            ...m, 
            status: 'training',
            lastTrained: new Date().toISOString().split('T')[0],
            accuracy: Math.floor(Math.random() * 20) + 80,
            version: `${parseFloat(m.version) + 0.1}`.slice(0, 4)
          }
        : m
    ));
    
    // Simulate training completion
    setTimeout(() => {
      setModels(prev => prev.map(m => 
        m.id === modelId 
          ? { ...m, status: 'active' }
          : m
      ));
    }, 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'training': return '#ffc107';
      case 'inactive': return '#6c757d';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'excellent': return '#28a745';
      case 'good': return '#17a2b8';
      case 'fair': return '#ffc107';
      case 'poor': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Machine Learning': return '🤖';
      case 'Predictive Analytics': return '🔮';
      case 'Recommendation System': return '💡';
      case 'Anomaly Detection': return '⚠️';
      default: return '📊';
    }
  };

  return (
    <div className="analytics-models-container">
      <div className="content-header">
        <h1>Analytics Models</h1>
        <p>Manage and monitor predictive analytics and machine learning models</p>
      </div>

      <div className="models-overview">
        <div className="overview-stats">
          <div className="stat-item">
            <span className="stat-number">{models.length}</span>
            <span className="stat-label">Total Models</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{models.filter(m => m.status === 'active').length}</span>
            <span className="stat-label">Active Models</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{models.filter(m => m.status === 'training').length}</span>
            <span className="stat-label">Training</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {(models.reduce((acc, m) => acc + m.accuracy, 0) / models.length).toFixed(1)}%
            </span>
            <span className="stat-label">Avg Accuracy</span>
          </div>
        </div>
      </div>

      <div className="models-section">
        <div className="section-header">
          <h3>Available Models</h3>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            Create New Model
          </button>
        </div>

        <div className="models-grid">
          {models.map(model => (
            <div key={model.id} className="model-card">
              <div className="model-header">
                <div className="model-info">
                  <span className="type-icon">{getTypeIcon(model.type)}</span>
                  <div>
                    <h4>{model.name}</h4>
                    <span className="model-type">{model.type}</span>
                  </div>
                </div>
                <div className="model-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(model.status) }}
                  >
                    {model.status}
                  </span>
                </div>
              </div>
              
              <p className="model-description">{model.description}</p>
              
              <div className="model-metrics">
                <div className="metric-item">
                  <span className="metric-label">Accuracy:</span>
                  <span className="metric-value">{model.accuracy}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Version:</span>
                  <span className="metric-value">{model.version}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Algorithm:</span>
                  <span className="metric-value">{model.algorithm}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Performance:</span>
                  <span 
                    className="performance-badge"
                    style={{ backgroundColor: getPerformanceColor(model.performance) }}
                  >
                    {model.performance}
                  </span>
                </div>
              </div>
              
              <div className="model-details">
                <div className="detail-item">
                  <span className="detail-label">Data Source:</span>
                  <span className="detail-value">{model.dataSource}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Last Trained:</span>
                  <span className="detail-value">{model.lastTrained}</span>
                </div>
              </div>
              
              <div className="model-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => handleTrainModel(model.id)}
                  disabled={model.status === 'training'}
                >
                  {model.status === 'training' ? 'Training...' : 'Train Model'}
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => handleEditModel(model)}
                >
                  Edit
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => handleDeleteModel(model.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Model Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Model</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Model Name</label>
                <input 
                  type="text" 
                  value={newModel.name}
                  onChange={(e) => setNewModel(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter model name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={newModel.description}
                  onChange={(e) => setNewModel(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the model's purpose"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Model Type</label>
                <select 
                  value={newModel.type}
                  onChange={(e) => setNewModel(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Predictive Analytics">Predictive Analytics</option>
                  <option value="Recommendation System">Recommendation System</option>
                  <option value="Anomaly Detection">Anomaly Detection</option>
                </select>
              </div>
              <div className="form-group">
                <label>Data Source</label>
                <input 
                  type="text" 
                  value={newModel.dataSource}
                  onChange={(e) => setNewModel(prev => ({ ...prev, dataSource: e.target.value }))}
                  placeholder="Enter data source"
                />
              </div>
              <div className="form-group">
                <label>Algorithm</label>
                <input 
                  type="text" 
                  value={newModel.algorithm}
                  onChange={(e) => setNewModel(prev => ({ ...prev, algorithm: e.target.value }))}
                  placeholder="Enter algorithm name"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateModel}>Create Model</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Model Modal */}
      {showEditModal && editingModel && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Model</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Model Name</label>
                <input 
                  type="text" 
                  value={editingModel.name}
                  onChange={(e) => setEditingModel(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={editingModel.description}
                  onChange={(e) => setEditingModel(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Model Type</label>
                <select 
                  value={editingModel.type}
                  onChange={(e) => setEditingModel(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Predictive Analytics">Predictive Analytics</option>
                  <option value="Recommendation System">Recommendation System</option>
                  <option value="Anomaly Detection">Anomaly Detection</option>
                </select>
              </div>
              <div className="form-group">
                <label>Data Source</label>
                <input 
                  type="text" 
                  value={editingModel.dataSource}
                  onChange={(e) => setEditingModel(prev => ({ ...prev, dataSource: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Algorithm</label>
                <input 
                  type="text" 
                  value={editingModel.algorithm}
                  onChange={(e) => setEditingModel(prev => ({ ...prev, algorithm: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdateModel}>Update Model</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsModels; 