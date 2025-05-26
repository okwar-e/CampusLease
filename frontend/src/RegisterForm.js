import React, { useState } from 'react';
import axios from 'axios';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    school_email: '',
    password: '',
    selfie: null,
    id_card: null,
  });

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

    const payload = new FormData();
    payload.append('full_name', formData.full_name);
    payload.append('school_email', formData.school_email);
    payload.append('password', formData.password);
    payload.append('selfie', formData.selfie);
    payload.append('id_card', formData.id_card);

    try {
      const res = await axios.post('http://localhost:5050/register', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true // only needed if you use cookies/session auth
      });

      alert(res.data.message || "Registration successful!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data">
      <h2>Student Registration</h2>
      <input
        type="text"
        name="full_name"
        placeholder="Full Name"
        value={formData.full_name}
        onChange={handleChange}
        required
      />
      <br />
      <input
        type="email"
        name="school_email"
        placeholder="School Email"
        value={formData.school_email}
        onChange={handleChange}
        required
      />
      <br />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
      />
      <br />
      <label>Upload Selfie:</label>
      <input
        type="file"
        name="selfie"
        accept="image/*"
        onChange={handleChange}
        required
      />
      <br />
      <label>Upload Student ID:</label>
      <input
        type="file"
        name="id_card"
        accept="image/*"
        onChange={handleChange}
        required
      />
      <br />
      <button type="submit">Register</button>
    </form>
  );
};

export default RegisterForm;
