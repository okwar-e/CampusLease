// AdminRequests.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5050/admin/requests', {
        withCredentials: true
      });
      setRequests(res.data);
    } catch (err) {
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      await axios.delete(`http://localhost:5050/admin/requests/${id}`, {
        withCredentials: true
      });
      setRequests(prev => prev.filter(req => req.id !== id));
    } catch (err) {
      setError('Failed to delete request');
    }
  };

  return (
    <div className="admin-requests">
      <h2>All Student Requests</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : requests.length === 0 ? (
        <p>No requests found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Item</th>
              <th>Description</th>
              <th>Category</th>
              <th>Price</th>
              <th>Urgency</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{req.student_name || req.student_id}</td>
                <td>{req.item_name}</td>
                <td>{req.description}</td>
                <td>{req.category}</td>
                <td>{req.desired_price}</td>
                <td>{req.urgency}</td>
                <td>
                  <button style={{ color: 'red' }} onClick={() => handleDelete(req.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminRequests;
