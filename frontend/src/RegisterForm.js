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
  const [passwordStrength, setPasswordStrength] = useState('');

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'selfie' || name === 'id_card') {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

      if (name === 'password') {
        const strength = getPasswordStrength(value);
        setPasswordStrength(strength);
      }
    }
  };

  const validatePassword = (password) => {
    const isLongEnough = password.length > 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    return isLongEnough && hasUppercase && hasSpecialChar;
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 1) return 'Weak';
    if (strength === 2 || strength === 3) return 'Medium';
    return 'Strong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { password, confirmPassword } = formData;

    if (!validatePassword(password)) {
      return setError(
        'Password must be more than 8 characters, contain at least one uppercase letter and one special character.'
      );
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    const payload = new FormData();
    payload.append('full_name', formData.full_name);
    payload.append('school_email', formData.school_email);
    payload.append('phone_number', formData.phone_number);
    payload.append('password', password);
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

      {/* Registration Form */}
      <div className="register-container">
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="register-form">
          <h2>Student Registration</h2>
          {error && <p className="error">{error}</p>}

          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="school_email"
            placeholder="School Email"
            value={formData.school_email}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone_number"
            placeholder="Phone Number"
            value={formData.phone_number}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            pattern="(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}"
            title="Must be more than 8 characters, with at least one uppercase letter and one special character"
            required
          />
          {formData.password && (
            <p className={`password-strength ${passwordStrength.toLowerCase()}`}>
              Strength: {passwordStrength}
            </p>
          )}
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <label>Upload Selfie:</label>
          <input
            type="file"
            name="selfie"
            accept="image/*"
            onChange={handleChange}
            required
          />

          <label>Upload Student ID:</label>
          <input
            type="file"
            name="id_card"
            accept="image/*"
            onChange={handleChange}
            required
          />

          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
