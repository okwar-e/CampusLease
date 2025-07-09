import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './payments.css';


const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPayments = async () => {
    try {
      const res = await axios.get("http://localhost:5050/student/payments", {
        withCredentials: true
      });
      console.log("Payment data:", res.data); // 🔍 optional debug
      setPayments(res.data);
    } catch (err) {
      console.error(err);
      setError("Could not fetch payment records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const requestRefund = async (paymentId) => {
    const reason = prompt("Enter reason for refund:");
    if (!reason) return;

    try {
      const res = await axios.post("http://localhost:5050/student/request-refund", {
        payment_id: paymentId,
        reason
      }, {
        withCredentials: true
      });

      if (res.data.success) {
        alert("Refund request sent successfully.");
        fetchPayments(); // refresh list
      } else {
        alert(res.data.error || "Failed to request refund.");
      }
    } catch (err) {
      console.error("Refund request error:", err);
      alert("Something went wrong while requesting refund.");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const formatted = new Date(dateStr.replace(" ", "T"));
    return isNaN(formatted) ? "Invalid Date" : formatted.toLocaleDateString();
  };

  return (
    <div className="payments-section">
      <h2>My Payments</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : payments.length === 0 ? (
        <p>No payment records found.</p>
      ) : (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Item</th>
              <th>Lease Period</th>
              <th>Amount Paid</th>
              <th>Payment Date</th>
              <th>Refund</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.item_title}</td>
                <td>{formatDate(p.start_date)} - {formatDate(p.end_date)}</td>
                <td>KES {p.amount}</td>
                <td>{formatDate(p.transaction_time)}</td>
                <td>
                  {p.refunded ? (
                    "✅ Refunded"
                  ) : (
                    <button onClick={() => requestRefund(p.id)}>Request Refund</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Payments;
