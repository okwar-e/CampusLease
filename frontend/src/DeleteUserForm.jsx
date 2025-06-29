import React, { useState } from 'react';
import axios from 'axios';
import './DeleteUserForm.css'; // 👈 link to the CSS file

function DeleteUserForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Are you sure you want to delete ${email}?`)) return;

    try {
      const res = await axios.delete(`http://localhost:5050/admin/users/${email}`);
      setStatus({ type: 'success', message: res.data.message });
      setEmail('');
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.error || 'Deletion failed',
      });
    }
  };

  return (
    <div className="delete-user-container">
      <h3>🗑️ Delete User by Email</h3>
      <form onSubmit={handleDelete} className="delete-user-form">
        <input
          type="email"
          placeholder="Enter user email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="delete-btn">Delete</button>
      </form>
      {status && (
        <p className={`status-msg ${status.type === 'success' ? 'success' : 'error'}`}>
          {status.message}
        </p>
      )}
    </div>
  );
}

export default DeleteUserForm;
