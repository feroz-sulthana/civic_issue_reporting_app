import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import "./AdminUsers.css";

/* ============================================================
   CONSTANTS & HELPERS
============================================================ */

const PAGE_SIZE = 10;

const STATUS_COLORS = {
  pending:       { bg: "#fef3c7", color: "#d97706" },
  "in-progress": { bg: "#ccfbf1", color: "#0d9488" },
  resolved:      { bg: "#dcfce7", color: "#16a34a" },
};

const STAT_PILLS = (counts) => [
  { icon: "👥", val: counts.total,      label: "Total Users",      bg: "#e8f0fe", color: "#1a56db" },
  { icon: "🧑", val: counts.citizens,   label: "Citizens",         bg: "#ccfbf1", color: "#0d9488" },
  { icon: "🛡️", val: counts.admins,     label: "Admins",           bg: "#ede9fe", color: "#7c3aed" },
  { icon: "📋", val: counts.complaints, label: "Total Reports",    bg: "#fef3c7", color: "#d97706" },
  { icon: "✅", val: counts.resolved,   label: "Resolved Reports", bg: "#dcfce7", color: "#16a34a" },
];

const DRAWER_STATS = (s) => [
  { val: s.total,      label: "Reports",     bg: "#e8f0fe", color: "#1a56db" },
  { val: s.resolved,   label: "Resolved",    bg: "#dcfce7", color: "#16a34a" },
  { val: s.pending,    label: "Pending",     bg: "#fef3c7", color: "#d97706" },
  { val: s.inProgress, label: "In Progress", bg: "#ccfbf1", color: "#0d9488" },
  { val: s.votes,      label: "Upvotes",     bg: "#ede9fe", color: "#7c3aed" },
  { val: s.comments,   label: "Comments",    bg: "#fce7f3", color: "#db2777" },
];

const ICONS = {
  search: "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z",
  close:  "M18 6L6 18M6 6l12 12",
  eye:    "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12a3 3 0 100-6 3 3 0 000 6z",
  mail:   "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 0l8 8 8-8",
  phone:  "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.22 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
  map:    "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 10a2 2 0 100-4 2 2 0 000 4z",
  cal:    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  prev:   "M15 18l-6-6 6-6",
  next:   "M9 18l6-6-6-6",
};

const fmtDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "—";

/* ── per-user aggregate helpers ── */
const getCount    = (u) => u.issues?.length || 0;
const getResolved = (u) => (u.issues || []).filter((i) => i.status === "resolved").length;
const getVotes    = (u) => (u.issues || []).reduce((s, i) => s + (i.upvotes?.length || 0), 0);
const getComments = (u) => (u.issues || []).reduce((s, i) => s + (i.comments?.length || 0), 0);

