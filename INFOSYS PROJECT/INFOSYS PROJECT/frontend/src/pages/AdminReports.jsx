import React, { useEffect, useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./AdminReports.css";

/* ============================================================
   CONSTANTS
============================================================ */
const PAGE_SIZE   = 12;
const BAR_COLORS  = ["#1a56db", "#0d9488", "#16a34a", "#d97706", "#8b5cf6", "#ef4444"];
const PIE_COLORS  = { resolved: "#16a34a", pending: "#d97706", "in-progress": "#0d9488" };

const STATUS_OPTS   = ["all", "pending", "in-progress", "resolved"];
const PRIORITY_OPTS = ["all", "low", "medium", "high", "critical"];
const SORT_OPTS     = [
  { val: "newest",   label: "Newest First"   },
  { val: "oldest",   label: "Oldest First"   },
  { val: "priority", label: "By Priority"    },
  { val: "votes",    label: "Most Upvoted"   },
];

const PRIORITY_RANK = { critical: 4, high: 3, medium: 2, low: 1 };

/* ============================================================
   HELPERS
============================================================ */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

/* ============================================================
   MINI COMPONENTS
============================================================ */
const Icon = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  gen:    "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  csv:    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  dl:     "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  filter: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
  chart:  "M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z",
  zone:   "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  refresh:"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  prev:   "M15 18l-6-6 6-6",
  next:   "M9 18l6-6-6-6",
};

/* Custom recharts tooltip */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ar-tooltip">
      <div className="ar-tooltip-label">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="ar-tooltip-row">
          <div className="ar-tooltip-dot" style={{ background: p.color }} />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* Status & priority badges */
const StatusBadge = ({ status }) => (
  <span className={`ar-status ar-status-${status?.replace(" ", "-")}`}>
    <span className="ar-status-dot" />
    {status}
  </span>
);

const PriorityBadge = ({ priority }) => (
  <span className={`ar-priority ar-priority-${priority}`}>{priority}</span>
);

/* Toast */
const ToastMsg = ({ msg, type }) => (
  <div className={`ar-toast ar-toast-${type}`}>{msg}</div>
);

