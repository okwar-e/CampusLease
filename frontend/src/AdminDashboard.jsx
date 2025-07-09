// AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApproveStudents from './ApproveStudents';
import AdminRegisterUser from "./AdminRegisterUser";
import DeleteUserForm from "./DeleteUserForm";
import ManageItems from "./ManageItems";
import AnalyticsPanel from "./AnalyticsPanel";
import AdminRequests from "./AdminRequests"; // <-- NEW
import AdminRefunds from "./AdminRefunds";
import "./AdminDashboards.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("approve");
  const [stats, setStats] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:5050/admin/stats", {
          credentials: "include"
        });
        setStats(await res.json());
      } catch (err) {
        console.error("Failed to load stats", err);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5050/logout", {
        method: "POST",
        credentials: "include",
      });
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "approve":
        return <ApproveStudents />;
      case "register":
        return <AdminRegisterUser />;
      case "delete":
        return <DeleteUserForm />;
      case "items":
        return <ManageItems />;
      case "analytics":
        return <AnalyticsPanel stats={stats} />;
      case "requests":
        return <AdminRequests/>; // <-- NEW
        case "refunds":
  return <AdminRefunds />;

      default:
        return <ApproveStudents />;
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>CampusLease Admin</h2>
        </div>
        
        <nav>
          <button className={activeTab === "approve" ? "active" : ""}
            onClick={() => setActiveTab("approve")}>
            📝 Student Approvals
          </button>
          <button className={activeTab === "requests" ? "active" : ""}
            onClick={() => setActiveTab("requests")}>
            📬 Manage Requests
          </button>
          <button className={activeTab === "items" ? "active" : ""}
            onClick={() => setActiveTab("items")}>
            🛠 Manage Items
          </button>
          <button className={activeTab === "register" ? "active" : ""}
            onClick={() => setActiveTab("register")}>
            👥 Register User
          </button>
          <button className={activeTab === "delete" ? "active" : ""}
            onClick={() => setActiveTab("delete")}>
            ❌ Delete User
          </button>
          <button className={activeTab === "analytics" ? "active" : ""}
            onClick={() => setActiveTab("analytics")}>
            📊 Analytics
          </button>
<button className={activeTab === "refunds" ? "active" : ""} onClick={() => setActiveTab("refunds")}>
  💸 Refunds
</button>

           <button className="logout" onClick={handleLogout}>
          ← Logout
        </button>
        </nav>

       
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h1>
            {activeTab === "approve" && ""}
            {activeTab === "requests" && ""}
            {activeTab === "items" && ""}
            {activeTab === "register" && ""}
            {activeTab === "delete" && ""}
            {activeTab === "analytics" && ""}
          </h1>
        
        </header>
        
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
