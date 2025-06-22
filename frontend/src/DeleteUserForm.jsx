import React, { useState } from 'react';
import axios from 'axios';

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
      setStatus({ type: 'error', message: err.response?.data?.error || 'Deletion failed' });
    }
  };

  return (
    <form onSubmit={handleDelete}>
      <h3>Delete User by Email</h3>
      <input
        type="email"
        placeholder="Enter user email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit" style={{ backgroundColor: 'red', color: 'white' }}>Delete</button>
      {status && (
        <p style={{ color: status.type === 'success' ? 'green' : 'red' }}>
          {status.message}
        </p>
      )}
    </form>
  );
}

export default DeleteUserForm;
