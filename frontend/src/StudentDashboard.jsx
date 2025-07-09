import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Listings from './Listings';
import Leases from './Leases';
import Payments from './Payments';
import Profile from './Profile';
import Requests from './Requests';
import LentItems from './LentItems';
import Wallet from './Wallet'; // ✅ Import Wallet component
import './StudentDashboard.css';

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
      case 'lent': return <LentItems />;
      case 'payments': return <Payments />;
      case 'profile': return <Profile />;
      case 'requests': return <Requests />;
      case 'wallet': return <Wallet />; // ✅ New tab rendering
      default: return <Listings />;
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2 className="sidebar-title">🎓 Dashboard</h2>
        <ul className="menu">
          <li><button onClick={() => setActiveTab('listings')}>📦 Marketplace</button></li>
          <li><button onClick={() => setActiveTab('leases')}>📄 My Leases</button></li>
          <li><button onClick={() => setActiveTab('lent')}>🔄 Lent Items</button></li>
          <li><button onClick={() => setActiveTab('payments')}>💰 Payments</button></li>
          <li><button onClick={() => setActiveTab('wallet')}>👛 Wallet</button></li> {/* ✅ Wallet Tab */}
          <li><button onClick={() => setActiveTab('profile')}>🙍‍♂️ Profile</button></li>
          <li><button onClick={() => setActiveTab('requests')}>➕ Request Item</button></li>
          <li><button className="logout-btn" onClick={handleLogout}>🚪 Logout</button></li>
        </ul>
      </aside>
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default StudentDashboard;
