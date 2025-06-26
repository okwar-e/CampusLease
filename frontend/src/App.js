import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LandingPage from './LandingPage';
import AuthPage from './AuthPage'; // ✅ Login/Register toggle
import AdminDashboard from './AdminDashboard';
import AdminRegisterUser from './AdminRegisterUser';
import DeleteUserForm from './DeleteUserForm';
import StudentDashboard from './StudentDashboard';
import RentItem from './RentItem'; // ✅ Add this line

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/register-user" element={<AdminRegisterUser />} />
        <Route path="/admin/delete-user" element={<DeleteUserForm />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/rent/:id" element={<RentItem />} /> {/* ✅ Rent Item route */}
      </Routes>
    </Router>
  );
}

export default App;
