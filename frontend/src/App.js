import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import AdminDashboard from './AdminDashboard'; // NEW

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <Link to="/">Register</Link> | 
          <Link to="/login">Login</Link> | 
          <Link to="/admin">Admin</Link>
        </nav>

        <Routes>
          <Route path="/" element={<RegisterForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
