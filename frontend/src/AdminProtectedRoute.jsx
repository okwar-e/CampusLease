// AdminProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const AdminProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:5050/me', { withCredentials: true })
      .then(res => {
        if (res.data.loggedIn && res.data.user.role === 'admin') {
          setAuthorized(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Checking admin access...</p>;

  return authorized ? children : <Navigate to="/login" replace />;
};

export default AdminProtectedRoute;
