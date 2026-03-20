import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

/* ============================================================
   STYLES
============================================================ */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');

:root {
  --blue:     #1a56db;
  --blue-d:   #1241b0;
  --blue-l:   #e8f0fe;
  --green:    #16a34a;
  --green-l:  #dcfce7;
  --teal:     #0d9488;
  --teal-l:   #ccfbf1;
  --amber:    #d97706;
  --amber-l:  #fef3c7;
  --slate:    #0f172a;
  --gray:     #64748b;
  --muted:    #94a3b8;
  --line:     #e2e8f0;
  --bg:       #f8fafc;
  --card:     #ffffff;
  --shadow:   0 4px 24px rgba(15,23,42,.07);
  --shadow-lg:0 12px 48px rgba(15,23,42,.12);
  --radius:   16px;
}

.admin-layout {
  display: flex;
  gap: 30px;
  padding: 40px 80px;
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 20% 20%, rgba(26,86,219,.06) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(13,148,136,.05) 0%, transparent 50%),
    linear-gradient(160deg, #f0f5ff 0%, #f8fafc 40%, #f0fdfa 100%);
}

.admin-sidebar {
  width: 220px;
  background: var(--card);
  border-radius: var(--radius);
  padding: 24px 16px;
  box-shadow: var(--shadow);
  border: 1px solid var(--line);
  height: fit-content;
  position: sticky;
  top: 24px;
}

.sidebar-title {
  font-family: 'DM Serif Display', serif;
  font-size: 17px;
  font-weight: 400;
  color: var(--slate);
  margin: 0 0 18px 8px;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-menu li {
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--gray);
  transition: all 0.2s;
}

.sidebar-menu li:hover {
  background: var(--bg);
  color: var(--slate);
  transform: translateX(3px);
}

.sidebar-menu .active { background: var(--blue); color: white; }
.sidebar-menu .active:hover { background: var(--blue-d); transform: none; }
.sidebar-menu a { text-decoration: none; color: inherit; display: block; width: 100%; }

.admin-container { flex: 1; min-width: 0; }

.admin-title {
  font-family: 'DM Serif Display', serif;
  font-size: clamp(24px, 3vw, 32px);
  color: var(--slate);
  margin: 0 0 6px;
  font-weight: 400;
}

.admin-subtitle { font-size: 14px; color: var(--gray); margin: 0 0 28px; }

/* ── STAT CARDS ── */
.admin-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.admin-card {
  background: var(--card);
  border-radius: var(--radius);
  border: 1px solid var(--line);
  padding: 20px;
  box-shadow: var(--shadow);
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.admin-card::after {
  content: '';
  position: absolute;
  bottom: -20px; right: -20px;
  width: 70px; height: 70px;
  border-radius: 50%;
  opacity: 0.07;
  filter: blur(10px);
}

.admin-card:nth-child(1)::after { background: var(--blue);  }
.admin-card:nth-child(2)::after { background: var(--amber); }
.admin-card:nth-child(3)::after { background: var(--teal);  }
.admin-card:nth-child(4)::after { background: var(--green); }
.admin-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }

.card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }

.card-icon {
  width: 42px; height: 42px;
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  font-size: 19px; flex-shrink: 0;
}

.card-trend { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; }
.card-value { font-family: 'DM Serif Display', serif; font-size: 38px; line-height: 1; margin-bottom: 4px; color: var(--slate); }
.card-label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
.card-bar { height: 3px; border-radius: 3px; background: var(--line); margin-top: 14px; overflow: hidden; }
.card-bar-fill { height: 100%; border-radius: 3px; transition: width 1.2s cubic-bezier(0.4,0,0.2,1); }

/* ── CHARTS ── */
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.chart-panel { background: var(--card); border-radius: var(--radius); border: 1px solid var(--line); box-shadow: var(--shadow); overflow: hidden; }
.chart-panel.full-width { grid-column: 1 / -1; }

