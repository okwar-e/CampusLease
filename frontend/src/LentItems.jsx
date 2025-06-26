import React, { useEffect, useState } from "react";
import axios from "axios";

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
    <div>
      <h2>📤 Items I've Lent Out</h2>
      {lentItems.length === 0 ? (
        <p>You haven’t lent any items yet.</p>
      ) : (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Item</th>
              <th>Renter</th>
              <th>Lease Start</th>
              <th>Lease End</th>
              <th>Status</th>
              <th>Total Paid</th>
            </tr>
          </thead>
          <tbody>
            {lentItems.map((lease) => (
              <tr key={lease.id}>
                <td>{lease.item_title}</td>
                <td>{lease.renter_name}</td>
                <td>{new Date(lease.start_date).toLocaleDateString()}</td>
                <td>{new Date(lease.end_date).toLocaleDateString()}</td>
                <td>{lease.status}</td>
                <td>KES {lease.total_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LentItems; // ✅ make sure it's a default export
