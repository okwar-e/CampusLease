import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './leases.css'; // 🔹 Make sure to create this CSS file

const Leases = () => {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeases = async () => {
      try {
        const res = await axios.get("http://localhost:5050/student/leases", {
          withCredentials: true
        });
        setLeases(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load leases.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeases();
  }, []);

  const formatCurrency = (amount) =>
    `KES ${Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  return (
    <div className="leases-container">
      <h2>📄 Items I'm Using</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : leases.length === 0 ? (
        <p>No active leases found.</p>
      ) : (
        <table className="leases-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Daily Price</th>
              <th>Owner Phone</th> {/* NEW */}
            </tr>
          </thead>
          <tbody>
            {leases.map((lease) => (
              <tr key={lease.id}>
                <td data-label="Item">{lease.item_title || "Untitled Item"}</td>
                <td data-label="Start Date">{new Date(lease.start_date).toLocaleDateString()}</td>
                <td data-label="End Date">{new Date(lease.end_date).toLocaleDateString()}</td>
                <td data-label="Status">{lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}</td>
                <td data-label="Daily Price">{formatCurrency(lease.price_per_day)}</td>
                <td data-label="Owner Phone">{lease.owner_phone || "N/A"}</td> {/* NEW */}
                
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Leases;
