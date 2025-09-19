import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './TrainingMetrics.css';

const TrainingMetrics = () => {
  const [activeTab, setActiveTab] = useState('month');

  const data = {
    week: [
      { name: 'Safety Basics', completion: 95 },
      { name: 'Leadership 101', completion: 78 },
      { name: 'Tech Onboarding', completion: 88 },
      { name: 'Data Security', completion: 82 },
    ],
    month: [
      { name: 'Workplace Safety', completion: 89 },
      { name: 'Leadership Fundamentals', completion: 76 },
      { name: 'Technical Onboarding', completion: 95 },
      { name: 'Data Security', completion: 68 },
    ],
    year: [
      { name: 'Annual Safety Training', completion: 92 },
      { name: 'Advanced Leadership', completion: 84 },
      { name: 'Technical Mastery', completion: 78 },
      { name: 'Security Compliance', completion: 96 },
    ]
  };

  const currentData = data[activeTab];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">
            {payload[0].value}% completion rate
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title-section">
          <h3>Training Metrics</h3>
          <p>Company-wide training completion rates</p>
        </div>
        <div className="chart-tabs">
          <button 
            className={activeTab === 'week' ? 'active' : ''}
            onClick={() => setActiveTab('week')}
          >
            Week
          </button>
          <button 
            className={activeTab === 'month' ? 'active' : ''}
            onClick={() => setActiveTab('month')}
          >
            Month
          </button>
          <button 
            className={activeTab === 'year' ? 'active' : ''}
            onClick={() => setActiveTab('year')}
          >
            Year
          </button>
        </div>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={currentData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              type="number" 
              domain={[0, 100]} 
              stroke="#666"
              fontSize={12}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={150} 
              stroke="#666"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="completion" 
              fill="#8b5cf6" 
              name="Completion Rate"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="training-summary">
        <div className="summary-item">
          <span className="summary-label">Average Completion</span>
          <span className="summary-value">
            {Math.round(currentData.reduce((acc, item) => acc + item.completion, 0) / currentData.length)}%
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Programs</span>
          <span className="summary-value">{currentData.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Above 80%</span>
          <span className="summary-value">
            {currentData.filter(item => item.completion >= 80).length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrainingMetrics;
