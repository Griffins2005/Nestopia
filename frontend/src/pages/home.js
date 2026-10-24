import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, RegIcon } from '../components/Icons';
import ListingCard from '../components/listings/listingCard';
import { ListingsLoading } from '../components/EmptyState';
import Footer from '../components/Footer';
import { getListingImages } from '../api/listings';
import { getListingMatchPercent } from '../api/matches';
import { useNestopia } from '../context/NestopiaContext';

const PROMISES = [
  { title: 'Direct contact', copy: 'Reach verified hosts by email or phone with context from your profile so every intro feels personal.' },
  { title: 'Matching', copy: 'We take your housing preferences and score each listing for compatibility. The match % you see reflects how well that home fits you.' },
  { title: 'Verified profiles', copy: 'We collect full bios plus contact info for renters and hosts, then surface it responsibly.' },
  { title: 'Tour coordination', copy: 'Share calendars, send reminders, and track next steps in one place.' },
];

const STEPS = [
  { title: 'Tell us your vibe', copy: 'Share your must-haves, decor dreams, and timing. We listen first.' },
  { title: 'Curated matches', copy: 'We score every listing for compatibility and rank the strongest fits first.' },
  { title: 'Reach out directly', copy: 'Use verified email and phone details plus your Nestopia profile to make a warm introduction.' },
  { title: 'Plan the visit', copy: 'Schedule warm introductions and hosted tours when it feels right.' },
  { title: 'Review next steps', copy: 'We line up documents, references, and reminders so you can say yes with confidence.' },
  { title: 'Move in and celebrate', copy: 'Close confident, move in calm, and keep the people you met close.' },
];

const STORIES = [
  { quote: '“Nestopia felt like a friend walking me into every listing. I could sense the people behind each home.”', name: 'Bria', role: 'Renter in Brooklyn' },
  { quote: '“We met renters who valued our restored brownstone. Direct introductions kept conversations thoughtful.”', name: 'Marcus & Eli', role: 'Landlords in Atlanta' },
  { quote: '“Sharing our Nestopia profile made long-distance touring less scary. We signed with full trust.”', name: 'Han & Pri', role: 'New to Seattle' },
];

const TRUST = ['Verified hosts', 'No hidden fees', 'Tours in ~48 hrs'];

function facts(listing) {
  const bits = [];
  if (listing.bedrooms === 0) bits.push('Studio');
  else if (listing.bedrooms != null) bits.push(`${listing.bedrooms} bed${listing.bedrooms === 1 ? '' : 's'}`);
  if (listing.bathrooms != null) bits.push(`${listing.bathrooms} bath${listing.bathrooms === 1 ? '' : 's'}`);
  if (listing.sqft) bits.push(`${listing.sqft} sqft`);
  return bits;
}

