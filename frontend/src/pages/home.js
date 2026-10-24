import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ListingCard from '../components/listings/listingCard';
import { ListingsLoading } from '../components/EmptyState';
import Footer from '../components/Footer';
import { useNestopia } from '../context/NestopiaContext';

export default function Home() {
 const { user, listings, listingsStatus, savedIds, toggleSave } = useNestopia();
 const navigate = useNavigate();
 const [query, setQuery] = useState('');
 const [budget, setBudget] = useState('');
 const search = e => { e.preventDefault(); const params = new URLSearchParams(); if(query.trim()) params.set('q', query.trim()); if(budget) params.set('max', budget); navigate('/listings?' + params); };
 return <main className="nest-home">
  <section className="nest-hero">
   <div className="nest-hero-copy"><span className="nest-kicker"><span /> A LITTLE MORE YOU. A LITTLE MORE HOME.</span>
    <h1>Your next chapter<br/>starts <em>at home.</em></h1>
    <p>A sunlit corner. The right neighborhood. Room to be yourself. Find a rental that fits the way you live.</p>
    <a href="#discover" className="nest-text-link">Find your place <span>↗</span></a>
   </div>
   <div className="nest-hero-photo"><img src="/assets/hero-image.png" alt="Sunlit living room with generous windows and a soft neutral interior"/><span className="nest-photo-note">SPACES TO MAKE YOUR OWN</span><div className="nest-photo-caption"><span>Good spaces.<br/><i>Better beginnings.</i></span><span className="nest-photo-arrow">↗</span></div></div>
   <form className="nest-search" onSubmit={search}><label><span>WHERE</span><input aria-label="City or neighborhood" placeholder="City or neighborhood" value={query} onChange={e=>setQuery(e.target.value)}/></label><label><span>MONTHLY BUDGET</span><select aria-label="Maximum monthly rent" value={budget} onChange={e=>setBudget(e.target.value)}><option value="">Any budget</option><option value="800">Up to $800</option><option value="1500">Up to $1,500</option><option value="2500">Up to $2,500</option><option value="4000">Up to $4,000</option></select></label><button type="submit">Explore homes <span>↗</span></button></form>
  </section>
  <div className="nest-intro-strip"><span>Less searching. More belonging.</span><p>Homes to explore <b>·</b> Preferences that matter <b>·</b> A shortlist of your own</p></div>
  <section id="discover" className="nest-discover"><div className="nest-section-head"><div><span className="nest-kicker">THE SEARCH STARTS HERE</span><h2>A place for your kind of living.</h2></div><Link className="nest-text-link" to="/listings">Explore all homes ↗</Link></div>
   <div className="nest-paths">{[['01','The city is your backyard.','Find your neighborhood','Ithaca','city'],['02','A little space goes a long way.','Explore apartments','apartment','apartment'],['03','Make room for what’s next.','Explore houses','house','house']].map(([n,title,cta,q,kind])=><Link to={kind === 'city' ? '/listings?q='+q : '/listings?type='+q} className={'nest-path nest-path-'+kind} key={n}><span>{n} / FIND YOUR FIT</span><div className="nest-path-art" aria-hidden="true"><i/><i/><i/></div><h3>{title}</h3><p>{cta}<span>↗</span></p></Link>)}</div>
  </section>
  <section className="nest-featured"><div className="nest-section-head"><div><span className="nest-kicker">OPEN THE DOOR TO SOMETHING NEW</span><h2>Fresh places. New possibilities.</h2></div><Link className="nest-text-link" to="/listings">Browse listings ↗</Link></div>
   {listingsStatus === 'loading' ? <ListingsLoading count={3}/> : listings.length ? <div className="home-featured-grid">{listings.slice(0,3).map(l=><ListingCard key={l.id} listing={l} isRenter={!!user && user.role==='renter'} isSaved={savedIds.includes(l.id)} onToggleSave={toggleSave}/>)}</div> : <div className="nest-empty"><span className="nest-empty-icon">⌂</span><div><h3>{listingsStatus === 'unavailable' ? 'We couldn’t load homes just now.' : 'Your next place is still on its way.'}</h3><p>{listingsStatus === 'unavailable' ? 'Browse again to retry the connection.' : 'There are no published listings to explore yet. Set your preferences so you’re ready when homes arrive.'}</p></div><Link to={listingsStatus === 'unavailable' ? '/listings' : user ? '/preferences' : '/login'}>{listingsStatus === 'unavailable' ? 'Try browsing again ↗' : 'Set my preferences ↗'}</Link></div>}
  </section>
  <section className="nest-how" id="how-it-works"><div><span className="nest-kicker">A MORE THOUGHTFUL WAY TO RENT</span><h2>Big move.<br/><em>Simple steps.</em></h2><p>A home search should feel like a beginning. Keep your priorities, your favorite places, and your next steps together.</p><Link className="nest-text-link" to={user?'/preferences':'/login'}>Make it personal ↗</Link></div><div className="nest-steps">{[['01','Start with what matters.','Tell us your budget, location, and must-haves. Give your search a little direction.'],['02','Find your fit.','Explore homes and compare them against your preferences. Save the places you want to come back to.'],['03','Take the next step.','Open a listing for property details and host contact options. Ask the questions that help you decide.']].map(([n,t,d])=><article key={n}><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div></article>)}</div></section>
  <section className="nest-host"><span className="nest-kicker">FOR PEOPLE WITH A PLACE TO SHARE</span><h2>Your space.<br/>Someone’s <em>fresh start.</em></h2><p>Give your rental a home on Nestopia.</p><Link to={user?'/listing/new':'/login'}>List your property ↗</Link></section>
  <Footer/>
 </main>;
}
