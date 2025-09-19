import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './TeamActivityChart.css';

const TeamActivityChart = () => {
  const [activeTab, setActiveTab] = useState('week');

  const data = {
    week: [
      { date: 'Mon', departments: 12, training: 8 },
      { date: 'Tue', departments: 19, training: 12 },
      { date: 'Wed', departments: 8, training: 6 },
      { date: 'Thu', departments: 15, training: 10 },
      { date: 'Fri', departments: 14, training: 16 },
      { date: 'Sat', departments: 16, training: 12 },
      { date: 'Sun', departments: 8, training: 5 },
    ],
    month: [
      { date: 'Week 1', departments: 45, training: 32 },
      { date: 'Week 2', departments: 52, training: 38 },
      { date: 'Week 3', departments: 38, training: 28 },
      { date: 'Week 4', departments: 48, training: 35 },
    ],
    year: [
      { date: 'Q1', departments: 180, training: 125 },
      { date: 'Q2', departments: 195, training: 142 },
      { date: 'Q3', departments: 168, training: 118 },
      { date: 'Q4', departments: 185, training: 135 },
    ]
  };

  const currentData = data[activeTab];

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title-section">
          <h3>Team Activity</h3>
          <p>Overview of team activity for the selected period</p>
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
          <BarChart data={currentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#666"
              fontSize={12}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Bar 
              dataKey="departments" 
              fill="#3b82f6" 
              name="Departments"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="training" 
              fill="#10b981" 
              name="Training"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TeamActivityChart;
