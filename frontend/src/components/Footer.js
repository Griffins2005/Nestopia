import React from 'react';
import { Link } from 'react-router-dom';
export default function Footer(){return <footer className="nest-footer"><div><Link className="nest-brand" to="/">⌂ nestopia.</Link><p>A place for your next chapter.</p></div><nav aria-label="Footer navigation"><Link to="/listings">Explore homes</Link><Link to="/preferences">Your preferences</Link><Link to="/listing/new">List a property</Link></nav><small>© {new Date().getFullYear()} Nestopia</small></footer>;}
