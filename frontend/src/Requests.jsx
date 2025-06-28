import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    category: '',
    desired_price: '',
    urgency: 'medium'
  });

  // Fetch existing requests
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5050/student/requests",
        formData,
        { withCredentials: true }
      );
      
      // Refresh requests list
      const newRes = await axios.get("http://localhost:5050/student/requests", {
        withCredentials: true
      });
      setRequests(newRes.data);
      
      // Reset form
      setFormData({
        item_name: '',
        description: '',
        category: '',
        desired_price: '',
        urgency: 'medium'
      });
      
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

    // Refresh list after deletion
    setRequests((prev) => prev.filter((r) => r.id !== id));
  } catch (err) {
    setError("Failed to delete request");
  }
};


  return (
    <div className="requests-container">
      <h2>Item Requests</h2>
      
      {/* Request Form */}
      <div className="request-form" style={{ marginBottom: '2rem' }}>
        <h3>Make a New Request</h3>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Item Name *</label>
            <input
              type="text"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>
          
          <div>
            <label>Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label>Desired Price (KES)</label>
            <input
              type="number"
              name="desired_price"
              value={formData.desired_price}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <label>Urgency</label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <button type="submit">Submit Request</button>
        </form>
      </div>
      
      {/* Existing Requests */}
      <div className="request-list">
        <h3>Your Previous Requests</h3>
        {loading ? (
          <p>Loading requests...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
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
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
  {requests.map((request) => (
    <tr key={request.id}>
      <td>{request.item_name}</td>
      <td>{request.description}</td>
      <td>{request.category}</td>
      <td>{request.desired_price ? `KES ${request.desired_price}` : '-'}</td>
      <td style={{ 
        color: request.urgency === 'high' ? 'red' : 
              request.urgency === 'medium' ? 'orange' : 'green'
      }}>
        {request.urgency}
      </td>
      <td style={{
        color: request.status === 'approved' ? 'green' :
              request.status === 'rejected' ? 'red' : 'gray'
      }}>
        {request.status}
      </td>
      <td>{request.request_date}</td>
      <td>
        <button
          style={{ color: 'red' }}
          onClick={() => handleDelete(request.id)}
        >
          Delete
        </button>
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