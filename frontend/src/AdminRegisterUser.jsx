import React, { useState } from 'react';
import axios from 'axios';
import './AdminRegisterUser.css';

function AdminRegisterUser() {
  const [form, setForm] = useState({
    full_name: '',
    school_email: '',
    password: '',
    role: 'student',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5050/admin/register', form);
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.error || 'Error registering user');
    }
  };

  return (
    <div className="admin-register-container">
      <form onSubmit={handleSubmit} className="admin-register-form">
        <h3>Register New User</h3>

        <label>Full Name</label>
        <input
          name="full_name"
          placeholder="Full Name"
          value={form.full_name}
          onChange={handleChange}
          required
        />

        <label>Email</label>
        <input
          name="school_email"
          type="email"
          placeholder="Email"
          value={form.school_email}
          onChange={handleChange}
          required
        />

        <label>Password</label>
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <label>Role</label>
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>

        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default AdminRegisterUser;
