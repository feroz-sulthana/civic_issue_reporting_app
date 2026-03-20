import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./LandingPage.css";

import {
  MapPin, Camera, Bell, ThumbsUp, MessageCircle, BarChart2,
  CheckCircle, Users, Globe, AlertTriangle, ChevronRight,
  Github, Twitter, Instagram, Linkedin, Star,
  Trash2, Zap, Shield, TrendingUp, Award, Mail, Phone,
} from "lucide-react";

/* ════════════════════════════════
   DATA
════════════════════════════════ */
const FEATURES = [
  { icon: <Camera size={22} />,       color: "lp-feat-blue",   title: "Easy Issue Reporting",      desc: "Submit complaints with photos, descriptions, and precise location in under a minute." },
  { icon: <MapPin size={22} />,        color: "lp-feat-green",  title: "Location-Based Tracking",   desc: "Automatically routes complaints to the right municipal authority or volunteer." },
  { icon: <Bell size={22} />,          color: "lp-feat-teal",   title: "Real-Time Status Updates",  desc: "Track your complaint's progress from submission through resolution, live." },
  { icon: <ThumbsUp size={22} />,      color: "lp-feat-orange", title: "Community Voting",          desc: "Citizens upvote urgent issues so authorities prioritize what matters most." },
  { icon: <MessageCircle size={22} />, color: "lp-feat-purple", title: "Comments & Feedback",       desc: "Discuss issues, provide field updates, and engage with your community." },
  { icon: <BarChart2 size={22} />,     color: "lp-feat-rose",   title: "Admin Monitoring",          desc: "Powerful dashboards let admins manage users, complaints, and generate reports." },
];

const STEPS = [
  { n: "1", title: "Report Issue",    desc: "Upload a photo, add description, and pin your location on the map." },
  { n: "2", title: "Auto Assignment", desc: "Complaint is routed to the appropriate authority or volunteer." },
  { n: "3", title: "Track Progress",  desc: "Receive real-time status updates as your issue is addressed." },
  { n: "4", title: "Issue Resolved",  desc: "Authority marks it resolved and you get a completion notification." },
];

/* ════════════════════════════════
   PREVIEW MOCK-UPS
════════════════════════════════ */
function PreviewShell({ title, children }) {
  return (
    <div className="lp-preview-card">
      <div className="lp-preview-header">
        <div className="lp-preview-dots">
          <span className="lp-pd1" /><span className="lp-pd2" /><span className="lp-pd3" />
        </div>
        <div className="lp-preview-title">{title}</div>
      </div>
      <div className="lp-preview-body">{children}</div>
    </div>
  );
}

function PreviewUserDash() {
  const rows = [
    ["Broken Streetlight — MG Road", "In Progress", "75%",  "var(--blue)"],
    ["Pothole — Ring Road",          "Resolved",    "100%", "var(--green)"],
    ["Garbage Dump — Sector 4",      "Pending",     "20%",  "#f59e0b"],
  ];
  return (
    <PreviewShell title="User Dashboard">
      <div className="lp-mock-badge-row">
        <span className="lp-mock-badge lp-mb-blue">3 Active</span>
        <span className="lp-mock-badge lp-mb-green">7 Resolved</span>
        <span className="lp-mock-badge lp-mb-orange">1 Pending</span>
      </div>
      {rows.map(([label, status, w, c], i) => (
        <div key={i} className="lp-mock-bar-row">
          <div className="lp-mock-bar-label">
            <span style={{ fontWeight: 600, fontSize: 12, color: "var(--slate)" }}>{label}</span>
            <span style={{ color: c, fontWeight: 600 }}>{status}</span>
          </div>
          <div className="lp-mock-bar-track">
            <div className="lp-mock-bar-fill" style={{ width: w, background: c }} />
          </div>
        </div>
      ))}
    </PreviewShell>
  );
}