export default function Home() {
  const { user, listings, listingsStatus, savedIds, toggleSave } = useNestopia();
  const navigate = useNavigate();
  const treatAsRenter = !user || user.role === 'renter';

  const featured = useMemo(
    () => [...listings].sort((a, b) => (b.match_score || 0) - (a.match_score || 0)),
    [listings]
  );
  const lead = featured[0];
  const more = featured.slice(1, 4);
  const leadImage = lead ? getListingImages(lead)[0] : '/assets/hero-image.png';
  const leadMatch = lead ? getListingMatchPercent(lead) : 0;
  const highlights = (lead?.amenities || []).slice(0, 4);

  const needs = () => navigate(user ? '/preferences' : '/login');

  return (
    <div className="home-shell calm-home">
      <section className="calm-hero">
        <div className="calm-hero-copy">
          <p className="eyebrow hero-eyebrow">Welcome to Nestopia</p>
          <h1>Find a place and people that feel like home.</h1>
          <p>
            Nestopia pairs your lifestyle with warm spaces, thoughtful hosts, and
            secure, transparent workflows. Come for the listings, stay for the
            way we treat people.
          </p>
        </div>
        <div className="calm-hero-photo">
          <img src={leadImage} alt="" />
        </div>
        <div className="calm-hero-do">
          <div className="calm-actions">
            <button type="button" className="cta-btn" onClick={() => navigate('/listings')}>
              Explore <Icon name="arrow-right" />
            </button>
            <button type="button" className="cta-btn ghost" onClick={needs}>
              {user ? 'Your preferences' : 'Start for free'}
            </button>
          </div>
          <ul className="calm-trust">
            {TRUST.map((item) => (
              <li key={item}><Icon name="circle-check" /> {item}</li>
            ))}
          </ul>
        </div>
      </section>

      <div className="section-break" aria-hidden="true" />

      <section className="calm-homes">
        <div className="calm-section-head">
          <p className="eyebrow">Homes we think you&apos;ll love</p>
          <h2>{lead ? 'Your top matches right now' : 'Homes are on their way'}</h2>
          <p>
            {listingsStatus === 'loading'
              ? 'Gathering homes for you.'
              : lead
                ? 'Open a home, save it, or reach the host directly.'
                : 'New homes will show up here. Your preferences can be ready when they do.'}
          </p>
        </div>

        {listingsStatus === 'loading' ? (
          <ListingsLoading count={2} />
        ) : lead ? (
          <>
            <article className="calm-feature">
              <button type="button" className="calm-feature-photo" onClick={() => navigate(`/listing/${lead.id}`)}>
                <img src={leadImage} alt="" />
              </button>
              <div className="calm-feature-body">
                <div className="calm-feature-top">
                  <div>
                    <h3>{lead.title}</h3>
                    {lead.location && <p className="calm-place">{lead.location}</p>}
                  </div>
                  {treatAsRenter && leadMatch > 0 && <span className="calm-fit">{leadMatch}% fit</span>}
                </div>
                {facts(lead).length > 0 && <p className="calm-facts">{facts(lead).join('  ·  ')}</p>}
                {lead.description && <p className="calm-desc">{lead.description}</p>}
                {highlights.length > 0 && (
                  <ul className="calm-highlights">
                    {highlights.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}
                <div className="calm-feature-foot">
                  <strong>${lead.rent_price?.toLocaleString()}<small> / month</small></strong>
                  <div className="calm-feature-actions">
                    <button type="button" className="cta-btn" onClick={() => navigate(`/listing/${lead.id}`)}>View home</button>
                    <button
                      type="button"
                      className={`cta-btn ghost calm-save${savedIds.includes(lead.id) ? ' is-saved' : ''}`}
                      onClick={() => toggleSave(lead.id)}
                    >
                      {savedIds.includes(lead.id) ? <Icon name="heart" /> : <RegIcon name="heart" />}
                      {savedIds.includes(lead.id) ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </article>

            {more.length > 0 && (
              <div className="home-featured-grid calm-more">
                {more.map((listing) => (
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
            )}

            <button type="button" className="cta-btn text calm-more-link" onClick={() => navigate('/listings')}>
              Browse all homes <Icon name="arrow-right" />
            </button>
          </>
        ) : null}
      </section>

      <div className="section-break" aria-hidden="true" />

      <section className="calm-steps">
        <div className="calm-section-head">
          <p className="eyebrow">Renting reimagined</p>
          <h2>How your Nestopia journey unfolds</h2>
          <p>Every touchpoint is designed to feel personal, transparent, and calm.</p>
        </div>
        <ol>
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span>{index + 1}</span>
              <strong>{step.title}</strong>
              <p>{step.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="section-break" aria-hidden="true" />

      <ul className="calm-promises">
        {PROMISES.map((item) => (
          <li key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.copy}</span>
          </li>
        ))}
      </ul>

      <div className="section-break" aria-hidden="true" />

      <section className="community-stories">
        <div className="section-heading-wrap">
          <p className="eyebrow">Community warmth</p>
          <h2>Stories from renters and hosts</h2>
        </div>
        <div className="stories-grid">
          {STORIES.map((story) => (
            <article key={story.name} className="story-card">
              <p className="story-quote">{story.quote}</p>
              <div className="story-meta">
                <strong>{story.name}</strong>
                <span>{story.role}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="section-break" aria-hidden="true" />

      <section className="calm-close">
        <div>
          <p className="eyebrow">Ready when you are</p>
          <h2>Let&apos;s create a rental story you&apos;re excited to tell.</h2>
          <p>
            Build your profile in minutes, invite a co-signer, or drop a note to a host you love.
            Nestopia keeps every step warm, simple, and secure.
          </p>
        </div>
        <div className="calm-actions">
          {!user
            ? <button type="button" className="cta-btn" onClick={() => navigate('/login')}>Start for free</button>
            : <button type="button" className="cta-btn" onClick={() => navigate('/listings')}>Continue where you left off</button>}
          <a className="cta-btn ghost" href="mailto:support@nestopia.com">Talk to our team</a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
