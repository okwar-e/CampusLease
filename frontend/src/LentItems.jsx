import React, { useEffect, useState } from "react";
import axios from "axios";
import './lentItems.css';

const LentItems = () => {
  const [lentItems, setLentItems] = useState([]);

  useEffect(() => {
    const fetchLentItems = async () => {
      try {
        const res = await axios.get("http://localhost:5050/student/lent", {
          withCredentials: true
        });
        setLentItems(res.data);
      } catch (err) {
        console.error("Failed to fetch lent items:", err);
      }
    };

    fetchLentItems();
  }, []);

  return (
    <div className="lent-items-container">
      <h2>📤 Items I've Lent Out</h2>
      {lentItems.length === 0 ? (
        <p>You haven’t lent any items yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Renter</th>
              <th>Lease Start</th>
              <th>Phone</th> {/* NEW */}
              <th>Lease End</th>
              <th>Status</th>
              <th>Total Paid</th>
            </tr>
          </thead>
          <tbody>
            {lentItems.map((lease) => (
              <tr key={lease.id}>
                <td data-label="Item">{lease.item_title}</td>
                <td data-label="Renter">{lease.renter_name}</td>
                <td data-label="Phone">{lease.renter_phone || 'N/A'}</td> {/* NEW */}
                <td data-label="Lease Start">
                  {new Date(lease.start_date).toLocaleDateString()}
                </td>
                <td data-label="Lease End">
                  {new Date(lease.end_date).toLocaleDateString()}
                </td>
                <td data-label="Status">{lease.status}</td>
                <td data-label="Total Paid">KES {lease.total_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LentItems;