function PreviewForm() {
  return (
    <PreviewShell title="Report a Complaint">
      <div className="lp-mock-map">📍 Tap to pin location</div>
      {["Issue Title", "Category", "Description"].map((p, i) => (
        <div key={i} className="lp-mock-field">{p}</div>
      ))}
      <div className="lp-mock-attach">📎 Attach Photo</div>
      <div className="lp-mock-submit">Submit Report →</div>
    </PreviewShell>
  );
}

function PreviewVoting() {
  const votes = [
    ["Garbage near school",   128, "high"],
    ["Water leak on 5th Ave",  84, "med"],
    ["Broken swings in park",  51, "low"],
  ];
  const badgeStyle = (p) => ({
    fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 700,
    background: p === "high" ? "#fee2e2" : p === "med" ? "#fef9c3" : "#dcfce7",
    color:      p === "high" ? "#dc2626" : p === "med" ? "#b45309" : "var(--green)",
  });
  return (
    <PreviewShell title="Voting & Comments">
      {votes.map(([t, v, p], i) => (
        <div key={i} className="lp-mock-vote">
          <div className="lp-mock-vote-btn"><ThumbsUp size={11} />{v}</div>
          <span className="lp-mock-vote-text">{t}</span>
          <span style={badgeStyle(p)}>{p}</span>
        </div>
      ))}
      <div className="lp-mock-comment">
        💬 <em>"This pothole caused an accident last week."</em>
      </div>
    </PreviewShell>
  );
}

function PreviewAdmin() {
  const mini = [
    ["Total",      "1,248", true ],
    ["Resolved",   "938",   false],
    ["Pending",    "183",   false],
    ["Volunteers", "421",   false],
  ];
  const bars = [
    ["Potholes", "62%", "var(--blue)"],
    ["Garbage",  "28%", "var(--green)"],
    ["Water",    "10%", "var(--teal)"],
  ];
  return (
    <PreviewShell title="Admin Analytics">
      <div className="lp-admin-mini-grid">
        {mini.map(([l, v, h], i) => (
          <div key={i} className="lp-admin-mini-card" style={{ background: h ? "var(--blue)" : "var(--bg)" }}>
            <div className="lp-admin-mini-label" style={{ color: h ? "rgba(255,255,255,.7)" : undefined }}>{l}</div>
            <div className="lp-admin-mini-val"   style={{ color: h ? "#fff" : undefined }}>{v}</div>
          </div>
        ))}
      </div>
      {bars.map(([l, w, c], i) => (
        <div key={i} className="lp-mock-bar-row">
          <div className="lp-mock-bar-label">
            <span style={{ fontSize: 11 }}>{l}</span>
            <span style={{ fontSize: 11, fontWeight: 700 }}>{w}</span>
          </div>
          <div className="lp-mock-bar-track">
            <div className="lp-mock-bar-fill" style={{ width: w, background: c }} />
          </div>
        </div>
      ))}
    </PreviewShell>
  );
}

