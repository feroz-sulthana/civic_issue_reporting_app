import React, { useEffect, useState, useRef, useCallback } from "react";
import Navbar from "../components/Navbar";
import "./complaints.css";

const API_URL = import.meta.env.VITE_API_URL;

/* ─── SVG ICON ─── */
const Icon = ({ path, size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" className={className}>
    <path d={path} />
  </svg>
);

const ICONS = {
  search:    "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z",
  close:     "M18 6L6 18M6 6l12 12",
  location:  "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5z",
  calendar:  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  clock:     "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  image:     "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  up:        "M5 15l7-7 7 7",
  down:      "M19 9l-7 7-7-7",
  chevdown:  "M6 9l6 6 6-6",
  refresh:   "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  download:  "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  prev:      "M15 18l-6-6 6-6",
  next:      "M9 18l6-6-6-6",
  check:     "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  user:      "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  globe:     "M12 2a10 10 0 100 20A10 10 0 0012 2zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  comment:   "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  send:      "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  zoomin:    "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0zM11 8v6M8 11h6",
  zoomout:   "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0zM8 11h6",
  reset:     "M3 12a9 9 0 1018 0 9 9 0 00-18 0M3 12h3m12 0h3",
  trash:     "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  heartfill: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  fire:      "M12 22c5.523 0 10-4.477 10-10 0-3.6-1.8-6.6-4.5-8.4-.3 2.1-1.5 3.9-3 5.1C14.1 7.5 13.5 6 13.5 4.5c0-1.2.3-2.4.9-3.3C10.2 2.1 7.5 5.1 7.5 9c0 .9.15 1.8.45 2.55C6.75 10.8 6 9.3 6 7.5 4.2 9 3 11.4 3 14c0 4.4 3.6 8 8 8z",
};

/* ════════════════════════════════
   CUSTOM SELECT
════════════════════════════════ */
const CustomSelect = ({ value, onChange, options, triggerIcon, minWidth = 160 }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const current = options.find(o => o.value === value) || options[0];
  return (
    <div className="cp-custom-select-wrap" ref={ref} style={{ minWidth }}>
      <button className="cp-custom-select-trigger" onClick={() => setOpen(o => !o)} type="button">
        <span className="cp-custom-select-left">
          {triggerIcon && <Icon path={triggerIcon} size={14} className="cp-custom-select-icon" />}
          {current.dot && <span className="cp-status-dot" style={{ background: current.dot }} />}
          {current.icon && !current.dot && <span className="cp-option-icon">{current.icon}</span>}
          <span className="cp-custom-select-label">{current.label}</span>
        </span>
        <Icon path={ICONS.chevdown} size={13} className={`cp-custom-select-caret ${open ? "open" : ""}`} />
      </button>
      {open && (
        <div className="cp-custom-select-menu">
          {options.map(opt => (
            <div key={opt.value}
              className={`cp-custom-select-option ${value === opt.value ? "active" : ""}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}>
              {opt.dot && <span className="cp-status-dot" style={{ background: opt.dot, boxShadow: `0 0 0 3px ${opt.dotBg || "#f0f0f0"}` }} />}
              {opt.icon && !opt.dot && <span className="cp-option-icon">{opt.icon}</span>}
              <span>{opt.label}</span>
              {value === opt.value && <Icon path={ICONS.check} size={13} className="cp-option-check" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const STATUS_OPTIONS = [
  { value: "all",         label: "All Status",  dot: "#1a56db", dotBg: "#e8f0fe" },
  { value: "pending",     label: "Pending",     dot: "#d97706", dotBg: "#fef3c7" },
  { value: "in-progress", label: "In Progress", dot: "#0d9488", dotBg: "#ccfbf1" },
  { value: "resolved",    label: "Resolved",    dot: "#16a34a", dotBg: "#dcfce7" },
];
const REPORT_OPTIONS = [
  { value: "all", label: "All Reports", icon: <Icon path={ICONS.globe} size={13} /> },
  { value: "my",  label: "My Reports",  icon: <Icon path={ICONS.user}  size={13} /> },
];
const SORT_OPTIONS = [
  { value: "latest",     label: "Latest First", icon: "🕐" },
  { value: "oldest",     label: "Oldest First", icon: "🕰" },
  { value: "mostVotes",  label: "Most Votes",   icon: "🔥" },
  { value: "leastVotes", label: "Least Votes",  icon: "📉" },
];

/* ════════════════════════════════
   ADMIN STATUS SELECT
════════════════════════════════ */
const AdminStatusSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const options = STATUS_OPTIONS.filter(o => o.value !== "all");
  const current = options.find(o => o.value === value) || options[0];
  return (
    <div className="cp-admin-status-wrap" ref={ref}>
      <button className="cp-admin-status-trigger" onClick={() => setOpen(o => !o)} type="button">
        <span className="cp-status-dot" style={{ background: current.dot }} />
        <span>{current.label}</span>
        <Icon path={ICONS.chevdown} size={11} className={`cp-custom-select-caret ${open ? "open" : ""}`} />
      </button>
      {open && (
        <div className="cp-custom-select-menu cp-admin-status-menu">
          {options.map(opt => (
            <div key={opt.value}
              className={`cp-custom-select-option ${value === opt.value ? "active" : ""}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}>
              <span className="cp-status-dot" style={{ background: opt.dot, boxShadow: `0 0 0 3px ${opt.dotBg}` }} />
              <span>{opt.label}</span>
              {value === opt.value && <Icon path={ICONS.check} size={11} className="cp-option-check" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── BADGES ─── */
const StatusBadge = ({ status }) => (
  <span className={`cp-badge cp-status-${status?.replace("-", "")}`}>
    <span className="cp-badge-dot" />{status}
  </span>
);
const PriorityBadge = ({ priority }) => (
  <span className={`cp-badge cp-priority-${priority}`}>{priority}</span>
);

/* ─── VOTE BTN ─── */
const VoteBtn = ({ type, count, onClick, voted }) => (
  <button className={`cp-vote-btn cp-vote-${type}${voted ? " cp-vote-active" : ""}`} onClick={onClick}>
    <Icon path={type === "up" ? ICONS.up : ICONS.down} size={13} />
    <span>{count}</span>
  </button>
);

/* ════════════════════════════════
   FULL ISSUE MODAL
   Left = image viewer | Right = info + votes + comments
════════════════════════════════ */
const IssueModal = ({ issue, images, onClose, onDownload, token, userId, role, onVote, onStatusChange }) => {
  const [idx, setIdx]       = useState(0);
  const [scale, setScale]   = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);

  /* comment state */
  const [comments, setComments]     = useState([]);
  const [cmtLoading, setCmtLoading] = useState(true);
  const [text, setText]             = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cmtSort, setCmtSort]       = useState("recent");
  const [showAll, setShowAll]       = useState(false);
  const PREVIEW = 5;

  useEffect(() => { setScale(1); setOffset({ x: 0, y: 0 }); }, [idx]);

  const fetchComments = useCallback(async () => {
    setCmtLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/issues/${issue._id}/comments`,
        { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch { setComments([]); }
    finally { setCmtLoading(false); }
  }, [issue._id, token]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const sortedComments = [...comments].sort((a, b) =>
    cmtSort === "liked"
      ? (b.likes?.length || 0) - (a.likes?.length || 0)
      : new Date(b.createdAt) - new Date(a.createdAt)
  );
  const visibleComments = showAll ? sortedComments : sortedComments.slice(0, PREVIEW);

  const submitComment = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`${API_URL}/api/issues/${issue._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: text.trim() }),
      });
      setText(""); await fetchComments();
    } finally { setSubmitting(false); }
  };

  const deleteComment = async cid => {
    await fetch(`${API_URL}/api/issues/${issue._id}/comments/${cid}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchComments();
  };

  const likeComment = async cid => {
    await fetch(`${API_URL}/api/issues/${issue._id}/comments/${cid}/like`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    fetchComments();
  };

  /* keyboard nav */
  useEffect(() => {
    const h = e => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowRight" && scale === 1) setIdx(p => Math.min(p + 1, images.length - 1));
      if (e.key === "ArrowLeft"  && scale === 1) setIdx(p => Math.max(p - 1, 0));
      if (e.key === "+" || e.key === "=") setScale(s => Math.min(s + 0.25, 5));
      if (e.key === "-") setScale(s => Math.max(s - 0.25, 1));
      if (e.key === "0") { setScale(1); setOffset({ x: 0, y: 0 }); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [images.length, scale, onClose]);

  const handleWheel = useCallback(e => {
    e.preventDefault();
    setScale(s => {
      const next = Math.min(Math.max(s + (e.deltaY > 0 ? -0.15 : 0.15), 1), 5);
      if (next <= 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const onMouseDown = e => { if (scale <= 1) return; setDragging(true); dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }; };
  const onMouseMove = e => { if (!dragging || !dragStart.current) return; setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); };
  const onMouseUp   = () => { setDragging(false); dragStart.current = null; };

  const upCount   = issue.upvotes?.length   || 0;
  const downCount = issue.downvotes?.length || 0;
  const hasUpvoted   = userId && issue.upvotes?.includes(userId);
  const hasDownvoted = userId && issue.downvotes?.includes(userId);

  return (
    <div className="cp-modal-bg" onClick={onClose}>
      <div className="cp-modal-full" onClick={e => e.stopPropagation()}>

        {/* TOP BAR */}
        <div className="cp-modal-topbar">
          <div className="cp-modal-topbar-left">
            <span className="cp-modal-issue-id">#{issue._id.slice(-6).toUpperCase()}</span>
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
            {images.length > 0 && (
              <span className="cp-modal-img-counter">
                <Icon path={ICONS.image} size={12} />
                {idx + 1} / {images.length}
              </span>
            )}
          </div>
          <div className="cp-modal-topbar-right">
            {images.length > 0 && (
              <button className="cp-modal-btn" onClick={() => onDownload(images[idx])} title="Download image">
                <Icon path={ICONS.download} size={15} />
              </button>
            )}
            <button className="cp-modal-btn cp-modal-close" onClick={onClose} title="Close (Esc)">
              <Icon path={ICONS.close} size={15} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="cp-modal-body">

          {/* ── LEFT: image viewer ── */}
          <div className="cp-modal-left">
            {images.length > 0 ? (
              <>
                <div className="cp-modal-zoom-bar">
                  <button className="cp-zoom-btn" onClick={() => setScale(s => Math.max(s - 0.25, 1))} title="Zoom Out (-)">
                    <Icon path={ICONS.zoomout} size={14} />
                  </button>
                  <span className="cp-zoom-pct">{Math.round(scale * 100)}%</span>
                  <button className="cp-zoom-btn" onClick={() => setScale(s => Math.min(s + 0.25, 5))} title="Zoom In (+)">
                    <Icon path={ICONS.zoomin} size={14} />
                  </button>
                  {scale > 1 && (
                    <button className="cp-zoom-btn cp-zoom-reset-btn"
                      onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} title="Reset zoom (0)">
                      <Icon path={ICONS.reset} size={14} />
                    </button>
                  )}
                </div>

                <div className="cp-modal-img-area"
                  onWheel={handleWheel}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                  style={{ cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "default" }}>
                  <img
                    key={images[idx]}
                    src={images[idx]}
                    alt={`Issue photo ${idx + 1}`}
                    className="cp-modal-img"
                    style={{
                      transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
                      transition: dragging ? "none" : "transform 0.15s ease",
                      userSelect: "none", pointerEvents: "none",
                    }}
                    draggable={false}
                  />

                  {scale > 1 && (
                    <div className="cp-zoom-hint">
                      Scroll to zoom · Drag to pan
                    </div>
                  )}

                  {images.length > 1 && scale === 1 && (
                    <>
                      <button className="cp-modal-nav cp-nav-prev"
                        onClick={() => setIdx(p => Math.max(p - 1, 0))} disabled={idx === 0}>
                        <Icon path={ICONS.prev} size={18} />
                      </button>
                      <button className="cp-modal-nav cp-nav-next"
                        onClick={() => setIdx(p => Math.min(p + 1, images.length - 1))} disabled={idx === images.length - 1}>
                        <Icon path={ICONS.next} size={18} />
                      </button>
                    </>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="cp-modal-thumbs">
                    {images.map((img, i) => (
                      <div key={i}
                        className={`cp-modal-thumb ${i === idx ? "cp-thumb-active" : ""}`}
                        style={{ backgroundImage: `url(${img})` }}
                        onClick={() => setIdx(i)} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="cp-modal-no-img">
                <Icon path={ICONS.image} size={44} />
                <p>No photos attached to this report</p>
              </div>
            )}
          </div>

          {/* ── RIGHT: info + votes + comments ── */}
          <div className="cp-modal-right">

            {/* Issue info */}
            <div className="cp-modal-info">
              <h2 className="cp-modal-title">{issue.issueType}</h2>
              <div className="cp-modal-meta-row">
                <span className="cp-modal-meta-item">
                  <Icon path={ICONS.calendar} size={12} />
                  {new Date(issue.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span className="cp-modal-meta-item">
                  <Icon path={ICONS.clock} size={12} />
                  {new Date(issue.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {issue.description && <p className="cp-modal-desc">{issue.description}</p>}
              <div className="cp-modal-loc">
                <Icon path={ICONS.location} size={13} />
                {issue.address || "Location not specified"}
              </div>
            </div>

            {/* Votes */}
            <div className="cp-modal-votes-row">
              {role === "admin" ? (
                <>
                  <div className="cp-admin-vote-pill cp-admin-vote-up">
                    <Icon path={ICONS.up} size={13} /> {upCount} Upvote{upCount !== 1 ? "s" : ""}
                  </div>
                  <div className="cp-admin-vote-pill cp-admin-vote-down">
                    <Icon path={ICONS.down} size={13} /> {downCount} Downvote{downCount !== 1 ? "s" : ""}
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <AdminStatusSelect value={issue.status} onChange={v => onStatusChange(issue._id, v)} />
                  </div>
                </>
              ) : (
                <>
                  <VoteBtn type="up"   count={upCount}   voted={hasUpvoted}   onClick={() => onVote(issue._id, "upvote")} />
                  <VoteBtn type="down" count={downCount} voted={hasDownvoted} onClick={() => onVote(issue._id, "downvote")} />
                </>
              )}
            </div>

            <div className="cp-modal-divider" />

            {/* Comment header + sort tabs */}
            <div className="cp-cmt-header">
              <span className="cp-cmt-title">
                <Icon path={ICONS.comment} size={14} />
                Comments
                {comments.length > 0 && <span className="cp-cmt-count">{comments.length}</span>}
              </span>
              <div className="cp-cmt-sort-btns">
                <button className={`cp-cmt-sort-btn ${cmtSort === "recent" ? "active" : ""}`}
                  onClick={() => { setCmtSort("recent"); setShowAll(false); }}>
                  <Icon path={ICONS.clock} size={11} /> Recent
                </button>
                <button className={`cp-cmt-sort-btn ${cmtSort === "liked" ? "active" : ""}`}
                  onClick={() => { setCmtSort("liked"); setShowAll(false); }}>
                  <Icon path={ICONS.fire} size={11} /> Top
                </button>
              </div>
            </div>

            {/* Scrollable comment list */}
            <div className="cp-cmt-list">
              {cmtLoading ? (
                <div className="cp-cmt-loading">
                  {[1,2,3].map(i => (
                    <div key={i} className="cp-cmt-skel" style={{ animationDelay: `${i*80}ms` }}>
                      <div className="cp-cmt-skel-avatar" />
                      <div className="cp-cmt-skel-lines">
                        <div className="cp-skel-line cp-skel-short" style={{ height: 8 }} />
                        <div className="cp-skel-line" style={{ height: 8 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedComments.length === 0 ? (
                <div className="cp-cmt-empty">
                  <span>💬</span>
                  <p>No comments yet{role !== "admin" ? ". Be the first!" : "."}</p>
                </div>
              ) : (
                <>
                  {visibleComments.map(c => {
                    const liked = userId && c.likes?.includes(userId);
                    const likeCount = c.likes?.length || 0;
                    const canDelete = role === "admin" || c.user?._id === userId;
                    return (
                      <div key={c._id} className="cp-cmt-item">
                        <div className="cp-cmt-avatar">{c.user?.name?.[0]?.toUpperCase() || "U"}</div>
                        <div className="cp-cmt-content">
                          <div className="cp-cmt-row-top">
                            <span className="cp-cmt-name">
                              {c.user?.name || "User"}
                              {c.user?.role === "admin" && <span className="cp-admin-tag">Admin</span>}
                            </span>
                            <span className="cp-cmt-time">
                              {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                          <p className="cp-cmt-text">{c.text}</p>
                          <div className="cp-cmt-actions">
                            <button className={`cp-cmt-like${liked ? " liked" : ""}`}
                              onClick={() => likeComment(c._id)} title="Like">
                              <svg width="13" height="13" viewBox="0 0 24 24"
                                fill={liked ? "currentColor" : "none"}
                                stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d={ICONS.heartfill} />
                              </svg>
                              {likeCount > 0 && <span>{likeCount}</span>}
                            </button>
                            {canDelete && (
                              <button className="cp-cmt-del" onClick={() => deleteComment(c._id)} title="Delete">
                                <Icon path={ICONS.trash} size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {sortedComments.length > PREVIEW && (
                    <button className="cp-cmt-viewmore" onClick={() => setShowAll(v => !v)}>
                      {showAll
                        ? "Show less ↑"
                        : `View ${sortedComments.length - PREVIEW} more comment${sortedComments.length - PREVIEW !== 1 ? "s" : ""} ↓`}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Input — users only */}
            {role !== "admin" && (
              <div className="cp-cmt-input-wrap">
                <input className="cp-cmt-input"
                  placeholder="Add a comment… (Enter to send)"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && submitComment()}
                  maxLength={500}
                />
                <button className={`cp-cmt-send${submitting ? " cp-sending" : ""}`}
                  onClick={submitComment} disabled={!text.trim() || submitting}>
                  <Icon path={ICONS.send} size={13} />
                </button>
              </div>
            )}

          </div>{/* /right */}
        </div>{/* /body */}
      </div>{/* /modal-full */}
    </div>
  );
};

/* ════════════════════════════════
   REPORT CARD
════════════════════════════════ */
const ReportCard = ({ issue, role, userId, onVote, onStatusChange, onOpen, index }) => {
  const city = issue.address?.split(",").slice(-2, -1)[0]?.trim()
    || issue.address?.split(",").pop()?.trim() || "City";
  const accentMap = { pending: "#d97706", "in-progress": "#0d9488", resolved: "#16a34a" };
  const accent = accentMap[issue.status] || "#1a56db";
  const hasUpvoted   = userId && issue.upvotes?.includes(userId);
  const hasDownvoted = userId && issue.downvotes?.includes(userId);
  const upCount   = issue.upvotes?.length   || 0;
  const downCount = issue.downvotes?.length || 0;

  return (
    <div className={`cp-card cp-card-${issue.status?.replace("-","")}`}
      style={{ "--accent": accent, animationDelay: `${index * 60}ms` }}>
      <div className="cp-card-bar" style={{ background: `linear-gradient(to bottom, ${accent}, ${accent}88)` }} />
      <div className="cp-card-body">
        <div className="cp-card-top">
          <div className="cp-card-id">#{issue._id.slice(-6).toUpperCase()}</div>
          <div className="cp-card-meta">
            <span className="cp-card-time"><Icon path={ICONS.calendar} size={11} />
              {new Date(issue.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <span className="cp-card-time"><Icon path={ICONS.clock} size={11} />
              {new Date(issue.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
        <h3 className="cp-card-title">{issue.issueType}</h3>
        <div className="cp-badges-row">
          <div className="cp-badges-left">
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
            <span className="cp-badge cp-city-badge"><Icon path={ICONS.location} size={10} />{city}</span>
          </div>
          {role === "admin" && (
            <div className="cp-admin-select-wrap">
              <AdminStatusSelect value={issue.status} onChange={v => onStatusChange(issue._id, v)} />
            </div>
          )}
        </div>
        <p className="cp-card-desc">
          {issue.description
            ? issue.description.slice(0, 180) + (issue.description.length > 180 ? "…" : "")
            : <em style={{ color: "var(--cp-muted)" }}>No description provided.</em>}
        </p>
        <div className="cp-card-location">
          <Icon path={ICONS.location} size={13} />{issue.address || "Location not specified"}
        </div>
        <div className="cp-card-footer">
          <button className="cp-img-btn" onClick={() => onOpen(issue)}>
            {issue.images?.length > 0
              ? <><Icon path={ICONS.image} size={14} /> View Photos ({issue.images.length})</>
              : <><Icon path={ICONS.comment} size={14} /> View &amp; Comment</>}
          </button>
          {role === "admin" ? (
            <div className="cp-admin-votes">
              <span className="cp-admin-vote-pill cp-admin-vote-up"><Icon path={ICONS.up} size={12} />{upCount}</span>
              <span className="cp-admin-vote-pill cp-admin-vote-down"><Icon path={ICONS.down} size={12} />{downCount}</span>
            </div>
          ) : (
            <div className="cp-vote-row">
              <VoteBtn type="up"   count={upCount}   voted={hasUpvoted}   onClick={() => onVote(issue._id, "upvote")} />
              <VoteBtn type="down" count={downCount} voted={hasDownvoted} onClick={() => onVote(issue._id, "downvote")} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════
   MAIN COMPONENT
════════════════════════════════ */
const Complaints = () => {
  const [issues,       setIssues]      = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [typeFilter,   setTypeFilter]  = useState("all");
  const [statusFilter, setStatusFilter]= useState("all");
  const [sort,         setSort]        = useState("latest");
  const [searchTerm,   setSearchTerm]  = useState("");
  const [suggestions,  setSuggestions] = useState([]);
  const [activeIssue,  setActiveIssue] = useState(null);

  const searchRef = useRef(null);
  const token  = localStorage.getItem("token");
  const role   = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  const fetchIssues = async (type = "all") => {
    setLoading(true);
    try {
      const url = type === "my"
        ? `${API_URL}/api/issues/my`
        : `${API_URL}/api/issues`;
      const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setIssues(Array.isArray(data) ? data : []);
    } catch { setIssues([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchIssues(role === "admin" ? "all" : typeFilter); }, [typeFilter, role]);

  const handleSearch = v => {
    setSearchTerm(v);
    if (!v) { setSuggestions([]); return; }
    const lo = v.toLowerCase();
    setSuggestions(issues.filter(i =>
      i.issueType?.toLowerCase().includes(lo) || i.address?.toLowerCase().includes(lo)
    ).slice(0, 5));
  };

  useEffect(() => {
    const h = e => { if (!searchRef.current?.contains(e.target)) setSuggestions([]); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const vote = async (id, type) => {
    await fetch(`${API_URL}/api/issues/${id}/${type}`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    fetchIssues(typeFilter);
  };

  const updateStatus = async (id, newStatus) => {
    await fetch(`${API_URL}/api/issues/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchIssues(typeFilter);
  };

  const downloadImage = async url => {
    try {
      const blob = await (await fetch(url)).blob();
      const burl = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href: burl, download: `issue-${Date.now()}.jpg` });
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(burl);
    } catch(e) { console.error(e); }
  };

  const filtered = issues
    .filter(i => {
      const lo = searchTerm.toLowerCase();
      return (statusFilter === "all" || i.status === statusFilter) &&
        (i.issueType?.toLowerCase().includes(lo) ||
         i.address?.toLowerCase().includes(lo) ||
         i.description?.toLowerCase().includes(lo));
    })
    .sort((a, b) => {
      if (sort === "mostVotes")  return (b.upvotes?.length || 0) - (a.upvotes?.length || 0);
      if (sort === "leastVotes") return (a.upvotes?.length || 0) - (b.upvotes?.length || 0);
      if (sort === "oldest")     return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const counts = {
    all:        issues.length,
    pending:    issues.filter(i => i.status === "pending").length,
    inprogress: issues.filter(i => i.status === "in-progress").length,
    resolved:   issues.filter(i => i.status === "resolved").length,
  };

  return (
    <>
      <Navbar isAuth={true} />
      <div className="cp-page">

        <div className="cp-header">
          <div className="cp-header-left">
            <div className="cp-header-eyebrow"><span className="cp-live-dot" />{counts.all} Reports</div>
            <h1 className="cp-header-title">Community <em>Reports</em></h1>
            <p className="cp-header-sub">Browse, filter, and track all civic complaints in your community.</p>
          </div>
          <div className="cp-header-pills">
            {[
              { label: "Total",       val: counts.all,        color: "#1a56db", bg: "#e8f0fe" },
              { label: "Pending",     val: counts.pending,    color: "#d97706", bg: "#fef3c7" },
              { label: "In Progress", val: counts.inprogress, color: "#0d9488", bg: "#ccfbf1" },
              { label: "Resolved",    val: counts.resolved,   color: "#16a34a", bg: "#dcfce7" },
            ].map(({ label, val, color, bg }) => (
              <div key={label} className="cp-pill" style={{ "--c": color, "--bg": bg }}>
                <span className="cp-pill-val">{val}</span>
                <span className="cp-pill-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="cp-toolbar">
          <div className="cp-search-wrap" ref={searchRef}>
            <Icon path={ICONS.search} size={16} className="cp-search-icon" />
            <input className="cp-search"
              placeholder="Search by type, address or description…"
              value={searchTerm}
              onChange={e => handleSearch(e.target.value)}
            />
            {searchTerm && (
              <button className="cp-search-clear" onClick={() => { setSearchTerm(""); setSuggestions([]); }}>
                <Icon path={ICONS.close} size={12} />
              </button>
            )}
            {suggestions.length > 0 && (
              <div className="cp-suggestions">
                {suggestions.map((s, i) => (
                  <div key={i} className="cp-suggestion"
                    onClick={() => { setSearchTerm(`${s.issueType} ${s.address}`); setSuggestions([]); }}>
                    <Icon path={ICONS.search} size={13} />
                    <span><strong>{s.issueType}</strong> — {s.address}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="cp-filters">
            <CustomSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
            {role !== "admin" && (
              <CustomSelect value={typeFilter} onChange={setTypeFilter} options={REPORT_OPTIONS} />
            )}
            <CustomSelect value={sort} onChange={setSort} options={SORT_OPTIONS} />
            <button className="cp-refresh-btn" onClick={() => fetchIssues(typeFilter)}>
              <Icon path={ICONS.refresh} size={15} />
            </button>
          </div>
        </div>

        {!loading && (
          <div className="cp-results-bar">
            Showing <strong>{filtered.length}</strong> of <strong>{issues.length}</strong> reports
            {searchTerm && <span> for "<em>{searchTerm}</em>"</span>}
          </div>
        )}

        {loading ? (
          <div className="cp-skeleton-grid">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="cp-skeleton" style={{ animationDelay: `${i*80}ms` }}>
                <div className="cp-skel-line cp-skel-short" />
                <div className="cp-skel-line cp-skel-title" />
                <div className="cp-skel-line" />
                <div className="cp-skel-line cp-skel-med" />
                <div className="cp-skel-line cp-skel-short" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="cp-empty">
            <div className="cp-empty-icon">📭</div>
            <h3>No reports found</h3>
            <p>{searchTerm ? `No results match "${searchTerm}"` : "No issues match the current filters."}</p>
            {searchTerm && (
              <button className="cp-empty-btn" onClick={() => { setSearchTerm(""); setSuggestions([]); }}>Clear search</button>
            )}
          </div>
        ) : (
          <div className="cp-grid">
            {filtered.map((issue, i) => (
              <ReportCard
                key={issue._id}
                issue={issue}
                role={role}
                userId={userId}
                index={i}
                onVote={vote}
                onStatusChange={updateStatus}
                onOpen={setActiveIssue}
              />
            ))}
          </div>
        )}
      </div>

      {activeIssue && (
        <IssueModal
          issue={activeIssue}
          images={activeIssue.images || []}
          onClose={() => setActiveIssue(null)}
          onDownload={downloadImage}
          token={token}
          userId={userId}
          role={role}
          onVote={vote}
          onStatusChange={updateStatus}
        />
      )}
    </>
  );
};

export default Complaints;