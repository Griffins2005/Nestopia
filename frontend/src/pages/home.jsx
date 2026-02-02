import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiArrowRight } from "react-icons/fi";
import {
  FaUserPlus,
  FaSearch,
  FaPhoneAlt,
  FaCalendarCheck,
  FaFileSignature,
} from "react-icons/fa";
import { MdOutlineCelebration } from "react-icons/md";
import AuthContext from "../context/authContext";
import { fetchStatsSummary } from "../api/stats";

const valueProps = [
  {
    title: "Direct contact",
    description:
      "Reach verified hosts by email or phone with context from your profile so every intro feels personal.",
    icon: "📞",
  },
  {
    title: "AI Matching",
    description:
      "Let our hybrid AI compare budget, lifestyle, and timing so the options you see already feel like home.",
    icon: "✨",
  },
  {
    title: "Verified profiles",
    description:
      "We collect full bios plus contact info for renters and hosts, then surface it responsibly.",
    icon: "🛡️",
  },
  {
    title: "Tour coordination",
    description:
      "Share calendars, send reminders, and track next steps without juggling five apps.",
    icon: "📅",
  },
];

const journeySteps = [
  {
    title: "Tell us your vibe",
    copy: "Share your must-haves, decor dreams, and timing. We listen first.",
    icon: <FaUserPlus />,
  },
  {
    title: "Curated matches",
    copy: "AI highlights homes and renters who already fit your rhythms.",
    icon: <FaSearch />,
  },
  {
    title: "Reach out directly",
    copy: "Use verified email and phone details plus your Nestopia profile to make a warm introduction.",
    icon: <FaPhoneAlt />,
  },
  {
    title: "Plan the visit",
    copy: "Schedule warm introductions and hosted tours when it feels right.",
    icon: <FaCalendarCheck />,
  },
  {
    title: "Review next steps",
    copy: "We line up documents, references, and reminders so you can say yes with confidence.",
    icon: <FaFileSignature />,
  },
  {
    title: "Move in & celebrate",
    copy: "Close confident, move in calm, and keep earning community perks.",
    icon: <MdOutlineCelebration />,
  },
];

const heroHighlights = [
  {
    title: "Warm introductions",
    detail: "Hosts send a personal hello before you ever knock on a door.",
  },
  {
    title: "Verified contact info",
    detail: "We collect email + phone from both sides so reaching out feels confident.",
  },
  {
    title: "Faster move-ins",
    detail: "Average tours within 48 hours, with flexible, human scheduling.",
  },
];

const stories = [
  {
    quote:
      "“Nestopia felt like a friend walking me into every listing. I could sense the people behind each home.”",
    name: "Bria",
    role: "Renter in Brooklyn",
  },
  {
    quote:
      "“We met renters who valued our restored brownstone. Direct introductions kept conversations thoughtful.”",
    name: "Marcus & Eli",
    role: "Landlords in Atlanta",
  },
  {
    quote:
      "“Sharing our Nestopia profile made long-distance touring less scary. We signed with full trust.”",
    name: "Han & Pri",
    role: "New to Seattle",
  },
];

