import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import AdminDashboard from './AdminDashboard';
import AdminRegisterUser from './AdminRegisterUser';
import DeleteUserForm from './DeleteUserForm';
import StudentDashboard from './StudentDashboard'; // ✅ NEW

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <Link to="/">Register</Link> | 
          <Link to="/login">Login</Link> | 
          <Link to="/admin">Admin Dashboard</Link> | 
          <Link to="/admin/register-user">Register User (Admin)</Link> | 
          <Link to="/admin/delete-user">Delete User</Link>
        </nav>

        <Routes>
          <Route path="/" element={<RegisterForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/register-user" element={<AdminRegisterUser />} />
          <Route path="/admin/delete-user" element={<DeleteUserForm />} />
          <Route path="/student" element={<StudentDashboard />} /> {/* ✅ NEW */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
