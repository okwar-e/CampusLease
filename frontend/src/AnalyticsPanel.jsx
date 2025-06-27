import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const AnalyticsPanel = ({ stats }) => {
  const activityData = [
    { name: 'Mon', rentals: 12 },
    { name: 'Tue', rentals: 19 },
    { name: 'Wed', rentals: 15 },
    { name: 'Thu', rentals: 22 },
    { name: 'Fri', rentals: 18 },
    { name: 'Sat', rentals: 8 },
    { name: 'Sun', rentals: 5 }
  ];

  return (
    <div className="analytics-panel">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Pending Approvals</h3>
          <p>{stats.pendingUsers || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Flagged Items</h3>
          <p>{stats.flaggedItems || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Active Rentals</h3>
          <p>{stats.activeLeases || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Revenue (7d)</h3>
          <p>KES {stats.weeklyRevenue?.toLocaleString() || 0}</p>
        </div>
      </div>

      <div className="charts">
        <div className="chart-container">
          <h4>Weekly Activity</h4>
          <BarChart width={500} height={300} data={activityData}>
            <Bar dataKey="rentals" fill="#4CAF50" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
          </BarChart>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;