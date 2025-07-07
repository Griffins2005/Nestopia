//src/pages/home.js
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/authContext";

import { FaUserPlus, FaSearch, FaComments, FaCalendarCheck, FaWallet } from "react-icons/fa";
import { MdOutlineCelebration } from "react-icons/md";

export default function Home() {
  const { user } = useContext(AuthContext);

  return (
    <div className="home-bg-green">
      <div className="home-wrapper">
        {/* HERO */}
        <section className="home-hero-section-green">
          <div className="hero-content">
            <h1 className="home-hero-title-green">
              <span className="hero-highlight-green">Nestopia</span>
            </h1>
            <p className="home-hero-desc-green">
              <span className="emoji" role="img" aria-label="wave">👋</span> Welcome to <b>Nestopia</b>, where finding your next home is personal, social, and secure. Earn tokens by chatting, get matched by smart AI, and move in with total peace of mind.
            </p>
            <div className="hero-cta">
              {!user && (
                <>
                  <Link to="/signup" className="btn hero-btn-green hero-btn-main-green">Get Started</Link>
                  <Link to="/login" className="btn hero-btn-green">Log In</Link>
                </>
              )}
              {user && (user.role === "renter" ? (
                <Link to="/renter" className="btn hero-btn-green hero-btn-main-green">Go to Dashboard</Link>
              ) : (
                <Link to="/landlord" className="btn hero-btn-green hero-btn-main-green">View My Listings</Link>
              ))}
            </div>
          </div>
          <div className="hero-graphic">
            <div className="hero-blob-bg-green" />
            
            <div className="hero-blurb-green">Find your nest, stress-free.</div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="home-features">
          <h2 className="section-title-green">Why Nestopia?</h2>
          <div className="features-list">
            <div className="feature-card-green">
              <span className="feature-icon">💬</span>
              <h3>Chat-to-Token</h3>
              <p>Earn tokens for every meaningful chat. Unlock visit scheduling and priority features by genuinely engaging.</p>
            </div>
            <div className="feature-card-green">
              <span className="feature-icon">✨</span>
              <h3>AI Matching</h3>
              <p>AI-powered matches based on your preferences: location, budget, and lifestyle. No more endless scrolling!</p>
            </div>
            <div className="feature-card-green">
              <span className="feature-icon">🔒</span>
              <h3>Blockchain Security</h3>
              <p>Schedule visits, hold deposits, and pay fees—all securely with blockchain and 402pay.</p>
            </div>
            <div className="feature-card-green">
              <span className="feature-icon">👛</span>
              <h3>Wallet Integration</h3>
              <p>Pay with crypto or regular currency. Transparent, instant, and secure every step of the way.</p>
            </div>
          </div>
        </section>

        {/* PROCESS STEPS */}
        <section className="home-steps">
          <h2 className="section-title-green">How It Works</h2>
          <div className="steps-row">
            <div className="step-card-green">
              <FaUserPlus className="step-icon-green" />
              <h4>1. Sign Up</h4>
              <p>Create your profile as a Renter or Landlord.</p>
            </div>
            <div className="step-arrow-green">→</div>
            <div className="step-card-green">
              <FaSearch className="step-icon-green" />
              <h4>2. Get Matched</h4>
              <p>AI finds your best-fit homes or renters.</p>
            </div>
            <div className="step-arrow-green">→</div>
            <div className="step-card-green">
              <FaComments className="step-icon-green" />
              <h4>3. Chat & Earn</h4>
              <p>Message matches and earn tokens for every reply.</p>
            </div>
            <div className="step-arrow-green">→</div>
            <div className="step-card-green">
              <FaCalendarCheck className="step-icon-green" />
              <h4>4. Schedule Visit</h4>
              <p>Reach 10 tokens together to unlock visit scheduling.</p>
            </div>
            <div className="step-arrow-green">→</div>
            <div className="step-card-green">
              <FaWallet className="step-icon-green" />
              <h4>5. Secure Your Spot</h4>
              <p>Pay deposit with 402pay & blockchain security.</p>
            </div>
            <div className="step-arrow-green">→</div>
            <div className="step-card-green">
              <MdOutlineCelebration className="step-icon-green" />
              <h4>6. Move In!</h4>
              <p>Welcome home. Enjoy stress-free living.</p>
            </div>
          </div>
        </section>

        {/* Dual Instructions */}
        <section className="instructions-dual">
          <div className="instructions-block renter-instruct">
            <h3>For Renters</h3>
            <ul>
              <li>Share your dream home preferences</li>
              <li>Chat with listers and earn tokens</li>
              <li>Book a visit and move in with ease!</li>
            </ul>
          </div>
          <div className="instructions-block landlord-instruct">
            <h3>For Landlords</h3>
            <ul>
              <li>List your space and set your criteria</li>
              <li>Connect with serious, verified renters</li>
              <li>Schedule, get paid, and relax</li>
            </ul>
          </div>
        </section>

        {/* FAQ/Contact */}
        <footer className="home-footer-green">
          <div>
            <span>Have questions?</span>
            <Link to="/about" className="footer-link-green">Learn more</Link>
            <a href="mailto:support@nestopia.com" className="footer-link-green">Contact Us</a>
          </div>
          <div className="footer-note-green">
            © {new Date().getFullYear()} Nestopia. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
