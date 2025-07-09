import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './wallet.css';

function Wallet() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    try {
      const res = await axios.get("http://localhost:5050/wallet/balance", {
        withCredentials: true,
      });
      setBalance(res.data.balance);
    } catch (err) {
      console.error("Error fetching balance:", err);
      setMessage("Failed to load balance.");
    }
  };

  const handleDeposit = async () => {
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount < 1) {
      setMessage("Please enter an amount of at least KES 1.");
      return;
    }

    if (!phone.match(/^2547\d{8}$/)) {
      setMessage("Please enter a valid Safaricom number (format: 2547XXXXXXXX).");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(
        "http://localhost:5050/wallet/deposit",
        { amount: numericAmount, phone },
        { withCredentials: true }
      );

      setMessage(res.data.message || "STK Push sent. Please check your phone.");
      setAmount('');
      setPhone('');
    } catch (err) {
      console.error("Deposit error:", err);
      setMessage("Error initiating M-Pesa deposit.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  return (
    <div className="wallet-container">
      <h2>👛 Wallet</h2>
      <p><strong>Balance:</strong> KES {balance.toFixed(2)}</p>

      <input
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={loading}
        min={10}
      />

      <input
        type="tel"
        placeholder="Enter phone (e.g. 254712345678)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        disabled={loading}
        pattern="2547\d{8}"
        required
      />

      <button onClick={handleDeposit} disabled={loading}>
        {loading ? "Processing..." : "Deposit via M-Pesa"}
      </button>

      {message && <p style={{ marginTop: '10px', color: 'blue' }}>{message}</p>}
    </div>
  );
}

export default Wallet;
