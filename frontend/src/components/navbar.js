import React, {useState} from 'react';
import {Link, NavLink} from 'react-router-dom';
import {useNestopia} from '../context/NestopiaContext';
export default function Navbar(){
 const {user,logout}=useNestopia(); const [open,setOpen]=useState(false);
 return <header className="nest-nav"><Link to="/" className="nest-brand" aria-label="Nestopia home"><span>⌂</span>nestopia<span className="nest-brand-dot">.</span></Link><button className="nest-menu" onClick={()=>setOpen(!open)} aria-expanded={open} aria-controls="nest-navigation">{open?'Close':'Menu'}</button><nav id="nest-navigation" className={open?'is-open':''} aria-label="Main navigation" onClick={()=>setOpen(false)}><NavLink to="/listings">Explore homes</NavLink><NavLink to={user?'/matches':'/login'}>Your matches</NavLink><NavLink to={user?'/saved':'/login'}>Saved homes</NavLink><Link className="nest-nav-host" to={user?'/listing/new':'/login'}>List a property ↗</Link><Link className="nest-nav-account" to={user?'/profile':'/login'}>{user?'My account':'Log in'} <span>↗</span></Link>{user&&<button onClick={logout}>Sign out</button>}</nav></header>;
}