/* ============================================================
   EXPORT HELPERS
============================================================ */
const exportCSV = (data) => {
  const headers = ["ID", "Type", "Status", "Priority", "Address", "City", "Upvotes", "Downvotes", "Comments", "Reported On", "Observed On"];
  const rows = data.map((i) => [
    i._id,
    i.issueType,
    i.status,
    i.priority,
    `"${(i.address || "").replace(/"/g, '""')}"`,
    i.city || "",
    i.upvotes?.length || 0,
    i.downvotes?.length || 0,
    i.comments?.length || 0,
    fmtDateTime(i.createdAt),
    fmtDate(i.observedOn),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `complaints-report-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const exportJSON = (data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `complaints-report-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const exportPDF = (data, filters) => {
  const win = window.open("", "_blank");
  const rows = data.map((i) => `
    <tr>
      <td>${i._id?.slice(-6)}</td>
      <td>${i.issueType}</td>
      <td><span class="s-${i.status?.replace(" ","-")}">${i.status}</span></td>
      <td><span class="p-${i.priority}">${i.priority}</span></td>
      <td>${(i.address || "").split(",")[0]}</td>
      <td>${i.upvotes?.length || 0}</td>
      <td>${fmtDate(i.createdAt)}</td>
    </tr>`).join("");

  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>Complaints Report</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      p  { font-size: 13px; color: #64748b; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #f8fafc; padding: 9px 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; color: #94a3b8; }
      td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
      tr:hover td { background: #f8fafc; }
      .s-resolved    { background:#dcfce7; color:#16a34a; padding:2px 8px; border-radius:20px; font-weight:700; font-size:11px; }
      .s-pending     { background:#fef3c7; color:#d97706; padding:2px 8px; border-radius:20px; font-weight:700; font-size:11px; }
      .s-in-progress { background:#ccfbf1; color:#0d9488; padding:2px 8px; border-radius:20px; font-weight:700; font-size:11px; }
      .p-critical    { background:#fee2e2; color:#ef4444; padding:2px 8px; border-radius:8px; font-weight:700; font-size:11px; }
      .p-high        { background:#fef3c7; color:#d97706; padding:2px 8px; border-radius:8px; font-weight:700; font-size:11px; }
      .p-medium      { background:#e8f0fe; color:#1a56db; padding:2px 8px; border-radius:8px; font-weight:700; font-size:11px; }
      .p-low         { background:#f1f5f9; color:#64748b; padding:2px 8px; border-radius:8px; font-weight:700; font-size:11px; }
      footer { margin-top:24px; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:10px; }
    </style></head><body>
    <h1>📋 Complaints Report</h1>
    <p>Generated: ${fmtDateTime(new Date())} · Filters: Status = ${filters.status} | Priority = ${filters.priority} | Type = ${filters.type || "All"} · Total: ${data.length} records</p>
    <table>
      <thead><tr><th>#ID</th><th>Type</th><th>Status</th><th>Priority</th><th>Address</th><th>Upvotes</th><th>Reported</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <footer>UrbanFix Admin Panel · This report is auto-generated and confidential.</footer>
    <script>window.print();<\/script>
    </body></html>`);
  win.document.close();
};

/* ============================================================
   MAIN COMPONENT
============================================================ */
const AdminReports = () => {
  const isAuth = Boolean(localStorage.getItem("token"));
  const token  = localStorage.getItem("token");

  /* ── data state ── */
  const [allIssues,  setAllIssues]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated,  setGenerated]  = useState(false);
  const [toasts,     setToasts]     = useState([]);

  /* ── filter state ── */
  const [status,    setStatus]    = useState("all");
  const [priority,  setPriority]  = useState("all");
  const [issueType, setIssueType] = useState("all");
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");
  const [sortBy,    setSortBy]    = useState("newest");

  /* ── result state ── */
  const [results, setResults] = useState([]);
  const [page,    setPage]    = useState(1);

  /* ── fetch all issues on mount ── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL;

        const res = await fetch(`${API_URL}/api/issues`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setAllIssues(Array.isArray(data) ? data : []);
      } catch {
        setAllIssues([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  /* ── unique issue types for filter dropdown ── */
  const issueTypes = ["all", ...Array.from(new Set(allIssues.map((i) => i.issueType).filter(Boolean)))];

  /* ── show toast ── */
  const addToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };

  /* ── generate report ── */
  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      let filtered = [...allIssues];

      if (status    !== "all") filtered = filtered.filter((i) => i.status   === status);
      if (priority  !== "all") filtered = filtered.filter((i) => i.priority === priority);
      if (issueType !== "all") filtered = filtered.filter((i) => i.issueType === issueType);

      if (dateFrom) {
        const from = new Date(dateFrom);
        filtered = filtered.filter((i) => new Date(i.createdAt) >= from);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter((i) => new Date(i.createdAt) <= to);
      }

      filtered.sort((a, b) => {
        switch (sortBy) {
          case "oldest":   return new Date(a.createdAt) - new Date(b.createdAt);
          case "priority": return (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0);
          case "votes":    return (b.upvotes?.length || 0) - (a.upvotes?.length || 0);
          default:         return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });

      setResults(filtered);
      setPage(1);
      setGenerated(true);
      setGenerating(false);
      addToast(`✅ Report generated — ${filtered.length} record${filtered.length !== 1 ? "s" : ""} found`);
    }, 600);
  }, [allIssues, status, priority, issueType, dateFrom, dateTo, sortBy]);

  /* ── analytics derived from results ── */
  const analytics = {
    total:      results.length,
    resolved:   results.filter((i) => i.status === "resolved").length,
    pending:    results.filter((i) => i.status === "pending").length,
    inProgress: results.filter((i) => i.status === "in-progress").length,
    critical:   results.filter((i) => i.priority === "critical").length,
    totalVotes: results.reduce((s, i) => s + (i.upvotes?.length || 0), 0),
  };

  /* bar chart: issue type breakdown */
  const typeChartData = Object.entries(
    results.reduce((acc, i) => {
      acc[i.issueType] = (acc[i.issueType] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  /* pie chart: status breakdown */
  const statusChartData = [
    { name: "Resolved",    value: analytics.resolved,   color: PIE_COLORS.resolved    },
    { name: "Pending",     value: analytics.pending,    color: PIE_COLORS.pending     },
    { name: "In Progress", value: analytics.inProgress, color: PIE_COLORS["in-progress"] },
  ].filter((s) => s.value > 0);

  /* zone table: group by state/city */
  const zoneData = Object.entries(
    results.reduce((acc, i) => {
      const zone = (i.address?.split(",").slice(-2, -1)[0]?.trim()) ||
                   (i.user?.state) || "Unknown";
      if (!acc[zone]) acc[zone] = { total: 0, resolved: 0 };
      acc[zone].total++;
      if (i.status === "resolved") acc[zone].resolved++;
      return acc;
    }, {})
  )
    .map(([zone, d]) => ({ zone, ...d, pct: Math.round((d.resolved / d.total) * 100) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const maxZone = Math.max(...zoneData.map((z) => z.total), 1);

  /* pagination */
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const paginated  = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageNums   = () => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  };

  /* ── RENDER ── */
  return (
    <>
      <Navbar isAuth={isAuth} />

      <div className="ar-layout">

        {/* ════ SIDEBAR ════ */}
        <aside className="ar-sidebar">
          <h3 className="ar-sidebar-title">Admin Panel</h3>
          <ul className="ar-sidebar-menu">
            <li><Link to="/admin">Overview</Link></li>
            <li><Link to="/complaints">Manage Complaints</Link></li>
            <li><Link to="/admin/users">Users</Link></li>
            <li className="ar-active"><Link to="/admin/reports">Reports</Link></li>
          </ul>
        </aside>

        {/* ════ MAIN ════ */}
        <div className="ar-main">

          {/* Page header */}
          <div className="ar-page-head">
            <div>
              <h2 className="ar-title">Reports &amp; Analytics</h2>
              <p className="ar-subtitle">
                Generate, filter, and export complaint data · {allIssues.length} total complaints in database
              </p>
            </div>
          </div>

          {/* ── SUMMARY STATS (live from DB) ── */}
          {!loading && (
            <div className="ar-stat-grid">
              {[
                {
                  icon: "📋", val: allIssues.length, label: "Total Complaints",
                  color: "#1a56db", bg: "#e8f0fe", trend: "All time",
                  pct: 100,
                },
                {
                  icon: "⏳", val: allIssues.filter((i) => i.status === "pending").length,
                  label: "Pending", color: "#d97706", bg: "#fef3c7", trend: "Needs action",
                  pct: Math.round((allIssues.filter((i) => i.status === "pending").length / Math.max(allIssues.length, 1)) * 100),
                },
                {
                  icon: "✅", val: allIssues.filter((i) => i.status === "resolved").length,
                  label: "Resolved", color: "#16a34a", bg: "#dcfce7", trend: "Completed",
                  pct: Math.round((allIssues.filter((i) => i.status === "resolved").length / Math.max(allIssues.length, 1)) * 100),
                },
                {
                  icon: "🚨", val: allIssues.filter((i) => i.priority === "critical").length,
                  label: "Critical Priority", color: "#ef4444", bg: "#fee2e2", trend: "High priority",
                  pct: Math.round((allIssues.filter((i) => i.priority === "critical").length / Math.max(allIssues.length, 1)) * 100),
                },
              ].map((s, i) => (
                <div key={s.label} className="ar-stat-card" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="ar-stat-top">
                    <div className="ar-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                    <span className="ar-stat-trend" style={{ background: s.bg, color: s.color }}>{s.trend}</span>
                  </div>
                  <div className="ar-stat-val">{s.val}</div>
                  <div className="ar-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── REPORT GENERATOR ── */}
          <div className="ar-generator">
            <div className="ar-panel-head">
              <div className="ar-panel-title">
                <div className="ar-panel-icon"><Icon d={ICONS.filter} size={14} /></div>
                Report Generator
              </div>
              {generated && (
                <span style={{ fontSize: 12, color: "var(--ar-green)", fontWeight: 700 }}>
                  ✓ Report ready · {results.length} records
                </span>
              )}
            </div>

            <div className="ar-panel-body">
              <div className="ar-filter-row">

                <div className="ar-field">
                  <label className="ar-label">Status</label>
                  <select className="ar-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    {STATUS_OPTS.map((s) => (
                      <option key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div className="ar-field">
                  <label className="ar-label">Priority</label>
                  <select className="ar-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    {PRIORITY_OPTS.map((p) => (
                      <option key={p} value={p}>{p === "all" ? "All Priorities" : p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div className="ar-field">
                  <label className="ar-label">Issue Type</label>
                  <select className="ar-select" value={issueType} onChange={(e) => setIssueType(e.target.value)}>
                    {issueTypes.map((t) => (
                      <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>
                    ))}
                  </select>
                </div>

                <div className="ar-field">
                  <label className="ar-label">Sort By</label>
                  <select className="ar-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    {SORT_OPTS.map((o) => (
                      <option key={o.val} value={o.val}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="ar-field">
                  <label className="ar-label">From Date</label>
                  <input className="ar-input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>

                <div className="ar-field">
                  <label className="ar-label">To Date</label>
                  <input className="ar-input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>

                <div className="ar-field" style={{ justifyContent: "flex-end" }}>
                  <label className="ar-label">&nbsp;</label>
                  <button
                    className="ar-generate-btn"
                    onClick={handleGenerate}
                    disabled={generating || loading}
                  >
                    {generating ? (
                      <><div className="ar-spinner" style={{ width: 15, height: 15, borderWidth: 2 }} /> Generating…</>
                    ) : (
                      <><Icon d={ICONS.gen} size={15} /> Generate Report</>
                    )}
                  </button>
                </div>

              </div>

              {/* Export buttons */}
              {generated && results.length > 0 && (
                <div className="ar-export-row">
                  <span className="ar-export-label">Export As:</span>

                  <button className="ar-export-btn ar-export-csv"
                    onClick={() => { exportCSV(results); addToast("📄 CSV downloaded"); }}>
                    <Icon d={ICONS.dl} size={13} /> CSV
                  </button>

                  <button className="ar-export-btn ar-export-json"
                    onClick={() => { exportJSON(results); addToast("📦 JSON downloaded"); }}>
                    <Icon d={ICONS.dl} size={13} /> JSON
                  </button>

                  <button className="ar-export-btn ar-export-pdf"
                    onClick={() => { exportPDF(results, { status, priority, type: issueType }); addToast("🖨️ Print dialog opened", "info"); }}>
                    <Icon d={ICONS.dl} size={13} /> PDF / Print
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── LOADING STATE ── */}
          {loading && (
            <div className="ar-loading">
              <div className="ar-spinner" />
              Loading complaints data…
            </div>
          )}

          {/* ── INITIAL EMPTY (not yet generated) ── */}
          {!loading && !generated && (
            <div className="ar-results-panel">
              <div className="ar-empty">
                <div className="ar-empty-icon">📊</div>
                <div className="ar-empty-text">No report generated yet</div>
                <div className="ar-empty-sub">Configure your filters above and click <strong>Generate Report</strong></div>
              </div>
            </div>
          )}

          {/* ── GENERATED + NO RESULTS ── */}
          {!loading && generated && results.length === 0 && (
            <div className="ar-results-panel">
              <div className="ar-empty">
                <div className="ar-empty-icon">🔍</div>
                <div className="ar-empty-text">No complaints match the selected filters</div>
                <div className="ar-empty-sub">Try adjusting your filter criteria</div>
              </div>
            </div>
          )}

          {/* ── RESULTS ── */}
          {!loading && generated && results.length > 0 && (
            <>
              {/* ── Charts row ── */}
              <div className="ar-charts-row">

                {/* Bar chart: type breakdown */}
                <div className="ar-chart-card">
                  <div className="ar-chart-head">
                    <div className="ar-chart-title">
                      <div className="ar-chart-icon"><Icon d={ICONS.chart} size={13} /></div>
                      By Issue Type
                    </div>
                    <span className="ar-chart-badge">{typeChartData.length} types</span>
                  </div>
                  <div className="ar-chart-body">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={typeChartData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }} barCategoryGap="35%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" name="Complaints" radius={[5, 5, 0, 0]}>
                          {typeChartData.map((_, i) => (
                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Donut: status breakdown */}
                <div className="ar-chart-card">
                  <div className="ar-chart-head">
                    <div className="ar-chart-title">
                      <div className="ar-chart-icon">🍩</div>
                      Status Distribution
                    </div>
                    <span className="ar-chart-badge">{results.length} total</span>
                  </div>
                  <div className="ar-chart-body">
                    <ResponsiveContainer width="100%" height={145}>
                      <PieChart>
                        <Pie data={statusChartData} cx="50%" cy="50%"
                          innerRadius={42} outerRadius={65}
                          paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {statusChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="ar-pie-legend">
                    {statusChartData.map((s) => (
                      <div key={s.name} className="ar-pie-row">
                        <div className="ar-pie-left">
                          <div className="ar-pie-dot" style={{ background: s.color }} />
                          {s.name}
                        </div>
                        <span className="ar-pie-val">
                          {s.value}&nbsp;
                          <span style={{ fontWeight: 500, color: "var(--ar-muted)", fontSize: 11 }}>
                            ({Math.round((s.value / results.length) * 100)}%)
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* ── Zone / Area breakdown ── */}
              {zoneData.length > 0 && (
                <div className="ar-zone-panel">
                  <div className="ar-panel-head">
                    <div className="ar-panel-title">
                      <div className="ar-panel-icon"><Icon d={ICONS.zone} size={14} /></div>
                      Zone / Area Breakdown
                    </div>
                    <span style={{ fontSize: 12, color: "var(--ar-muted)", fontWeight: 600 }}>
                      Top {zoneData.length} zones
                    </span>
                  </div>
                  <table className="ar-zone-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Zone / Area</th>
                        <th>Complaints</th>
                        <th>Share</th>
                        <th>Resolved</th>
                        <th>Resolution Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zoneData.map((z, i) => {
                        const rate = z.pct;
                        const rateColor = rate >= 70 ? "#16a34a" : rate >= 40 ? "#d97706" : "#ef4444";
                        const rateBg    = rate >= 70 ? "#dcfce7"  : rate >= 40 ? "#fef3c7"  : "#fee2e2";
                        return (
                          <tr key={z.zone}>
                            <td style={{ color: "var(--ar-muted)", fontWeight: 600, fontSize: 12 }}>{i + 1}</td>
                            <td><span className="ar-zone-name">{z.zone}</span></td>
                            <td>
                              <div className="ar-zone-bar-wrap">
                                <span className="ar-zone-count">{z.total}</span>
                                <div className="ar-zone-bar-bg">
                                  <div className="ar-zone-bar-fill"
                                    style={{
                                      width: `${Math.round((z.total / maxZone) * 100)}%`,
                                      background: BAR_COLORS[i % BAR_COLORS.length],
                                    }} />
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="ar-zone-pct">
                                {Math.round((z.total / results.length) * 100)}%
                              </span>
                            </td>
                            <td style={{ fontWeight: 600, color: "var(--ar-green)" }}>{z.resolved}</td>
                            <td>
                              <span className="ar-zone-resolve-rate" style={{ background: rateBg, color: rateColor }}>
                                {rate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── Complaints table ── */}
              <div className="ar-results-panel">
                <div className="ar-panel-head">
                  <div className="ar-panel-title">
                    <div className="ar-panel-icon"><Icon d={ICONS.csv} size={14} /></div>
                    Complaint Records
                  </div>
                  <span className="ar-results-count">{results.length} records</span>
                </div>

                <table className="ar-table">
                  <thead>
                    <tr>
                      <th>#ID</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Address</th>
                      <th>Votes</th>
                      <th>Comments</th>
                      <th>Reported On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((issue, i) => (
                      <tr key={issue._id} style={{ animationDelay: `${i * 30}ms` }}>
                        <td><span className="ar-id">{issue._id?.slice(-6)}</span></td>
                        <td style={{ fontWeight: 600 }}>{issue.issueType}</td>
                        <td><StatusBadge status={issue.status} /></td>
                        <td><PriorityBadge priority={issue.priority} /></td>
                        <td><div className="ar-address" title={issue.address}>{issue.address}</div></td>
                        <td>
                          <div className="ar-votes">
                            <span className="ar-vote-up">▲ {issue.upvotes?.length || 0}</span>
                            <span className="ar-vote-down">▼ {issue.downvotes?.length || 0}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: "var(--ar-violet)" }}>
                          {issue.comments?.length || 0}
                        </td>
                        <td><span className="ar-date">{fmtDate(issue.createdAt)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="ar-pagination">
                    <span className="ar-pag-info">
                      Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                      &nbsp;·&nbsp;<strong>{results.length}</strong> records
                    </span>
                    <div className="ar-pag-btns">
                      <button className="ar-pag-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                      <button className="ar-pag-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                        <Icon d={ICONS.prev} size={12} />
                      </button>
                      {pageNums().map((n) => (
                        <button key={n}
                          className={`ar-pag-btn ${n === page ? "ar-pag-active" : ""}`}
                          onClick={() => setPage(n)}>{n}</button>
                      ))}
                      <button className="ar-pag-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                        <Icon d={ICONS.next} size={12} />
                      </button>
                      <button className="ar-pag-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>

      {/* ── Toast notifications ── */}
      <div className="ar-toast-wrap">
        {toasts.map((t) => <ToastMsg key={t.id} msg={t.msg} type={t.type} />)}
      </div>
    </>
  );
};

export default AdminReports;