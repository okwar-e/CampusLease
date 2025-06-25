import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Placeholder components for different sections
import Listings from './Listings';
import Leases from './Leases';
import Payments from './Payments';
import Profile from './Profile';
import Requests from './Requests';

function StudentDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('listings');

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5050/logout", {}, { withCredentials: true });
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'listings': return <Listings />;
      case 'leases': return <Leases />;
      case 'payments': return <Payments />;
      case 'profile': return <Profile />;
      case 'requests': return <Requests />;
      default: return <Listings />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '200px', backgroundColor: '#f0f0f0', padding: '20px' }}>
        <h3>Student Menu</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><button onClick={() => setActiveTab('listings')}>Marketplace</button></li>
          <li><button onClick={() => setActiveTab('leases')}>My Leases</button></li>
          <li><button onClick={() => setActiveTab('payments')}>Payments</button></li>
          <li><button onClick={() => setActiveTab('profile')}>Profile</button></li>
          <li><button onClick={() => setActiveTab('requests')}>Request Item</button></li>
          <li><button onClick={handleLogout} style={{ marginTop: '20px', color: 'red' }}>Logout</button></li>
        </ul>
      </div>
      <div style={{ flex: 1, padding: '20px' }}>
        {renderContent()}
      </div>
    </div>
  );
}

export default StudentDashboard;
