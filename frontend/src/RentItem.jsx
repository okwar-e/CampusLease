import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const RentItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [days, setDays] = useState(1);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .get(`http://localhost:5050/items/${id}`, { withCredentials: true })
      .then((res) => setItem(res.data))
      .catch((err) => {
        console.error(err);
        setError("Failed to load item.");
      });
  }, [id]);

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!days || days <= 0) return alert("Enter a valid number of days.");
  if (!/^2547\d{8}$/.test(phone)) return alert("Enter a valid Safaricom number starting with 2547...");

  // FIX 1: Use UTC dates without time components
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Normalize to UTC midnight

  const endDate = new Date(today);
  endDate.setDate(today.getDate() + Number(days));

  const leasePayload = {
    item_id: item.id,
    start_date: today.toISOString().split("T")[0], // YYYY-MM-DD format
    end_date: endDate.toISOString().split("T")[0],
    total_price: (item.price_per_day * days).toFixed(2),
    phone: phone.toString(),
  };

  try {
    setLoading(true);
    const response = await axios.post(
      "http://localhost:5050/pay/lease", 
      leasePayload, 
      { withCredentials: true }
    );
    
    if (response.data.success) {
      alert("M-Pesa payment prompt sent!");
      navigate("/student/leases");
    }
  } catch (err) {
    console.error("Payment error:", err.response?.data || err);
    alert(err.response?.data?.error || "Payment failed. Try again.");
  } finally {
    setLoading(false);
  }
};

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!item) return <p>Loading item...</p>;

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h2>Rent "{item.title}"</h2>
      <p>📂 Category: {item.category}</p>
      <p>💰 Price: <strong>KES {item.price_per_day}</strong> / day</p>

      {item.image && (
        <img
          src={`data:image/jpeg;base64,${btoa(
            new Uint8Array(item.image.data).reduce((data, byte) => data + String.fromCharCode(byte), "")
          )}`}
          alt="Item"
          style={{ width: "100%", borderRadius: "10px", margin: "10px 0" }}
        />
      )}

      <form onSubmit={handleSubmit}>
        <label>📅 Number of Days:</label><br />
        <input
          type="number"
          min="1"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        /><br />

        <label>📱 M-Pesa Phone (2547XXXXXXXX):</label><br />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", marginBottom: "20px" }}
        /><br />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontWeight: "bold"
          }}
        >
          {loading
            ? "Processing..."
            : `Pay KES ${(item.price_per_day * days).toFixed(2)} & Rent`}
        </button>
      </form>
    </div>
  );
};

export default RentItem;