export default function Home() {
  const { user } = useContext(AuthContext);
  const [statsSummary, setStatsSummary] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchStatsSummary()
      .then((data) => {
        if (mounted) {
          setStatsSummary(data);
        }
      })
      .catch(() => {
        if (mounted) {
          setStatsSummary(null);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const heroStats = [
    {
      value:
        typeof statsSummary?.total_users === "number"
          ? statsSummary.total_users.toLocaleString()
          : "—",
      label: "Connected renters & hosts",
    },
    {
      value:
        typeof statsSummary?.total_listings === "number"
          ? statsSummary.total_listings.toLocaleString()
          : "—",
      label: "Active homes on Nestopia",
    },
    {
      value:
        typeof statsSummary?.avg_visit_lead_hours === "number"
          ? `${statsSummary.avg_visit_lead_hours} hrs`
          : "—",
      label: "Avg. match-to-visit time",
    },
  ];

  return (
    <div className="home-shell warm-home">
      <section className="welcome-hero">
        <div className="hero-copy">
          <p className="eyebrow soft">Welcome to Nestopia</p>
          <h1>Find a place—and people—that feel like home.</h1>
          <p>
            Nestopia pairs your lifestyle with warm spaces, thoughtful hosts, and
            secure, transparent workflows. Come for the listings, stay for the
            way we treat people.
          </p>

          <div className="hero-search-pill">
            <FiSearch />
            <input placeholder="Search neighborhoods, homes, hosts..." />
            <button type="button">
              Explore
              <FiArrowRight />
            </button>
          </div>

          <div className="hero-cta-group">
            {!user && (
              <>
                <Link to="/signup" className="cta-btn primary">
                  Create a profile
                </Link>
                <Link to="/login" className="cta-btn ghost">
                  I already have an account
                </Link>
              </>
            )}
            {user && (
              <Link
                to={user.role === "renter" ? "/renter" : "/landlord"}
                className="cta-btn primary"
              >
                {user.role === "renter" ? "Go to dashboard" : "View my listings"}
              </Link>
            )}
            <Link to="/listings" className="cta-btn text">
              Browse homes
            </Link>
          </div>

          <p className="hero-assurance">
            No hidden fees—just generous humans and calm, secure workflows.
          </p>
        </div>

        <div className="hero-visual minimal">
          <div className="hero-side-card">
            <p className="pill subtle">Community-first</p>
            <h3>Every step feels human.</h3>
            <p>Here&apos;s what renters tell us makes Nestopia feel different:</p>
            <ul className="hero-highlights-list">
              {heroHighlights.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </li>
              ))}
            </ul>
            <div className="hero-note">
              <span>92% vibe score last quarter</span>
              <span>Thousands of kind introductions</span>
            </div>
          </div>
        </div>
      </section>

      <section className="hero-stats-panel">
        {heroStats.map((stat) => (
          <div key={stat.label}>
            <span>{stat.value}</span>
            <small>{stat.label}</small>
          </div>
        ))}
      </section>

      <section className="warm-value-grid">
        {valueProps.map((item) => (
          <article key={item.title} className="value-card cozy">
            <span className="value-icon">{item.icon}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="home-journey warm">
        <div className="section-heading-wrap">
          <p className="eyebrow soft">Renting reimagined</p>
          <h2>How your Nestopia journey unfolds</h2>
          <p>Every touchpoint is designed to feel personal, transparent, and calm.</p>
        </div>
        <div className="journey-grid">
          {journeySteps.map((step) => (
            <article key={step.title} className="journey-card">
              <div className="journey-icon">{step.icon}</div>
              <h4>{step.title}</h4>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="community-stories">
        <div className="section-heading-wrap">
          <p className="eyebrow soft">Community warmth</p>
          <h2>Stories from renters and hosts</h2>
        </div>
        <div className="stories-grid">
          {stories.map((story) => (
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

      <section className="cta-banner">
        <div>
          <p className="eyebrow soft">Ready when you are</p>
          <h2>Let&apos;s create a rental story you&apos;re excited to tell.</h2>
          <p>
            Build your profile in minutes, invite a co-signer, or drop a note to a host you love.
            Nestopia keeps every step warm, simple, and secure.
          </p>
        </div>
        <div className="cta-banner-actions">
          {!user && (
            <Link to="/signup" className="cta-btn primary">
              Start for free
            </Link>
          )}
          {user && (
            <Link
              to={user.role === "renter" ? "/renter" : "/landlord"}
              className="cta-btn primary"
            >
              Continue where you left off
            </Link>
          )}
          <Link to="/contact" className="cta-btn ghost">
            Talk to our team
          </Link>
        </div>
      </section>

      <footer className="home-footer cozy">
        <div>
          <p>Have questions?</p>
          <Link to="/about">Learn more</Link>
          <a href="mailto:support@nestopia.com">Contact us</a>
        </div>
        <small>© {new Date().getFullYear()} Nestopia. All rights reserved.</small>
      </footer>
    </div>
  );
}
