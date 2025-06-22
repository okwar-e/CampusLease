import React, { useState } from 'react';
import axios from 'axios';

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
    <form onSubmit={handleSubmit}>
      <h3>Register New User</h3>
      <input name="full_name" placeholder="Full Name" value={form.full_name} onChange={handleChange} required />
      <input name="school_email" placeholder="Email" type="email" value={form.school_email} onChange={handleChange} required />
      <input name="password" placeholder="Password" type="password" value={form.password} onChange={handleChange} required />
      <select name="role" value={form.role} onChange={handleChange}>
        <option value="student">Student</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit">Register</button>
    </form>
  );
}

export default AdminRegisterUser;
