// ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:5050/me', { withCredentials: true })
      .then(res => {
        if (res.data.loggedIn) {
          setLoggedIn(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Checking session...</p>;

  return loggedIn ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
