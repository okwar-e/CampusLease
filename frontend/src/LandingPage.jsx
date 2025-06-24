import React from 'react';
import { Link } from 'react-router-dom';
import './landing.css';
import heroImage from './assets/uni2.jpeg'; // Ensure this path is correct

const LandingPage = () => {
  return (
    <div className="container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="logo">🎓 CampusLease</div>
        <div className="nav-links">
          <a href="#">About</a>
          <a href="#">Contact</a>
          <button className="login-btn">Login</button>
          <button className="register-btn">Register</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header
        className="hero"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <h1 className="hero-title">
          Got Something Lying Around? Why Not Earn from It
        </h1>
        <p className="hero-subtitle">
          CampusLease connects Strathmore University students, offering affordable access to essential items and a chance to earn from unused belongings. Join our community today!
        </p>
        <Link to="/auth">
          <button className="hero-button">Browse Items</button>
        </Link>
      </header>

      {/* Features Section */}
      <section className="features">
        <h2>Why CampusLease?</h2>
        <div className="feature-list">
          <div className="feature">
            <h3>✅ Student-Only Access</h3>
            <p>Only approved @strathmore.edu emails can register and rent.</p>
          </div>
          <div className="feature">
            <h3>🔒 Secure Transactions</h3>
            <p>Verified identity via selfie & student ID. Admin-approved users only.</p>
          </div>
          <div className="feature">
            <h3>💼 Rent Anything</h3>
            <p>From calculators to chairs – list or lease anything short-term.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} CampusLease · Strathmore University</p>
      </footer>
    </div>
  );
};

export default LandingPage;
