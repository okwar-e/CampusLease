import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
    <div className="leases-section">
      <h2>📄 My Leases</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : leases.length === 0 ? (
        <p>No active leases found.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#f0f0f0" }}>
            <tr>
              <th>Item</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Daily Price</th>
              <th>Total Cost</th>
              {/* Future button: <th>Action</th> */}
            </tr>
          </thead>
          <tbody>
            {leases.map((lease) => (
              <tr key={lease.id}>
                <td>{lease.item_title || "Untitled Item"}</td>
                <td>{new Date(lease.start_date).toLocaleDateString()}</td>
                <td>{new Date(lease.end_date).toLocaleDateString()}</td>
                <td>{lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}</td>
                <td>{formatCurrency(lease.price_per_day)}</td>
                <td>{formatCurrency(lease.total_amount)}</td>
                {/* Future feature:
                <td>
                  {lease.status === 'active' && (
                    <button onClick={() => handleReturn(lease.id)}>Return</button>
                  )}
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Leases;
