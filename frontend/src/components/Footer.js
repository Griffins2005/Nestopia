import React from 'react';

export default function Footer() {
  return (
    <footer className="home-footer">
      <div>
        <p style={{ margin: "0 0 0.4rem" }}>Have questions?</p>
        <a href="/about">Learn more</a>
        <a href="mailto:support@nestopia.com">Contact us</a>
      </div>
      <small>© {new Date().getFullYear()} Nestopia. All rights reserved.</small>
    </footer>
  );
}
