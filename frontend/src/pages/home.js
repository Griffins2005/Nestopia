import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icons';
import ListingCard from '../components/listings/listingCard';
import EmptyState, { ListingsLoading } from '../components/EmptyState';
import Footer from '../components/Footer';
import { getFeaturedEmptyState } from '../api/listings';
import { useNestopia } from '../context/NestopiaContext';

const VALUE_PROPS = [
  { title: "Direct contact", icon: "📞",
    description: "Reach verified hosts by email or phone with context from your profile so every intro feels personal." },
  { title: "AI Matching", icon: "✨",
    description: "We collect your housing preferences, convert them to vectors, and calculate a compatibility score for each listing—the match % you see reflects how well that home fits you." },
  { title: "Verified profiles", icon: "🛡️",
    description: "We collect full bios plus contact info for renters and hosts, then surface it responsibly." },
  { title: "Tour coordination", icon: "📅",
    description: "Share calendars, send reminders, and track next steps without juggling five apps." },
];

const JOURNEY_STEPS = [
  { title: "Tell us your vibe", copy: "Share your must-haves, decor dreams, and timing. We listen first.", iconName: "user-plus" },
  { title: "Curated matches", copy: "Your preferences become vectors. We score every listing for compatibility and rank the strongest fits first.", iconName: "magnifying-glass" },
  { title: "Reach out directly", copy: "Use verified email and phone details plus your Nestopia profile to make a warm introduction.", iconName: "phone" },
  { title: "Plan the visit", copy: "Schedule warm introductions and hosted tours when it feels right.", iconName: "calendar-check" },
  { title: "Review next steps", copy: "We line up documents, references, and reminders so you can say yes with confidence.", iconName: "file-signature" },
  { title: "Move in & celebrate", copy: "Close confident, move in calm, and keep earning community perks.", iconName: "champagne-glasses" },
];

const STORIES = [
  { quote: "“Nestopia felt like a friend walking me into every listing. I could sense the people behind each home.”", name: "Bria", role: "Renter in Brooklyn" },
  { quote: "“We met renters who valued our restored brownstone. Direct introductions kept conversations thoughtful.”", name: "Marcus & Eli", role: "Landlords in Atlanta" },
  { quote: "“Sharing our Nestopia profile made long-distance touring less scary. We signed with full trust.”", name: "Han & Pri", role: "New to Seattle" },
];

export default function Home() {
  const { user, listings, listingsStatus, savedIds, toggleSave } = useNestopia();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const runSearch = () => {
    navigate(`/listings${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
  };
  const onKey = (e) => { if (e.key === 'Enter') runSearch(); };

  const treatAsRenter = !user || user.role === 'renter';
  const featured = useMemo(
    () => [...listings].sort((a, b) => (b.match_score || 0) - (a.match_score || 0)).slice(0, 3),
    [listings]
  );

  const featuredFallback = getFeaturedEmptyState({ listingsStatus });

  return (
    <div className="home-shell">
      <section className="welcome-hero">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow">Welcome to Nestopia</p>
          <h1>Find a place and people that feel like home.</h1>
          <p>
            Nestopia pairs your lifestyle with warm spaces, thoughtful hosts, and
            secure, transparent workflows. Come for the listings, stay for the
            way we treat people.
          </p>

          <div className="hero-search-pill">
            <Icon name="magnifying-glass" />
            <input
              placeholder="Search neighborhoods, homes, hosts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKey}
            />
            <button type="button" onClick={runSearch}>
              Explore <Icon name="arrow-right" />
            </button>
          </div>

          <ul className="hero-trust-list">
            <li><Icon name="circle-check" /> Verified hosts</li>
            <li><Icon name="circle-check" /> No hidden fees</li>
            <li><Icon name="circle-check" /> Tours in ~48 hrs</li>
          </ul>
        </div>

        <div className="hero-image-card">
          <div className="hero-image-frame">
            <img src="/assets/hero-image.png" alt="A bright, lived-in living room" />
            <div className="hero-image-chip">
              <span className="hero-chip-match">92%</span>
              <div className="hero-chip-meta">
                <strong>Park Slope brownstone</strong>
                <span>Marcus is hosting</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-featured">
        <div className="home-featured-head">
          <div>
            <p className="eyebrow">Homes we think you&apos;ll love</p>
            <h2>{treatAsRenter ? "Your top matches right now" : "Fresh on Nestopia"}</h2>
          </div>
          {featured.length > 0 && (
            <button className="cta-btn text" onClick={() => navigate('/listings')}>
              Browse all homes <Icon name="arrow-right" />
            </button>
          )}
        </div>

        {featuredFallback?.type === 'loading' ? (
          <ListingsLoading count={3} />
        ) : featured.length > 0 ? (
          <div className="home-featured-grid">
            {featured.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isRenter={treatAsRenter}
                isSaved={savedIds.includes(listing.id)}
                onSelect={(l) => navigate(`/listing/${l.id}`)}
                onToggleSave={toggleSave}
              />
            ))}
          </div>
        ) : featuredFallback?.type === 'empty' ? (
          <EmptyState {...featuredFallback} />
        ) : null}
      </section>

      <section className="warm-value-grid">
        {VALUE_PROPS.map((v) => (
          <article key={v.title} className="value-card cozy">
            <span className="value-icon">{v.icon}</span>
            <h3>{v.title}</h3>
            <p>{v.description}</p>
          </article>
        ))}
      </section>

      <section className="home-journey warm">
        <div className="section-heading-wrap">
          <p className="eyebrow eyebrow-muted">Renting reimagined</p>
          <h2>How your Nestopia journey unfolds</h2>
          <p>Every touchpoint is designed to feel personal, transparent, and calm.</p>
        </div>
        <div className="journey-grid">
          {JOURNEY_STEPS.map((step) => (
            <article key={step.title} className="journey-card">
              <div className="journey-icon"><Icon name={step.iconName} /></div>
              <h4>{step.title}</h4>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="community-stories">
        <div className="section-heading-wrap">
          <p className="eyebrow eyebrow-muted">Community warmth</p>
          <h2>Stories from renters and hosts</h2>
        </div>
        <div className="stories-grid">
          {STORIES.map((s) => (
            <article key={s.name} className="story-card">
              <p className="story-quote">{s.quote}</p>
              <div className="story-meta">
                <strong>{s.name}</strong>
                <span>{s.role}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-banner">
        <div>
          <p className="eyebrow eyebrow-muted">Ready when you are</p>
          <h2>Let&apos;s create a rental story you&apos;re excited to tell.</h2>
          <p>
            Build your profile in minutes, invite a co-signer, or drop a note to a host you love.
            Nestopia keeps every step warm, simple, and secure.
          </p>
        </div>
        <div className="cta-banner-actions">
          {!user
            ? <button className="cta-btn" onClick={() => navigate('/login')}>Start for free</button>
            : <button className="cta-btn" onClick={() => navigate('/listings')}>Continue where you left off</button>}
          <button className="cta-btn ghost">Talk to our team</button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
