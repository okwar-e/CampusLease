import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Requests.css';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    category: '',
    desired_price: '',
    urgency: 'medium'
  });

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get("http://localhost:5050/student/requests", {
          withCredentials: true
        });
        setRequests(res.data);
      } catch (err) {
        setError("Failed to load requests");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5050/student/requests", formData, {
        withCredentials: true
      });
      const res = await axios.get("http://localhost:5050/student/requests", {
        withCredentials: true
      });
      setRequests(res.data);
      setFormData({
        item_name: '',
        description: '',
        category: '',
        desired_price: '',
        urgency: 'medium'
      });
      setShowForm(false);
      alert("Request submitted successfully!");
    } catch (err) {
      setError("Failed to submit request");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;
    try {
      await axios.delete(`http://localhost:5050/student/requests/${id}`, {
        withCredentials: true
      });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError("Failed to delete request");
    }
  };

  return (
    <div className="requests-container">
      <h2>Item Requests</h2>

      <button className="toggle-form-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Hide Request Form" : "➕ Make a New Request"}
      </button>

      {showForm && (
        <div className="request-form">
          <h3>Make a New Request</h3>
          <form onSubmit={handleSubmit}>
            <label>Item Name *</label>
            <input type="text" name="item_name" value={formData.item_name} onChange={handleChange} required />

            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" />

            <label>Category</label>
            <input type="text" name="category" value={formData.category} onChange={handleChange} />

            <label>Desired Price (KES)</label>
            <input type="number" name="desired_price" value={formData.desired_price} onChange={handleChange} min="0" step="0.01" />

            <label>Urgency</label>
            <select name="urgency" value={formData.urgency} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <button type="submit">Submit Request</button>
          </form>
        </div>
      )}

      <div className="request-list">
        <h3>Your Previous Requests</h3>
        {loading ? (
          <p>Loading requests...</p>
        ) : error ? (
          <p className="error-msg">{error}</p>
        ) : requests.length === 0 ? (
          <p>No requests found</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Category</th>
                <th>Price</th>
                <th>Urgency</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.item_name}</td>
                  <td>{request.description}</td>
                  <td>{request.category}</td>
                  <td>{request.desired_price ? `KES ${request.desired_price}` : '-'}</td>
                  <td className={`urgency-${request.urgency}`}>{request.urgency}</td>
                  <td>{request.request_date}</td>
                  <td>
                    <button className="delete-btn" onClick={() => handleDelete(request.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Requests;
