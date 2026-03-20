import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ isAuth }) => {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [dropOpen,    setDropOpen]    = useState(false);
  const [userData,    setUserData]    = useState({ name: "", avatar: null });
  const dropRef = useRef(null);
  const navigate  = useNavigate();
  const location  = useLocation();

  const role = localStorage.getItem("role");

  /* fetch user profile for name / photo */
  useEffect(() => {
    if (!isAuth) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const API_URL = import.meta.env.VITE_API_URL;

    fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (!data) return;

        setUserData({
          name: data.name || "",
          avatar: data.profilePhoto || null
        });
      })
      .catch(err => console.error("Profile fetch error:", err));

  }, [isAuth]);

  /* scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* lock body when drawer open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    setMenuOpen(false);
    setDropOpen(false);
    window.location.href = "/";
  };

  const close = () => setMenuOpen(false);
  const isActive = (path) => location.pathname === path;

  /* display name — first name only for brevity */
  const firstName = userData.name?.split(" ")[0] || (role === "admin" ? "Admin" : "Citizen");

  /* initials for avatar fallback */
  const initials = userData.name
    ? userData.name
        .split(" ")
        .map(w => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "C";

  const userLinks = [
    { to: "/dashboard",   label: "Dashboard" },
    { to: "/reportissue", label: "Report Issue" },
    { to: "/complaints",  label: "Complaints" },
  ];
  const adminLinks = [
    { to: "/admin",       label: "Admin Dashboard" },
    { to: "/complaints",  label: "All Complaints" },
  ];
  const guestLinks = [
    { to: "/#features",   label: "Dashboard" },
    { to: "/#how",        label: "Report Issue" },
    { to: "/#stats",      label: "Complaints" },
  ];

  const activeLinks = isAuth
    ? (role === "admin" ? adminLinks : userLinks)
    : guestLinks;

  return (
    <>
      <header className={`nb-header ${scrolled ? "nb-scrolled" : ""}`}>
        <div className="nb-inner">
          
          {/* ── LOGO ── */}
          <Link to="/" className="nb-brand" onClick={close}>
            <div className="nb-logo-ring">
              {/* street / road icon with location pin */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 17l3-10 3 4 3-8 3 4 3-10" />
                <circle cx="12" cy="3" r="1.5" fill="currentColor" stroke="none"/>
                <path d="M5 21h14"/>
              </svg>
            </div>
            <div className="nb-brand-text">
              <span className="nb-brand-name">
                <span className="nb-brand-clean">Clean</span>
                <em>Street</em>
              </span>
              <span className="nb-brand-tagline">Civic Issue Platform</span>
            </div>
          </Link>

          {/* ── CENTER NAV ── */}
          <nav className="nb-nav desktop-only">
            {activeLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`nb-link ${isActive(to) ? "nb-link-active" : ""}`}>
                {label}
                <span className="nb-link-bar" />
              </Link>
            ))}
          </nav>

          {/* ── RIGHT ACTIONS ── */}
          <div className="nb-actions desktop-only">
            {isAuth ? (
              <>
                {/* role badge */}
                <div className={`nb-status-badge ${role === "admin" ? "nb-badge-admin" : "nb-badge-citizen"}`}>
                  <span className="nb-status-dot" />
                  {role === "admin" ? "Admin" : "Citizen"}
                </div>

                {/* profile dropdown */}
                <div className="nb-profile-wrap" ref={dropRef}>
                  <button
                    className="nb-btn-profile"
                    onClick={() => setDropOpen(o => !o)}
                    aria-expanded={dropOpen}
                  >
                    <span className="nb-avatar">
                      {userData.avatar ? (
                        <img
                          src={userData.avatar}
                          alt={firstName}
                          className="nb-avatar-img"
                        />
                      ) : (
                        initials
                      )}
                    </span>
                    <span className="nb-profile-name">{firstName}</span>
                    <svg className={`nb-chevron ${dropOpen ? "nb-chevron-up" : ""}`}
                      width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {/* dropdown */}
                  <div className={`nb-dropdown ${dropOpen ? "nb-dropdown-open" : ""}`}>
                    <div className="nb-drop-header">
                      <div className="nb-drop-avatar">
                        {userData.avatar
                          ? <img src={userData.avatar} alt={firstName} className="nb-avatar-img" />
                          : initials}
                      </div>
                      <div className="nb-drop-info">
                        <span className="nb-drop-name">{userData.name || firstName}</span>
                        <span className="nb-drop-role">{role === "admin" ? "Administrator" : "Verified Citizen"}</span>
                      </div>
                    </div>

                    <div className="nb-drop-divider" />

                    <Link to="/profile" className="nb-drop-item" onClick={() => setDropOpen(false)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      My Profile
                    </Link>

                    {role !== "admin" && (
                      <Link to="/dashboard" className="nb-drop-item" onClick={() => setDropOpen(false)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                        </svg>
                        Dashboard
                      </Link>
                    )}

                    <div className="nb-drop-divider" />

                    <button className="nb-drop-item nb-drop-logout" onClick={handleLogout}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Log Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nb-btn-ghost">Log In</Link>
                <Link to="/register" className="nb-btn-primary">
                  Get Started
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </Link>
              </>
            )}
          </div>

          {/* HAMBURGER */}
          <button
            className={`nb-hamburger ${menuOpen ? "nb-ham-open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>

        </div>
      </header>

      {/* OVERLAY */}
      <div className={`nb-overlay ${menuOpen ? "nb-overlay-show" : ""}`} onClick={close} />

      {/* MOBILE DRAWER */}
      <aside className={`nb-drawer ${menuOpen ? "nb-drawer-open" : ""}`}>

        <div className="nb-drawer-top">
          <Link to="/" className="nb-brand" onClick={close}>
            <div className="nb-logo-ring">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 17l3-10 3 4 3-8 3 4 3-10" />
                <circle cx="12" cy="3" r="1.5" fill="currentColor" stroke="none"/>
                <path d="M5 21h14"/>
              </svg>
            </div>
            <div className="nb-brand-text">
              <span className="nb-brand-name">
                <span className="nb-brand-clean">Clean</span><em>Street</em>
              </span>
            </div>
          </Link>
          <button className="nb-close" onClick={close} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {isAuth && (
          <div className="nb-drawer-user">
            <div className="nb-drawer-avatar">
              {userData.avatar
                ? <img src={userData.avatar} alt={firstName} className="nb-avatar-img" />
                : initials}
            </div>
            <div>
              <div className="nb-drawer-username">{userData.name || firstName}</div>
              <div className="nb-drawer-role">
                <span className={`nb-status-dot ${role === "admin" ? "nb-dot-admin" : ""}`} />
                {role === "admin" ? "Admin Access" : "Verified Citizen"}
              </div>
            </div>
          </div>
        )}

        <nav className="nb-drawer-nav">
          <p className="nb-drawer-section-label">Navigation</p>
          {activeLinks.map(({ to, label }) => (
            <Link key={to} to={to}
              className={`nb-drawer-link ${isActive(to) ? "nb-drawer-link-active" : ""}`}
              onClick={close}>
              <span className="nb-drawer-link-dot" />{label}
            </Link>
          ))}
        </nav>

        <div className="nb-drawer-divider" />

        <div className="nb-drawer-auth">
          <p className="nb-drawer-section-label">Account</p>
          {isAuth ? (
            <>
              <Link to="/profile" className="nb-drawer-link" onClick={close}>
                <span className="nb-drawer-link-dot" />Profile
              </Link>
              <button className="nb-drawer-logout" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </>
          ) : (
            <div className="nb-drawer-cta">
              <Link to="/login"    className="nb-drawer-btn-ghost"   onClick={close}>Log In</Link>
              <Link to="/register" className="nb-drawer-btn-primary" onClick={close}>Get Started →</Link>
            </div>
          )}
        </div>

        <div className="nb-drawer-footer">
          <span>© 2026 CleanStreet</span>
          <span>Civic Tech Platform</span>
        </div>

      </aside>
    </>
  );
};

export default Navbar;