import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function StudentDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5050/logout", {}, { withCredentials: true });
      localStorage.removeItem("token"); // Optional if using token
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Welcome to the Student Dashboard</h2>
        <button onClick={handleLogout} style={{ backgroundColor: "red", color: "white" }}>
          Logout
        </button>
      </div>

      <p>This is a placeholder. You can add student-specific features here.</p>
    </div>
  );
}

export default StudentDashboard;