/* ============================================================
   SVG ICON
============================================================ */
const Icon = ({ d, size = 14 }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

/* ============================================================
   AVATAR
============================================================ */
const Avatar = ({ src, name, size = 36, drawer = false }) => {
  const [err, setErr] = useState(false);

  if (src && !err) {
    return (
      <img
        src={src} alt={name}
        width={size} height={size}
        className={drawer ? "au-drawer-avatar" : "au-avatar"}
        onError={() => setErr(true)}
      />
    );
  }

  return (
    <div
      className={drawer ? "au-drawer-avatar-fb" : "au-avatar-fallback"}
      style={{ width: size, height: size }}
    >
      {name?.[0]?.toUpperCase() || "U"}
    </div>
  );
};

/* ============================================================
   SORTABLE TH
============================================================ */
const SortTh = ({ label, sortId, currentKey, currentDir, onSort }) => (
  <th
    className={currentKey === sortId ? "sorted" : ""}
    onClick={() => onSort(sortId)}
  >
    <div className="th-inner">
      {label}
      <span className="sort-icon">
        {currentKey === sortId ? (currentDir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </div>
  </th>
);

/* ============================================================
   USER DETAIL DRAWER
============================================================ */
const UserDrawer = ({ user, onClose }) => {
  if (!user) return null;

  const issues  = user.issues || [];
  const stats   = {
    total:      issues.length,
    resolved:   issues.filter((i) => i.status === "resolved").length,
    pending:    issues.filter((i) => i.status === "pending").length,
    inProgress: issues.filter((i) => i.status === "in-progress").length,
    votes:      issues.reduce((s, i) => s + (i.upvotes?.length  || 0), 0),
    comments:   issues.reduce((s, i) => s + (i.comments?.length || 0), 0),
  };

  return (
    <>
      <div className="au-drawer-overlay" onClick={onClose} />

      <div className="au-drawer">

        {/* ── Head ── */}
        <div className="au-drawer-head">
          <h3 className="au-drawer-head-title">User Profile</h3>
          <button className="au-drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="au-drawer-body">

          {/* ── Profile hero ── */}
          <div className="au-drawer-profile">
            <Avatar src={user.profilePhoto} name={user.name} size={60} drawer />
            <div>
              <p className="au-drawer-name">{user.name}</p>
              <div className="au-drawer-meta">
                <span className={`au-role au-role-${user.role}`}>
                  <span className="au-role-dot" />
                  {user.role}
                </span>
                <span className={`au-provider au-provider-${user.provider || "local"}`}>
                  {user.provider === "google" ? "🔴 Google" : "🔵 Local"}
                </span>
              </div>
            </div>
          </div>

          {/* ── Contact & identity ── */}
          <div className="au-drawer-section">
            <div className="au-drawer-section-title">Contact &amp; Identity</div>
            <div className="au-info-grid">

              <div className="au-info-cell au-info-full">
                <div className="au-info-label">
                  <Icon d={ICONS.mail} size={10} /> Email
                </div>
                <div className="au-info-val">{user.email}</div>
              </div>

              <div className="au-info-cell">
                <div className="au-info-label">Username</div>
                <div className="au-info-val au-info-blue">@{user.username}</div>
              </div>

              <div className="au-info-cell">
                <div className="au-info-label">
                  <Icon d={ICONS.phone} size={10} /> Phone
                </div>
                <div className="au-info-val">{user.phone || "—"}</div>
              </div>

              <div className="au-info-cell">
                <div className="au-info-label">
                  <Icon d={ICONS.map} size={10} /> State
                </div>
                <div className="au-info-val">{user.state || "—"}</div>
              </div>

              <div className="au-info-cell">
                <div className="au-info-label">
                  <Icon d={ICONS.cal} size={10} /> Joined
                </div>
                <div className="au-info-val">{fmtDate(user.createdAt)}</div>
              </div>

            </div>
          </div>

          {/* ── Activity stats ── */}
          <div className="au-drawer-section">
            <div className="au-drawer-section-title">Activity Stats</div>
            <div className="au-drawer-stat-grid">
              {DRAWER_STATS(stats).map((s) => (
                <div
                  key={s.label}
                  className="au-drawer-stat"
                  style={{ background: s.bg, borderColor: s.color + "33" }}
                >
                  <div className="au-drawer-stat-val" style={{ color: s.color }}>
                    {s.val}
                  </div>
                  <div className="au-drawer-stat-label" style={{ color: s.color + "cc" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Recent reports ── */}
          {issues.length > 0 && (
            <div className="au-drawer-section">
              <div className="au-drawer-section-title">Recent Reports</div>

              {issues.slice(0, 5).map((issue) => {
                const sc = STATUS_COLORS[issue.status] || {};
                return (
                  <div key={issue._id} className="au-recent-issue">
                    <div className="au-ri-dot" style={{ background: sc.color || "#94a3b8" }} />
                    <div className="au-ri-body">
                      <div className="au-ri-type">{issue.issueType}</div>
                      <div className="au-ri-meta">
                        {fmtDate(issue.createdAt)}
                        {issue.address && ` · ${issue.address.split(",")[0]}`}
                      </div>
                    </div>
                    <span
                      className="au-ri-status"
                      style={{ background: sc.bg, color: sc.color }}
                    >
                      {issue.status}
                    </span>
                  </div>
                );
              })}

              {issues.length > 5 && (
                <p className="au-ri-more">+{issues.length - 5} more reports</p>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

/* ============================================================
   MAIN — AdminUsers
============================================================ */
const AdminUsers = () => {
  const isAuth = Boolean(localStorage.getItem("token"));
  const token  = localStorage.getItem("token");

  /* ── state ── */
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [provFilter, setProvFilter] = useState("all");
  const [sortKey,    setSortKey]    = useState("createdAt");
  const [sortDir,    setSortDir]    = useState("desc");
  const [page,       setPage]       = useState(1);
  const [activeUser, setActiveUser] = useState(null);

  /* ── fetch ── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL;

        const res = await fetch(`${API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  /* ── sort handler ── */
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  };

  /* ── filter + sort pipeline ── */
  const filtered = users
    .filter((u) => {
      const lo  = search.toLowerCase();
      const hit =
        !lo ||
        u.name?.toLowerCase().includes(lo)     ||
        u.email?.toLowerCase().includes(lo)    ||
        u.username?.toLowerCase().includes(lo) ||
        u.state?.toLowerCase().includes(lo);
      return (
        hit &&
        (roleFilter === "all" || u.role === roleFilter) &&
        (provFilter === "all" || (u.provider || "local") === provFilter)
      );
    })
    .sort((a, b) => {
      let av, bv;
      switch (sortKey) {
        case "name":       av = a.name || "";   bv = b.name || "";   break;
        case "complaints": av = getCount(a);    bv = getCount(b);    break;
        case "resolved":   av = getResolved(a); bv = getResolved(b); break;
        case "votes":      av = getVotes(a);    bv = getVotes(b);    break;
        default:           av = new Date(a.createdAt); bv = new Date(b.createdAt);
      }
      if (av < bv) return sortDir === "asc" ? -1 :  1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

  const totalPages    = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated     = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const maxComplaints = Math.max(...users.map(getCount), 1);

  /* ── summary counts ── */
  const summaryPills = STAT_PILLS({
    total:      users.length,
    citizens:   users.filter((u) => u.role === "citizen").length,
    admins:     users.filter((u) => u.role === "admin").length,
    complaints: users.reduce((s, u) => s + getCount(u), 0),
    resolved:   users.reduce((s, u) => s + getResolved(u), 0),
  });

  /* ── pagination page numbers ── */
  const pageNums = () => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  };

  /* ── sort-th props shorthand ── */
  const sortProps = { currentKey: sortKey, currentDir: sortDir, onSort: toggleSort };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <>
      <Navbar isAuth={isAuth} />

      <div className="au-layout">

        {/* ════ SIDEBAR ════ */}
        <aside className="au-sidebar">
          <h3 className="au-sidebar-title">Admin Panel</h3>
          <ul className="au-sidebar-menu">
            <li><Link to="/admin">Overview</Link></li>
            <li><Link to="/complaints">Manage Complaints</Link></li>
            <li className="au-active"><Link to="/admin/users">Users</Link></li>
            <li><Link to="/admin/reports">Reports</Link></li>
          </ul>
        </aside>

        {/* ════ MAIN ════ */}
        <div className="au-main">

          {/* Page header */}
          <div className="au-page-head">
            <h2 className="au-title">User Management</h2>
            <p className="au-subtitle">
              All registered users, their activity and complaint history
            </p>
          </div>

          {/* Stat pills */}
          <div className="au-stats-row">
            {summaryPills.map((s, i) => (
              <div
                key={s.label}
                className="au-stat-pill"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="au-stat-icon" style={{ background: s.bg, color: s.color }}>
                  {s.icon}
                </div>
                <div className="au-stat-info">
                  <span className="au-stat-val" style={{ color: s.color }}>{s.val}</span>
                  <span className="au-stat-label">{s.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="au-toolbar">
            <div className="au-search-wrap">
              <span className="au-search-icon"><Icon d={ICONS.search} size={15} /></span>
              <input
                className="au-search"
                placeholder="Search by name, email, username or state…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
              {search && (
                <button className="au-search-clear"
                  onClick={() => { setSearch(""); setPage(1); }}>
                  <Icon d={ICONS.close} size={11} />
                </button>
              )}
            </div>

            <div className="au-filter-group">
              <select className="au-select" value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
                <option value="all">All Roles</option>
                <option value="citizen">Citizens</option>
                <option value="admin">Admins</option>
              </select>

              <select className="au-select" value={provFilter}
                onChange={(e) => { setProvFilter(e.target.value); setPage(1); }}>
                <option value="all">All Providers</option>
                <option value="local">Local</option>
                <option value="google">Google</option>
              </select>
            </div>
          </div>

          <div className="au-results-bar">
            Showing <strong>{paginated.length}</strong> of{" "}
            <strong>{filtered.length}</strong> users
            {search && <span className="au-results-query"> · "{search}"</span>}
          </div>

          {/* ── TABLE or LOADING ── */}
          {loading ? (
            <div className="au-loading">
              <div className="au-spinner" />
              Loading users…
            </div>
          ) : (
            <div className="au-table-wrap">
              <table className="au-table">

                <thead>
                  <tr>
                    <th className="au-th-num">#</th>
                    <SortTh label="User"     sortId="name"       {...sortProps} />
                    <th>Role</th>
                    <th>Provider</th>
                    <SortTh label="Reports"  sortId="complaints" {...sortProps} />
                    <SortTh label="Resolved" sortId="resolved"   {...sortProps} />
                    <SortTh label="Upvotes"  sortId="votes"      {...sortProps} />
                    <th>State</th>
                    <SortTh label="Joined"   sortId="createdAt"  {...sortProps} />
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={10}>
                        <div className="au-empty-table">
                          <div className="au-empty-icon">🔍</div>
                          <div className="au-empty-text">No users match the current filters.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((u, i) => {
                      const complaints = getCount(u);
                      const resolved   = getResolved(u);
                      const votes      = getVotes(u);
                      const barPct     = Math.round((complaints / maxComplaints) * 100);

                      return (
                        <tr key={u._id} style={{ animationDelay: `${i * 40}ms` }}>

                          {/* # */}
                          <td className="au-td-num">{(page - 1) * PAGE_SIZE + i + 1}</td>

                          {/* User */}
                          <td>
                            <div className="au-user-cell">
                              <Avatar src={u.profilePhoto} name={u.name} />
                              <div>
                                <div className="au-user-name">{u.name}</div>
                                <div className="au-user-email">{u.email}</div>
                                <div className="au-user-uname">@{u.username}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td>
                            <span className={`au-role au-role-${u.role}`}>
                              <span className="au-role-dot" />
                              {u.role}
                            </span>
                          </td>

                          {/* Provider */}
                          <td>
                            <span className={`au-provider au-provider-${u.provider || "local"}`}>
                              {u.provider === "google" ? "🔴 Google" : "🔵 Local"}
                            </span>
                          </td>

                          {/* Reports + mini bar */}
                          <td>
                            <div className="au-mini-bar-wrap">
                              <span className="au-num">{complaints}</span>
                              <div className="au-mini-bar-bg">
                                <div className="au-mini-bar-fill" style={{ width: `${barPct}%` }} />
                              </div>
                            </div>
                          </td>

                          {/* Resolved */}
                          <td>
                            <div className="au-num au-num-green">{resolved}</div>
                            {complaints > 0 && (
                              <div className="au-num-sub">
                                {Math.round((resolved / complaints) * 100)}%
                              </div>
                            )}
                          </td>

                          {/* Votes */}
                          <td>
                            <div className="au-num au-num-violet">{votes}</div>
                          </td>

                          {/* State */}
                          <td>
                            {u.state
                              ? <span className="au-state">{u.state}</span>
                              : <span className="au-dash">—</span>}
                          </td>

                          {/* Joined */}
                          <td>
                            <div className="au-date">{fmtDate(u.createdAt)}</div>
                          </td>

                          {/* Action */}
                          <td>
                            <button className="au-view-btn" onClick={() => setActiveUser(u)}>
                              <Icon d={ICONS.eye} size={12} /> View
                            </button>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>

              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="au-pagination">
                  <span className="au-pag-info">
                    Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                    &nbsp;·&nbsp;<strong>{filtered.length}</strong> users
                  </span>

                  <div className="au-pag-btns">
                    <button className="au-pag-btn" disabled={page === 1}
                      onClick={() => setPage(1)}>«</button>

                    <button className="au-pag-btn" disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}>
                      <Icon d={ICONS.prev} size={12} />
                    </button>

                    {pageNums().map((n) => (
                      <button
                        key={n}
                        className={`au-pag-btn ${n === page ? "au-pag-active" : ""}`}
                        onClick={() => setPage(n)}
                      >{n}</button>
                    ))}

                    <button className="au-pag-btn" disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}>
                      <Icon d={ICONS.next} size={12} />
                    </button>

                    <button className="au-pag-btn" disabled={page === totalPages}
                      onClick={() => setPage(totalPages)}>»</button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      {activeUser && (
        <UserDrawer user={activeUser} onClose={() => setActiveUser(null)} />
      )}
    </>
  );
};

export default AdminUsers;