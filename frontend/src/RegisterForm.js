import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './RegisterForm.css';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    school_email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    selfie: null,
    id_card: null,
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'selfie' || name === 'id_card') {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }

    const payload = new FormData();
    payload.append('full_name', formData.full_name);
    payload.append('school_email', formData.school_email);
    payload.append('phone_number', formData.phone_number);
    payload.append('password', formData.password);
    payload.append('selfie', formData.selfie);
    payload.append('id_card', formData.id_card);

    try {
      await axios.post('http://localhost:5050/register', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      alert("Registration successful");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">🎓 CampusLease</div>
        <div className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
        </div>
      </nav>

      {/* Form */}
      <div className="register-container">
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="register-form">
          <h2>Student Registration</h2>
          {error && <p className="error">{error}</p>}

          <input type="text" name="full_name" placeholder="Full Name" value={formData.full_name} onChange={handleChange} required />
          <input type="email" name="school_email" placeholder="School Email" value={formData.school_email} onChange={handleChange} required />
          <input type="tel" name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />

          <label>Upload Selfie:</label>
          <input type="file" name="selfie" accept="image/*" onChange={handleChange} required />

          <label>Upload Student ID:</label>
          <input type="file" name="id_card" accept="image/*" onChange={handleChange} required />

          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
