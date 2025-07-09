import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminRefunds = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        const res = await axios.get("http://localhost:5050/admin/refund-requests", {
          withCredentials: true,
        });
        setRequests(res.data);
      } catch (err) {
        console.error("Error loading refunds:", err);
      }
    };

    fetchRefunds();
  }, []);

  const approveRefund = async (id) => {
    if (!window.confirm("Are you sure you want to approve this refund?")) return;

    try {
      await axios.post(`http://localhost:5050/admin/refund/${id}/approve`, {}, {
        withCredentials: true,
      });
      alert("Refund approved.");
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Refund failed.");
    }
  };

  return (
    <div className="admin-refunds-container">
      <h2>Refund Requests</h2>

      {requests.length === 0 ? (
        <p>No refund requests pending.</p>
      ) : (
        <table className="refunds-table" border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Item</th>
              <th>User</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>Requested At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.item_title}</td>
                <td>{r.user_name}</td>
                <td>KES {r.amount}</td>
                <td>{r.reason}</td>
                <td>{new Date(r.refunded_at).toLocaleString()}</td>
                <td>
                  <button onClick={() => approveRefund(r.id)}>Approve</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminRefunds;
