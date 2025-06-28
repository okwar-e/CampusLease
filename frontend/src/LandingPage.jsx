import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './landing.css';
import heroImage from './assets/uni3.jpg';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="logo">🎓 CampusLease</div>
        <div className="nav-links">
          <button 
            className="nav-link" 
            onClick={() => handleNavigation('/')}
          >
            About
          </button>
          <button 
            className="nav-link" 
            onClick={() => handleNavigation('/')}
          >
            Contact
          </button>
          <button 
            className="login-btn"
            onClick={() => handleNavigation('/Auth')}
          >
            signin
          </button>
          
        </div>
      </nav>

      {/* Hero Section */}
      <header
        className="hero"
        style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${heroImage})` }}
        aria-label="CampusLease hero section"
      >
        <div className="hero-content">
          <h1 className="hero-title">
            Got Something Lying Around? Why Not Earn from It?
          </h1>
          <p className="hero-subtitle">
            CampusLease connects Strathmore University students, offering affordable access to essential items and a chance to earn from unused belongings. Join our community today!
          </p>
          <Link to="/Listings" className="hero-button-link">
            <button className="hero-button">Browse Items</button>
          </Link>
        </div>
      </header>

      {/* Features Section */}
      <section className="features" aria-labelledby="features-heading">
        <h2 id="features-heading">Why CampusLease?</h2>
        <div className="feature-list">
          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3>Student-Only Access</h3>
            <p>Only approved @strathmore.edu emails can register and rent.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure Transactions</h3>
            <p>Verified identity via selfie & student ID. Admin-approved users only.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💼</div>
            <h3>Rent Anything</h3>
            <p>From calculators to chairs – list or lease anything short-term.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <h2>Ready to Get Started?</h2>
        <div className="cta-buttons">
          <button 
            className="cta-button primary"
            onClick={() => handleNavigation('/register')}
          >
            Join Now
          </button>
          <button 
            className="cta-button secondary"
            onClick={() => handleNavigation('/login')}
          >
            Sign In
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} CampusLease · Strathmore University</p>
        <div className="footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;