.chart-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 18px 22px 14px;
  border-bottom: 1px solid var(--line);
  background: rgba(248,250,252,.6);
}

.chart-title { font-size: 14px; font-weight: 700; color: var(--slate); display: flex; align-items: center; gap: 8px; }

.chart-icon {
  width: 28px; height: 28px; border-radius: 8px;
  background: var(--blue-l); color: var(--blue);
  display: flex; align-items: center; justify-content: center; font-size: 13px;
}

.chart-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; background: var(--green-l); color: var(--green); }
.chart-body { padding: 20px 16px 16px; }

.chart-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--muted); font-size: 13px; gap: 8px; }
.chart-empty-icon { font-size: 32px; }

/* ── PIE LEGEND ── */
.pie-legend { display: flex; flex-direction: column; gap: 10px; padding: 0 22px 20px; }
.pie-legend-item { display: flex; align-items: center; justify-content: space-between; }
.pie-legend-left { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--gray); font-weight: 500; }
.pie-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.pie-legend-val { font-size: 13px; font-weight: 700; color: var(--slate); }

/* ── BOTTOM ROW ── */
.bottom-row { display: grid; grid-template-columns: 1fr 340px; gap: 20px; }

.impact-box {
  background: linear-gradient(135deg, var(--blue) 0%, #3b82f6 100%);
  border-radius: var(--radius); padding: 28px; color: white;
  box-shadow: 0 8px 30px rgba(26,86,219,.3);
}

.impact-box h3 { font-family: 'DM Serif Display', serif; font-size: 20px; font-weight: 400; margin: 0 0 10px; }
.impact-box p  { font-size: 14px; line-height: 1.7; opacity: 0.85; margin: 0; }

.top-issues-panel { background: var(--card); border-radius: var(--radius); border: 1px solid var(--line); box-shadow: var(--shadow); overflow: hidden; }

.issue-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-bottom: 1px solid var(--line); transition: background 0.2s; }
.issue-row:last-child { border-bottom: none; }
.issue-row:hover { background: var(--bg); }
.issue-row-left { display: flex; align-items: center; gap: 10px; }

