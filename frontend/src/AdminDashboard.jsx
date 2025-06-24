// AdminDashboard.jsx (Unified with Sidebar Navigation)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ApproveStudents from './ApproveStudents';
import AdminRegisterUser from "./AdminRegisterUser";
import DeleteUserForm from "./DeleteUserForm";
import "./AdminDashboards.css"; // Use the updated clean dashboard CSS

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("approve");
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5050/logout", {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("token");
      navigate("/auth");
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
      default:
        return <ApproveStudents />;
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>CampusLease Admin</h2>
        <button
          className={activeTab === "approve" ? "active" : ""}
          onClick={() => setActiveTab("approve")}
        >
          📝 Approve/Reject
        </button>
        <button
          className={activeTab === "register" ? "active" : ""}
          onClick={() => setActiveTab("register")}
        >
          👤 Register New User
        </button>
        <button
          className={activeTab === "delete" ? "active" : ""}
          onClick={() => setActiveTab("delete")}
        >
          ❌ Delete User
        </button>
        <button className="logout" onClick={handleLogout}>
          ← Logout
        </button>
      </aside>

      <main className="main-content">
        <h1>Dashboard</h1>
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
