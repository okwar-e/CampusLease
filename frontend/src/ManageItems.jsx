// --- React Frontend: ManageItems.jsx ---
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ManageItems.css';

const ManageItems = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:5050/admin/items', {
        params: { filter },
        withCredentials: true,
      });
      setItems(res.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch items');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5050/admin/items/${id}`, {
        withCredentials: true,
      });
      setItems(items.filter((item) => item.id !== id));
      setSuccess('Item removed successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert('Delete failed');
    }
  };

  const filtered = items.filter(item => {
    const match = item.title.toLowerCase().includes(search.toLowerCase()) ||
                  item.description?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return match && new Date(item.date_listed) >= oneWeekAgo;
    }
    return match;
  });

  const formatPrice = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 'N/A' : `$${num.toFixed(2)}`;
  };

  return (
    <div className="manage-items-container">
      <h1>Manage Items</h1>
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="controls">
        <input
          type="text"
          placeholder="Search items by title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
          <option value="all">All Items</option>
          <option value="recent">Recently Added</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="no-items">No matching items found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="items-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Category</th>
                <th>Quality</th>
                <th>Price/Day</th>
                <th>Date Listed</th>
                <th>Owner ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.description || '—'}</td>
                  <td>{item.category || 'N/A'}</td>
                  <td>{item.quality}</td>
                  <td>{formatPrice(item.price_per_day)}</td>
                  <td>{new Date(item.date_listed).toLocaleDateString()}</td>
                  <td>{item.owner_id}</td>
                  <td>
                    <button className="remove-btn" onClick={() => handleDelete(item.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageItems;
