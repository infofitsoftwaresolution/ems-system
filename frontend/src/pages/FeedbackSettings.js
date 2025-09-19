import React, { useState, useEffect } from 'react';
import './FeedbackSettings.css';

const FeedbackSettings = () => {
  const [settings, setSettings] = useState({
    enableFeedback: true,
    allowAnonymous: false,
    requireApproval: true,
    autoResponse: true,
    feedbackEmail: 'feedback@company.com'
  });
  const [feedbackForms, setFeedbackForms] = useState([
    {
      id: 1,
      name: 'General Feedback',
      description: 'General feedback about our platform',
      questions: [
        { id: 1, type: 'rating', question: 'How would you rate your experience?', required: true },
        { id: 2, type: 'text', question: 'What can we improve?', required: false },
        { id: 3, type: 'select', question: 'What category does this feedback belong to?', options: ['Bug Report', 'Feature Request', 'General'], required: true }
      ],
      active: true
    },
    {
      id: 2,
      name: 'Course Feedback',
      description: 'Feedback about specific courses',
      questions: [
        { id: 1, type: 'rating', question: 'Course quality rating', required: true },
        { id: 2, type: 'text', question: 'Course suggestions', required: false }
      ],
      active: false
    }
  ]);
  const [feedbackHistory, setFeedbackHistory] = useState([
    {
      id: 1,
      user: 'John Doe',
      form: 'General Feedback',
      rating: 4,
      comment: 'Great platform, but could use more features.',
      category: 'Feature Request',
      date: '2024-01-15',
      status: 'reviewed'
    },
    {
      id: 2,
      user: 'Jane Smith',
      form: 'Course Feedback',
      rating: 5,
      comment: 'Excellent course content and delivery.',
      category: 'General',
      date: '2024-01-14',
      status: 'pending'
    }
  ]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    const savedSettings = localStorage.getItem('feedbackSettings');
    const savedForms = localStorage.getItem('feedbackForms');
    const savedHistory = localStorage.getItem('feedbackHistory');
    
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedForms) setFeedbackForms(JSON.parse(savedForms));
    if (savedHistory) setFeedbackHistory(JSON.parse(savedHistory));
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
      localStorage.setItem('feedbackSettings', JSON.stringify(settings));
      localStorage.setItem('feedbackForms', JSON.stringify(feedbackForms));
      setSaving(false);
      alert('Feedback settings saved!');
    }, 800);
  };

  const handleFormToggle = (formId) => {
    setFeedbackForms(prev => prev.map(form => 
      form.id === formId ? { ...form, active: !form.active } : form
    ));
  };

  const handleStatusChange = (feedbackId, newStatus) => {
    setFeedbackHistory(prev => prev.map(feedback => 
      feedback.id === feedbackId ? { ...feedback, status: newStatus } : feedback
    ));
    localStorage.setItem('feedbackHistory', JSON.stringify(feedbackHistory));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'reviewed': return '#28a745';
      case 'resolved': return '#007bff';
      default: return '#6c757d';
    }
  };

  const getRatingStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="feedback-settings-container">
      <div className="content-header">
        <h1>Feedback Settings</h1>
        <p>Configure feedback collection and management</p>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          General Settings
        </button>
        <button 
          className={`tab-button ${activeTab === 'forms' ? 'active' : ''}`}
          onClick={() => setActiveTab('forms')}
        >
          Feedback Forms
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Feedback History
        </button>
      </div>

      {activeTab === 'settings' && (
        <div className="settings-section">
          <h3>General Feedback Settings</h3>
          <div className="toggle-row">
            <label>Enable Feedback Collection</label>
            <input type="checkbox" checked={settings.enableFeedback} onChange={() => handleToggle('enableFeedback')} />
          </div>
          <div className="toggle-row">
            <label>Allow Anonymous Feedback</label>
            <input type="checkbox" checked={settings.allowAnonymous} onChange={() => handleToggle('allowAnonymous')} />
          </div>
          <div className="toggle-row">
            <label>Require Admin Approval</label>
            <input type="checkbox" checked={settings.requireApproval} onChange={() => handleToggle('requireApproval')} />
          </div>
          <div className="toggle-row">
            <label>Send Auto-Response</label>
            <input type="checkbox" checked={settings.autoResponse} onChange={() => handleToggle('autoResponse')} />
          </div>
          <div className="input-group">
            <label>Feedback Email Address</label>
            <input 
              type="email" 
              name="feedbackEmail" 
              value={settings.feedbackEmail} 
              onChange={handleChange}
              placeholder="feedback@company.com"
            />
          </div>
        </div>
      )}

      {activeTab === 'forms' && (
        <div className="forms-section">
          <div className="section-header">
            <h3>Feedback Forms</h3>
            <button className="btn-secondary">Add New Form</button>
          </div>
          <div className="forms-grid">
            {feedbackForms.map(form => (
              <div key={form.id} className="form-card">
                <div className="form-header">
                  <h4>{form.name}</h4>
                  <div className="form-status">
                    <span className={`status-badge ${form.active ? 'active' : 'inactive'}`}>
                      {form.active ? 'Active' : 'Inactive'}
                    </span>
                    <input 
                      type="checkbox" 
                      checked={form.active} 
                      onChange={() => handleFormToggle(form.id)}
                    />
                  </div>
                </div>
                <p className="form-description">{form.description}</p>
                <div className="form-questions">
                  <h5>Questions ({form.questions.length})</h5>
                  {form.questions.map(q => (
                    <div key={q.id} className="question-item">
                      <span className="question-type">{q.type}</span>
                      <span className="question-text">{q.question}</span>
                      {q.required && <span className="required-badge">Required</span>}
                    </div>
                  ))}
                </div>
                <div className="form-actions">
                  <button className="btn-secondary">Edit</button>
                  <button className="btn-secondary">Duplicate</button>
                  <button className="btn-secondary">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-section">
          <div className="section-header">
            <h3>Feedback History</h3>
            <div className="history-stats">
              <span>Total: {feedbackHistory.length}</span>
              <span>Pending: {feedbackHistory.filter(f => f.status === 'pending').length}</span>
              <span>Reviewed: {feedbackHistory.filter(f => f.status === 'reviewed').length}</span>
            </div>
          </div>
          <div className="feedback-table">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Form</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedbackHistory.map(feedback => (
                  <tr key={feedback.id}>
                    <td>{feedback.user}</td>
                    <td>{feedback.form}</td>
                    <td>
                      <span className="rating-stars">{getRatingStars(feedback.rating)}</span>
                    </td>
                    <td>{feedback.comment}</td>
                    <td>{feedback.category}</td>
                    <td>{feedback.date}</td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(feedback.status) }}
                      >
                        {feedback.status}
                      </span>
                    </td>
                    <td>
                      <select 
                        value={feedback.status} 
                        onChange={(e) => handleStatusChange(feedback.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="actions-row">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default FeedbackSettings; 