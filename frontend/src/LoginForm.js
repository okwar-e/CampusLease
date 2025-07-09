import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./LoginForm.css";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    school_email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5050/login", formData, {
        withCredentials: true
      });

      const { token, user } = res.data;
      if (!user || !user.role) throw new Error("User role missing in response");

      if (token) localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate(user.role === "admin" ? "/admin" : "/student");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <nav className="navbar">
        <div className="nav-left">
          <h1 className="logo">🎓 CampusLease</h1>
        </div>
        <div className="nav-right">
          <a href="./" className="nav-link">Home</a>
          <a href="#" className="btn login-btn">Login</a>
          <a href="./register" className="btn register-btn">Register</a>
        </div>
      </nav>

      <div className="login-page-body">
        <div className="login-container">
          <form onSubmit={handleSubmit} className="login-form">
            <h2>Welcome back</h2>
            {error && <p className="error">{error}</p>}

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                name="school_email"
                placeholder="Enter your email"
                value={formData.school_email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <span
                  className="toggle-icon"
                  onClick={togglePasswordVisibility}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </div>
            </div>



            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="register-link">
              Don't have an account? <a href="/register">Register</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
