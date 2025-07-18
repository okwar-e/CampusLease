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

if (!phone.match(/^254(7|1)\d{8}$/)) {
  setMessage("Please enter a valid Safaricom number (e.g. 2547XXXXXXXX or 2541XXXXXXXX).");
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
    <div className="balance-display">
      <strong>Balance:</strong> KES {balance.toFixed(2)}
    </div>

    <input
      type="number"
      placeholder="Enter amount (minimum KES 10)"
      value={amount}
      onChange={(e) => setAmount(e.target.value)}
      disabled={loading}
      min="10"
    />

    <input
      type="tel"
      placeholder="Enter Safaricom number (e.g. 254712345678)"
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
      disabled={loading}
      pattern="254[71]\d{8}"
    />

    <button 
      className="deposit-btn" 
      onClick={handleDeposit} 
      disabled={loading}
    >
      {loading ? "Processing..." : "Deposit via M-Pesa"}
    </button>

    {message && (
      <div className={`message ${
        message.includes("sent") ? "success" : 
        message.includes("Error") || message.includes("Failed") ? "error" : "info"
      }`}>
        {message}
      </div>
    )}
  </div>
);
}

export default Wallet;
