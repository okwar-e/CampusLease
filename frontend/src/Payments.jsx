import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await axios.get("http://localhost:5050/student/payments", {
          withCredentials: true
        });
        setPayments(res.data);
      } catch (err) {
        console.error(err);
        setError("Could not fetch payment records.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

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
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.item_title}</td>
                <td>
                  {new Date(p.start_date).toLocaleDateString()} -{" "}
                  {new Date(p.end_date).toLocaleDateString()}
                </td>
                <td>KES {p.amount}</td>
                <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                <td>{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Payments;
