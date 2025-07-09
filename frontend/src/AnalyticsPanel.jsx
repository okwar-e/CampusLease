  import React from 'react';
  import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

  const AnalyticsPanel = ({ stats }) => {
    return (
      <div className="analytics-panel">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Pending Registration Approvals</h3>
            <p>{stats.pendingUsers || 0}</p>
          </div>

          <div className="stat-card">
            <h3>Listed Items</h3>
            <p>{stats.totalItems || 0}</p>
          </div>

          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p>KES {stats.totalRevenue?.toLocaleString() || 0}</p>
          </div>

          <div className="stat-card">
            <h3>Payments (Last 7 Days)</h3>
            <p>KES {stats.weeklyRevenue?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="charts">
          <div className="chart-container">
            <h4>Daily Revenue</h4>
            <BarChart width={500} height={300} data={stats.dailyRevenue || []}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#4CAF50" />
            </BarChart>
          </div>
        </div>
      </div>
    );
  };

  export default AnalyticsPanel;