/* ════════════════════════════════
   CITY MAP GRAPHIC
════════════════════════════════ */
function CityMapGraphic() {
  const pins = [
    { style: { top: "22%", left: "28%" },    cls: "lp-pin-red",    Icon: AlertTriangle, label: "Pothole" },
    { style: { top: "42%", right: "22%" },   cls: "lp-pin-yellow", Icon: Trash2,        label: "Garbage" },
    { style: { bottom: "28%", left: "40%" }, cls: "lp-pin-green",  Icon: CheckCircle,   label: "Resolved" },
    { style: { top: "64%", left: "18%" },    cls: "lp-pin-blue",   Icon: Zap,           label: "Streetlight" },
  ];
  return (
    <div className="lp-city-map">
      <div className="lp-map-grid" />
      <div className="lp-map-roads" />
      {pins.map(({ style, cls, Icon, label }, i) => (
        <div key={i} className="lp-map-pin" style={style}>
          <div className={`lp-pin-icon ${cls}`}><Icon size={14} /></div>
          <div className="lp-pin-label">{label}</div>
        </div>
      ))}
      <div className="lp-map-center-badge">
        <div className="lp-badge-icon"><TrendingUp size={22} /></div>
        <div className="lp-badge-text">
          <strong>74%</strong>
          <span>Issues resolved this week</span>
        </div>
      </div>
      <div className="lp-map-card lp-card-float-1">
        <div className="lp-map-card-top">
          <div className="lp-map-dot lp-dot-green" />
          <div className="lp-map-card-label">Garbage Pickup</div>
        </div>
        <div className="lp-map-card-sub">Completed · 2h ago</div>
        <div className="lp-map-card-bar">
          <div className="lp-map-card-fill" style={{ width: "100%", background: "var(--green)" }} />
        </div>
      </div>
      <div className="lp-map-card lp-card-float-2">
        <div className="lp-map-card-top">
          <div className="lp-map-dot lp-dot-yellow" />
          <div className="lp-map-card-label">Pothole Repair</div>
        </div>
        <div className="lp-map-card-sub">In Progress · 65%</div>
        <div className="lp-map-card-bar">
          <div className="lp-map-card-fill" style={{ width: "65%", background: "#f59e0b" }} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   FOOTER — all links are real app routes
════════════════════════════════ */
function Footer() {
  const isAuth = !!localStorage.getItem("token");
  const role   = localStorage.getItem("role");

  const platformLinks = isAuth
    ? (role === "admin"
        ? [
            { label: "Admin Dashboard", to: "/admin" },
            { label: "All Complaints",  to: "/complaints" },
            { label: "Profile",         to: "/profile" },
          ]
        : [
            { label: "Dashboard",    to: "/dashboard" },
            { label: "Report Issue", to: "/reportissue" },
            { label: "Complaints",   to: "/complaints" },
            { label: "Profile",      to: "/profile" },
          ])
    : [
        { label: "Report an Issue",   to: "/reportissue" },
        { label: "Browse Complaints", to: "/complaints" },
        { label: "Features",          to: "/#features",  hash: true },
        { label: "How It Works",      to: "/#how",       hash: true },
      ];

  const accountLinks = isAuth
    ? [
        { label: "My Profile",  to: "/profile" },
        { label: "Dashboard",   to: "/dashboard" },
      ]
    : [
        { label: "Log In",      to: "/login" },
        { label: "Register",    to: "/register" },
      ];

  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <div className="lp-footer-grid">

          {/* Brand column */}
          <div className="lp-footer-brand">
            <div className="lp-footer-brand-row">
              <div className="lp-footer-logo-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17l3-10 3 4 3-8 3 4 3-10" />
                  <circle cx="12" cy="3" r="1.5" fill="currentColor" stroke="none"/>
                  <path d="M5 21h14"/>
                </svg>
              </div>
              <span className="lp-footer-brand-name">Clean<span>Street</span></span>
            </div>
            <p className="lp-footer-tagline">
              Empowering citizens to build cleaner, safer, and more responsive
              cities through technology.
            </p>
            <div className="lp-footer-socials">
              <a href="https://github.com"   target="_blank" rel="noreferrer" className="lp-social-link"><Github    size={16} /></a>
              <a href="https://twitter.com"  target="_blank" rel="noreferrer" className="lp-social-link"><Twitter   size={16} /></a>
              <a href="https://instagram.com"target="_blank" rel="noreferrer" className="lp-social-link"><Instagram size={16} /></a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="lp-social-link"><Linkedin  size={16} /></a>
            </div>
          </div>

          {/* Platform links */}
          <div className="lp-footer-col">
            <h4>Platform</h4>
            <ul>
              {platformLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account links */}
          <div className="lp-footer-col">
            <h4>Account</h4>
            <ul>
              {accountLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lp-footer-col">
            <h4>Contact</h4>
            <ul>
              <li className="lp-footer-contact-item">
                <Mail size={13} />
                <a href="mailto:support@cleanstreet.in">support@cleanstreet.in</a>
              </li>
              <li className="lp-footer-contact-item">
                <Phone size={13} />
                <span>+91 99999 99999</span>
              </li>
              <li>
                <a href="/#features">Privacy Policy</a>
              </li>
              <li>
                <a href="/#features">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <p>© 2026 CleanStreet. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

/* ════════════════════════════════
   MAIN PAGE
════════════════════════════════ */
const LandingPage = () => {
  const isAuth = !!localStorage.getItem("token");

  return (
    <>
      <Navbar isAuth={isAuth} />

      {/* ── HERO ── */}
      <section className="lp-section lp-section-white">
        <div className="lp-container lp-hero">
          <div>
            <div className="lp-hero-eyebrow">
              <div className="lp-hero-dot" />
              <span className="lp-hero-eyebrow-text">Civic Tech Platform</span>
            </div>
            <h1>Report Civic Issues.<br /><em>Improve Your City.</em></h1>
            <p className="lp-hero-sub">
              Clean Street enables citizens to report public issues like garbage dumps,
              potholes, water leaks, and broken streetlights — while helping authorities
              resolve them efficiently.
            </p>
            <div className="lp-hero-actions">
              <Link to="/reportissue" className="lp-btn lp-btn-primary lp-btn-lg">
                <AlertTriangle size={17} /> Report an Issue
              </Link>
              <Link to="/complaints" className="lp-btn lp-btn-ghost lp-btn-lg">
                Explore Complaints <ChevronRight size={17} />
              </Link>
            </div>
            <div className="lp-hero-proof">
              <div className="lp-hero-avatars">
                {["A","B","C","D"].map((l, i) => (
                  <div key={i} className="lp-hero-avatar">{l}</div>
                ))}
              </div>
              <div className="lp-hero-proof-text">
                <strong>12,000+ citizens</strong> already reporting issues
                <div className="lp-stars">
                  {[1,2,3,4,5].map((i) => <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />)}
                  <span style={{ marginLeft: 4 }}>4.9 · Trusted by 48 cities</span>
                </div>
              </div>
            </div>
          </div>
          <div className="lp-hero-graphic">
            <CityMapGraphic />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-section lp-section-bg" id="features">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag"><Zap size={13} /> Features</div>
            <h2 className="lp-h2">Everything you need to fix your city</h2>
            <p className="lp-sub">
              A complete civic reporting toolkit — built for citizens, volunteers,
              and municipal authorities alike.
            </p>
          </div>
          <div className="lp-feature-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="lp-feature-card">
                <div className={`lp-feat-icon ${f.color}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-section lp-section-white" id="how">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag lp-tag-green"><CheckCircle size={13} /> How It Works</div>
            <h2 className="lp-h2">Up and running in four simple steps</h2>
            <p className="lp-sub">
              From reporting a civic issue to seeing it resolved — a transparent,
              trackable process every step of the way.
            </p>
          </div>
          <div className="lp-steps-row">
            {STEPS.map((s, i) => (
              <div key={i} className="lp-step">
                <div className="lp-step-circle">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT PREVIEWS ── */}
      <section className="lp-section lp-section-bg" id="preview">
        <div className="lp-container">
          <div className="lp-center">
            <div className="lp-tag"><Award size={13} /> Product Preview</div>
            <h2 className="lp-h2">See Clean Street in action</h2>
            <p className="lp-sub">
              Intuitive interfaces for citizens and powerful dashboards for administrators.
            </p>
          </div>
          <div className="lp-preview-grid">
            <PreviewUserDash />
            <PreviewForm />
            <PreviewVoting />
            <PreviewAdmin />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta-section">
        <div className="lp-container">
          <div className="lp-tag lp-tag-white"><Shield size={13} /> Join the Movement</div>
          <h2 className="lp-h2">Make Your City Cleaner and Safer.</h2>
          <p className="lp-cta-sub">
            Be part of a growing community of civic-minded citizens working together
            to improve public spaces for everyone.
          </p>
          <div className="lp-cta-buttons">
            <Link to="/register" className="lp-btn lp-btn-white lp-btn-lg">
              <Users size={17} /> Sign Up Free
            </Link>
            <Link to="/reportissue" className="lp-btn lp-btn-outline-white lp-btn-lg">
              <AlertTriangle size={17} /> Report an Issue
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default LandingPage;