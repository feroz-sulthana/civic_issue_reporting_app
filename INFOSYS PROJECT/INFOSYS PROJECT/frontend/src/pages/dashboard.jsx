import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import "./dashboard.css";
import Navbar from "../components/Navbar";

const API_URL = import.meta.env.VITE_API_URL;

/* ─────────────────── SOCKET ─────────────────── */
const socket = io(API_URL, { transports: ["websocket"] });

/* ─────────────────── ICONS ─────────────────── */
const Icon = ({ path, size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    {...props}>
    <path d={path} />
  </svg>
);

const ICONS = {
  total:    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  pending:  "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  progress: "M13 10V3L4 14h7v7l9-11h-7z",
  resolved: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  report:   "M12 9v2m0 4h.01M12 5l9 15H3L12 5z",
  view:     "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  activity: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  arrow:    "M5 12h14M12 5l7 7-7 7",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  user:     "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  location: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
};

/* ─────────────────── STAT CARD ─────────────────── */
const StatCard = ({ label, value, type }) => {
  const config = {
    total:    { color: "#1a56db", bg: "#e8f0fe", icon: ICONS.total,    trend: "+12% this week" },
    pending:  { color: "#d97706", bg: "#fef3c7", icon: ICONS.pending,  trend: "Needs attention" },
    progress: { color: "#0d9488", bg: "#ccfbf1", icon: ICONS.progress, trend: "Being handled" },
    resolved: { color: "#16a34a", bg: "#dcfce7", icon: ICONS.resolved, trend: "Great work!" },
  };
  const { color, bg, icon, trend } = config[type];

  return (
    <div className={`db-stat-card db-stat-${type}`}>
      <div className="db-stat-top">
        <div className="db-stat-icon" style={{ background: bg, color }}>
          <Icon path={icon} size={20} />
        </div>
        <div className="db-stat-trend" style={{ color }}>{trend}</div>
      </div>
      <div className="db-stat-value" style={{ color }}>{value}</div>
      <div className="db-stat-label">{label}</div>
      <div className="db-stat-bar">
        <div className="db-stat-bar-fill" style={{ background: color, width: `${Math.min(value * 10, 100)}%` }} />
      </div>
      <div className="db-stat-glow" style={{ background: color }} />
    </div>
  );
};

/* ─────────────────── STATUS BADGE ─────────────────── */
const StatusBadge = ({ status }) => (
  <span className={`db-badge db-status-${status?.replace("-", "")}`}>
    <span className="db-badge-dot" />
    {status}
  </span>
);

/* ─────────────────── PRIORITY BADGE ─────────────────── */
const PriorityBadge = ({ priority }) => (
  <span className={`db-badge db-priority-${priority}`}>{priority}</span>
);

/* ─────────────────── ACTIVITY CARD ─────────────────── */
const ActivityCard = ({ issue, index }) => {
  const city =
    issue.address?.split(",").slice(-2, -1)[0]?.trim() ||
    issue.address?.split(",").pop()?.trim() || "Unknown";

  const statusAccent = {
    pending:      "#d97706",
    "in-progress":"#0d9488",
    resolved:     "#16a34a",
  };
  const accent = statusAccent[issue.status] || "#1a56db";

  return (
    <div className="db-activity-card" style={{ "--accent": accent, animationDelay: `${index * 80}ms` }}>
      <div className="db-activity-accent" style={{ background: accent }} />
      <div className="db-activity-body">
        <div className="db-activity-top">
          <div className="db-activity-id">#{issue._id.slice(-6).toUpperCase()}</div>
          <div className="db-activity-badges">
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
            <span className="db-badge db-city-badge">
              <Icon path={ICONS.location} size={10} />
              {city}
            </span>
          </div>
        </div>
        <div className="db-activity-title">{issue.issueType}</div>
        <div className="db-activity-desc">
          {issue.description ? issue.description.slice(0, 110) + "…" : "No description provided."}
        </div>
        <div className="db-activity-footer">
          <span className="db-activity-date">
            <Icon path={ICONS.calendar} size={12} />
            {new Date(issue.createdAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit"
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────── QUICK ACTION BUTTON ─────────────────── */
const ActionBtn = ({ to, variant, icon, label, sub }) => (
  <Link to={to} className={`db-action-btn db-action-${variant}`}>
    <div className="db-action-icon">
      <Icon path={icon} size={20} />
    </div>
    <div className="db-action-text">
      <span className="db-action-label">{label}</span>
      <span className="db-action-sub">{sub}</span>
    </div>
    <Icon path={ICONS.arrow} size={16} className="db-action-arrow" />
  </Link>
);

/* ─────────────────── DASHBOARD ─────────────────── */
const Dashboard = () => {
  const isAuth = Boolean(localStorage.getItem("token"));

  const [myIssues,   setMyIssues]   = useState([]);
  const [allIssues,  setAllIssues]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [greeting,   setGreeting]   = useState("");
  const [animatedCounts, setAnimatedCounts] = useState({
    total: 0, pending: 0, progress: 0, resolved: 0,
  });

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  const fetchIssues = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [myRes, allRes] = await Promise.all([
        fetch(`${API_URL}/api/issues/my`, { headers }),
        fetch(`${API_URL}/api/issues`, { headers })
      ]);
      const myData  = await myRes.json();
      const allData = await allRes.json();
      setMyIssues(Array.isArray(myData)  ? myData  : []);
      setAllIssues(Array.isArray(allData) ? allData : []);
    } catch (err) {
      console.error("Failed to fetch issues", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAuth) fetchIssues(); }, [isAuth]);

  useEffect(() => {
    socket.on("issueStatusUpdated", (updated) => {
      setMyIssues(prev  => prev.map(i => i._id === updated._id ? updated : i));
      setAllIssues(prev => prev.map(i => i._id === updated._id ? updated : i));
    });
    return () => socket.off("issueStatusUpdated");
  }, []);

  const safe     = Array.isArray(myIssues) ? myIssues : [];
  const total    = safe.length;
  const pending  = safe.filter(i => i.status === "pending").length;
  const inProg   = safe.filter(i => i.status === "in-progress").length;
  const resolved = safe.filter(i => i.status === "resolved").length;

  useEffect(() => {
    const steps = 30;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / steps, 3);
      setAnimatedCounts({
        total:    Math.round(total    * ease),
        pending:  Math.round(pending  * ease),
        progress: Math.round(inProg   * ease),
        resolved: Math.round(resolved * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [total, pending, inProg, resolved]);

  /* ── only 3 most recent ── */
  const recentIssues = [...allIssues]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const resolveRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return (
    <>
      <Navbar isAuth={isAuth} />

      <div className="db-page">

        {/* ── PAGE HEADER ── */}
        <div className="db-header">
          <div className="db-header-left">
            <div className="db-header-eyebrow">
              <span className="db-live-dot" />
              Live Dashboard
            </div>
            <h1 className="db-header-title">
              {greeting}, <em>Citizen</em> 👋
            </h1>
            <p className="db-header-sub">
              Monitor your reported civic issues and track resolution progress in real-time.
            </p>
          </div>

          <div className="db-header-right">
            {/* resolve rate ring — no refresh button */}
            <div className="db-resolve-ring">
              <svg viewBox="0 0 80 80" className="db-ring-svg">
                <circle cx="40" cy="40" r="32" className="db-ring-track" />
                <circle cx="40" cy="40" r="32" className="db-ring-fill"
                  style={{ strokeDashoffset: `${201 - (201 * resolveRate) / 100}` }} />
              </svg>
              <div className="db-ring-label">
                <strong>{resolveRate}%</strong>
                <span>Resolved</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="db-stats-grid">
          <StatCard label="Total Issues"  value={animatedCounts.total}    type="total" />
          <StatCard label="Pending"       value={animatedCounts.pending}  type="pending" />
          <StatCard label="In Progress"   value={animatedCounts.progress} type="progress" />
          <StatCard label="Resolved"      value={animatedCounts.resolved} type="resolved" />
        </div>

        {/* ── LOWER GRID ── */}
        <div className="db-lower">

          {/* ── RECENT ACTIVITY ── */}
          <div className="db-panel db-activity-panel">
            <div className="db-panel-head">
              <div className="db-panel-title">
                <div className="db-panel-icon">
                  <Icon path={ICONS.activity} size={16} />
                </div>
                Recent Complaints
                <span className="db-panel-count">{recentIssues.length}</span>
              </div>
              <Link to="/complaints" className="db-panel-link">
                View all <Icon path={ICONS.arrow} size={13} />
              </Link>
            </div>

            <div className="db-activity-list">
              {loading ? (
                <div className="db-loading">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="db-skeleton">
                      <div className="db-skel-line db-skel-short" />
                      <div className="db-skel-line" />
                      <div className="db-skel-line db-skel-med" />
                    </div>
                  ))}
                </div>
              ) : recentIssues.length === 0 ? (
                <div className="db-empty">
                  <div className="db-empty-icon">📭</div>
                  <p>No complaints reported yet.</p>
                  <Link to="/reportissue" className="db-empty-cta">Report your first issue →</Link>
                </div>
              ) : (
                recentIssues.map((issue, i) => (
                  <ActivityCard key={issue._id} issue={issue} index={i} />
                ))
              )}
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="db-sidebar">

            {/* Quick Actions — no Map View */}
            <div className="db-panel db-actions-panel">
              <div className="db-panel-head">
                <div className="db-panel-title">
                  <div className="db-panel-icon">
                    <Icon path={ICONS.report} size={16} />
                  </div>
                  Quick Actions
                </div>
              </div>
              <div className="db-actions-list">
                <ActionBtn
                  to="/reportissue"
                  variant="primary"
                  icon={ICONS.report}
                  label="Report New Issue"
                  sub="Submit a civic complaint"
                />
                <ActionBtn
                  to="/complaints"
                  variant="secondary"
                  icon={ICONS.view}
                  label="View All Complaints"
                  sub="Browse all reports"
                />
              </div>
            </div>

            {/* Status Summary */}
            <div className="db-panel db-summary-panel">
              <div className="db-panel-head">
                <div className="db-panel-title">
                  <div className="db-panel-icon">
                    <Icon path={ICONS.activity} size={16} />
                  </div>
                  My Status Summary
                </div>
              </div>

              <div className="db-summary-list">
                {[
                  { label: "Pending",     count: pending,  color: "#d97706", pct: total ? (pending  / total) * 100 : 0 },
                  { label: "In Progress", count: inProg,   color: "#0d9488", pct: total ? (inProg   / total) * 100 : 0 },
                  { label: "Resolved",    count: resolved, color: "#16a34a", pct: total ? (resolved / total) * 100 : 0 },
                ].map(({ label, count, color, pct }) => (
                  <div key={label} className="db-summary-row">
                    <div className="db-summary-left">
                      <div className="db-summary-dot" style={{ background: color }} />
                      <span className="db-summary-label">{label}</span>
                    </div>
                    <div className="db-summary-right">
                      <div className="db-summary-bar-wrap">
                        <div className="db-summary-bar" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="db-summary-count" style={{ color }}>{count}</span>
                    </div>
                  </div>
                ))}
              </div>

              {total === 0 && (
                <div className="db-summary-empty">No issues reported yet.</div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;