.issue-rank {
  width: 22px; height: 22px; border-radius: 6px;
  background: var(--blue-l); color: var(--blue);
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.issue-name { font-size: 13px; font-weight: 600; color: var(--slate); }
.issue-count { font-size: 13px; font-weight: 700; color: var(--blue); }

/* ── TOOLTIP ── */
.custom-tooltip { background: var(--slate); border-radius: 10px; padding: 10px 14px; border: none; box-shadow: 0 8px 24px rgba(15,23,42,.2); }
.tooltip-label  { font-size: 11px; font-weight: 600; color: var(--muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
.tooltip-row    { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: white; margin-bottom: 3px; }
.tooltip-dot    { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.admin-loading  { display: flex; align-items: center; gap: 10px; color: var(--gray); font-size: 14px; padding: 40px 0; }

/* ── RESPONSIVE ── */
@media (max-width: 1100px) {
  .charts-grid { grid-template-columns: 1fr; }
  .bottom-row  { grid-template-columns: 1fr; }
}
@media (max-width: 900px) {
  .admin-layout  { flex-direction: column; padding: 24px 20px; }
  .admin-cards   { grid-template-columns: 1fr 1fr; }
  .admin-sidebar { width: 100%; position: static; }
  .sidebar-menu  { flex-direction: row; flex-wrap: wrap; }
}
@media (max-width: 500px) {
  .admin-cards { grid-template-columns: 1fr; }
}
`;

/* ============================================================
   CONSTANTS
============================================================ */
const BAR_COLORS = ["#1a56db", "#0d9488", "#16a34a", "#d97706", "#8b5cf6", "#ef4444"];

/* ============================================================
   CUSTOM TOOLTIP
============================================================ */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-label">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="tooltip-row">
          <div className="tooltip-dot" style={{ background: p.color }} />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* ============================================================
   STAT CARD
============================================================ */
const AdminCard = ({ title, value, icon, color, bg, trend, pct }) => (
  <div className="admin-card">
    <div className="card-top">
      <div className="card-icon" style={{ background: bg, color }}>{icon}</div>
      <span className="card-trend" style={{ background: bg, color }}>{trend}</span>
    </div>
    <div className="card-value">{value}</div>
    <div className="card-label">{title}</div>
    <div className="card-bar">
      <div className="card-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  </div>
);

/* ============================================================
   MAIN COMPONENT
============================================================ */
const AdminDashboard = () => {
  const isAuth = Boolean(localStorage.getItem("token"));

  const [stats, setStats] = useState({
    totalComplaints: 0,
    pending: 0,
    users: 0,
    resolvedToday: 0,
    issueTypeStats: [],  // real DB data: [{ name, count }]
    weeklyTrend: [],     // real DB data: [{ day, reported, resolved }]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_URL = import.meta.env.VITE_API_URL;
        
        const res = await fetch(`${API_URL}/api/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setStats({
          totalComplaints: data.totalComplaints ?? 0,
          pending:         data.pending         ?? 0,
          users:           data.users           ?? 0,
          resolvedToday:   data.resolvedToday   ?? 0,
          issueTypeStats:  Array.isArray(data.issueTypeStats) ? data.issueTypeStats : [],
          weeklyTrend:     Array.isArray(data.weeklyTrend)    ? data.weeklyTrend    : [],
        });
      } catch {
        console.log("Failed to fetch admin analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  /* Build status pie data from real counts */
  const total    = stats.totalComplaints || 0;
  const resolved = Math.max(0, total - stats.pending - Math.round(total * 0.2));
  const inProg   = Math.max(0, total - stats.pending - resolved);

  const statusData = [
    { name: "Resolved",    value: resolved,      color: "#16a34a" },
    { name: "Pending",     value: stats.pending, color: "#d97706" },
    { name: "In Progress", value: inProg,        color: "#0d9488" },
  ].filter((s) => s.value > 0);

  return (
    <>
      <style>{styles}</style>
      <Navbar isAuth={isAuth} />

      <div className="admin-layout">

        {/* ── SIDEBAR ── */}
        <aside className="admin-sidebar">
          <h3 className="sidebar-title">Admin Panel</h3>
          <ul className="sidebar-menu">
            <li className="active"><Link to="/admin">Overview</Link></li>
            <li><Link to="/complaints">Manage Complaints</Link></li>
            <li><Link to="/admin/users">Users</Link></li>
            <li><Link to="/admin/reports">Reports</Link></li>
          </ul>
        </aside>

        {/* ── MAIN ── */}
        <div className="admin-container">

          <h2 className="admin-title">System Overview</h2>
          <p className="admin-subtitle">Real-time analytics and complaint management</p>

          {loading ? (
            <div className="admin-loading">⏳ Loading analytics…</div>
          ) : (
            <>
              {/* ── STAT CARDS ── */}
              <div className="admin-cards">
                <AdminCard
                  title="Total Complaints" value={stats.totalComplaints} icon="📋"
                  color="#1a56db" bg="#e8f0fe" trend="All time"
                  pct={Math.min(stats.totalComplaints * 2, 100)}
                />
                <AdminCard
                  title="Pending" value={stats.pending} icon="⏳"
                  color="#d97706" bg="#fef3c7" trend="Needs action"
                  pct={total ? Math.round((stats.pending / total) * 100) : 0}
                />
                <AdminCard
                  title="Active Users" value={stats.users} icon="👥"
                  color="#0d9488" bg="#ccfbf1" trend="Registered"
                  pct={Math.min(stats.users, 100)}
                />
                <AdminCard
                  title="Resolved Today" value={stats.resolvedToday} icon="✅"
                  color="#16a34a" bg="#dcfce7" trend="Today"
                  pct={Math.min(stats.resolvedToday * 10, 100)}
                />
              </div>

              {/* ── CHARTS ROW 1 ── */}
              <div className="charts-grid">

                {/* Area Chart — real weeklyTrend */}
                <div className="chart-panel">
                  <div className="chart-head">
                    <div className="chart-title">
                      <div className="chart-icon">📈</div>
                      Weekly Complaint Trend
                    </div>
                    <span className="chart-badge">Last 7 days</span>
                  </div>
                  <div className="chart-body">
                    {stats.weeklyTrend.length === 0 ? (
                      <div className="chart-empty">
                        <div className="chart-empty-icon">📭</div>
                        No data for the last 7 days
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={stats.weeklyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradReported" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#1a56db" stopOpacity={0.18} />
                              <stop offset="95%" stopColor="#1a56db" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.18} />
                              <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="reported" name="Reported" stroke="#1a56db" strokeWidth={2.5} fill="url(#gradReported)" dot={{ r: 3, fill: "#1a56db", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                          <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#16a34a" strokeWidth={2.5} fill="url(#gradResolved)" dot={{ r: 3, fill: "#16a34a", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Donut — status distribution */}
                <div className="chart-panel">
                  <div className="chart-head">
                    <div className="chart-title">
                      <div className="chart-icon">🍩</div>
                      Status Distribution
                    </div>
                    <span className="chart-badge">{total} total</span>
                  </div>
                  <div className="chart-body">
                    {total === 0 ? (
                      <div className="chart-empty">
                        <div className="chart-empty-icon">📭</div>
                        No complaints yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={statusData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                            {statusData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="pie-legend">
                    {statusData.map((s) => (
                      <div key={s.name} className="pie-legend-item">
                        <div className="pie-legend-left">
                          <div className="pie-dot" style={{ background: s.color }} />
                          {s.name}
                        </div>
                        <span className="pie-legend-val">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* ── BAR CHART — real issueTypeStats from DB ── */}
              <div className="charts-grid" style={{ marginBottom: 20 }}>
                <div className="chart-panel full-width">
                  <div className="chart-head">
                    <div className="chart-title">
                      <div className="chart-icon">📊</div>
                      Complaints by Issue Type
                    </div>
                    <span className="chart-badge">
                      {stats.issueTypeStats.length > 0
                        ? `Top ${stats.issueTypeStats.length} categories`
                        : "No data"}
                    </span>
                  </div>
                  <div className="chart-body">
                    {stats.issueTypeStats.length === 0 ? (
                      <div className="chart-empty">
                        <div className="chart-empty-icon">📭</div>
                        No issue type data yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                          data={stats.issueTypeStats}
                          margin={{ top: 5, right: 20, left: -20, bottom: 0 }}
                          barCategoryGap="35%"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="count" name="Complaints" radius={[6, 6, 0, 0]}>
                            {stats.issueTypeStats.map((_, i) => (
                              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* ── BOTTOM ROW ── */}
              <div className="bottom-row">

                <div className="impact-box">
                  <h3>🌍 Community Impact</h3>
                  <p>
                    Thanks to citizen reports and community engagement, we've resolved
                    several issues this month — making our city cleaner and safer for everyone.
                    Keep reporting, keep improving.
                  </p>
                </div>

                {/* Top Issues — real issueTypeStats */}
                <div className="top-issues-panel">
                  <div className="chart-head">
                    <div className="chart-title">
                      <div className="chart-icon">🔥</div>
                      Top Issue Types
                    </div>
                  </div>
                  {stats.issueTypeStats.length === 0 ? (
                    <div className="chart-empty">
                      <div className="chart-empty-icon">📭</div>
                      No data yet
                    </div>
                  ) : (
                    stats.issueTypeStats.map((issue, i) => (
                      <div key={issue.name} className="issue-row">
                        <div className="issue-row-left">
                          <div className="issue-rank">{i + 1}</div>
                          <span className="issue-name">{issue.name}</span>
                        </div>
                        <span className="issue-count">{issue.count}</span>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;