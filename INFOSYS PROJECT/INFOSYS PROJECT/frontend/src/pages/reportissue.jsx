import React, { useState, useRef, useCallback } from "react";
import Navbar from "../components/Navbar";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import "./reportissue.css";

const API_URL = import.meta.env.VITE_API_URL;

/* ── FIX LEAFLET ICONS ── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ── ICONS ── */
const Ic = ({ d, size = 16, cls = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" className={cls}>
    <path d={d} />
  </svg>
);

const IC = {
  pin:      "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5z",
  upload:   "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  x:        "M18 6L6 18M6 6l12 12",
  arrow:    "M5 12h14M12 5l7 7-7 7",
  warn:     "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  cal:      "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  map:      "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  check:    "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  spin:     "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  img:      "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  chev:     "M6 9l6 6 6-6",
  info:     "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  landmark: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  tag:      "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z",
  pencil:   "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
};

/* ── MAP CLICK ── */
const MapClick = ({ onMapClick }) => {
  useMapEvents({ click: e => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
};

/* ── STEP BADGE ── */
const StepBadge = ({ n, icon, title, sub }) => (
  <div className="ri-step">
    <div className="ri-step-num">{n}</div>
    <div className="ri-step-ico"><Ic d={icon} size={17} /></div>
    <div className="ri-step-info">
      <span className="ri-step-title">{title}</span>
      <span className="ri-step-sub">{sub}</span>
    </div>
  </div>
);

/* ── LABEL ── */
const Lbl = ({ text, req }) => (
  <label className="ri-lbl">
    {text}{req && <span className="ri-req">*</span>}
  </label>
);

/* ── SELECT WRAPPER ── */
const Sel = ({ value, onChange, children }) => (
  <div className="ri-sel-wrap">
    <select className="ri-input ri-sel" value={value} onChange={e => onChange(e.target.value)}>
      {children}
    </select>
    <Ic d={IC.chev} size={14} cls="ri-sel-caret" />
  </div>
);

/* ════════════════════════════
   MAIN
════════════════════════════ */
const Reportissue = () => {
  const [issueType,   setIssueType]   = useState("");
  const [priority,    setPriority]    = useState("");
  const [address,     setAddress]     = useState("");
  const [landmark,    setLandmark]    = useState("");
  const [markerPos,   setMarkerPos]   = useState(null);
  const [images,      setImages]      = useState([]);
  const [description, setDescription] = useState("");
  const [observedOn,  setObservedOn]  = useState("");
  const [loading,     setLoading]     = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [dragActive,  setDragActive]  = useState(false);

  const mapRef  = useRef(null);
  const fileRef = useRef(null);

  /* progress */
  const steps = [issueType, priority, address, markerPos, description];
  const pct   = Math.round((steps.filter(Boolean).length / steps.length) * 100);

  /* image processing */
  const processImage = useCallback(async file => {
    if (!file.type.startsWith("image/")) { toast.error("Only images allowed"); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error("Max 5 MB per file"); return; }
    try {
      const c = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1280, useWebWorker: true });
      setImages(p => [...p, { file: c, preview: URL.createObjectURL(c) }]);
    } catch { toast.error("Compression failed"); }
  }, []);

  const handleDrop = e => {
    e.preventDefault(); setDragActive(false);
    Array.from(e.dataTransfer.files).forEach(processImage);
  };

  /* reverse geocode */
  const geocode = async (lat, lng) => {
    try {
      const d = await (await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      )).json();
      setAddress(d.display_name || "");
      setLandmark(d.address?.road || "");
    } catch { toast.error("Could not fetch address"); }
  };

  const handleMapClick = (lat, lng) => { setMarkerPos([lat, lng]); geocode(lat, lng); };

  const useGPS = () => {
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setMarkerPos([lat, lng]); geocode(lat, lng);
        mapRef.current?.setView([lat, lng], 17, { animate: true });
        toast.success("Location pinned 📍");
      },
      () => toast.error("Location access denied"),
      { enableHighAccuracy: true }
    );
  };

  /* submit */
  const handleSubmit = async () => {
    if (!issueType || !priority || !address || !markerPos) {
      toast.error("Fill all required fields and pin a location");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) { toast.error("Please log in first"); return; }

    setLoading(true);
    const fd = new FormData();
    fd.append("issueType",   issueType.trim());
    fd.append("priority",    priority.trim());
    fd.append("address",     address.trim());
    fd.append("landmark",    landmark.trim());
    fd.append("description", description.trim());
    fd.append("observedOn",  observedOn);
    fd.append("latitude",    Number(markerPos[0]));
    fd.append("longitude",   Number(markerPos[1]));
    images.forEach(i => fd.append("images", i.file));

    try {
      const res = await fetch(`${API_URL}/api/issues`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Submission failed");

      toast.success("Issue reported! 🎉");
      setSubmitted(true);

      setTimeout(() => {
        setSubmitted(false);
        setIssueType(""); setPriority(""); setAddress(""); setLandmark("");
        setMarkerPos(null); setImages([]); setDescription(""); setObservedOn("");
      }, 2200);
    } catch (e) {
      toast.error(e.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  const priorityColors = {
    low: { color: "#16a34a", bg: "#dcfce7", label: "Low — Minor inconvenience" },
    medium: { color: "#d97706", bg: "#fef3c7", label: "Medium — Needs attention" },
    high: { color: "#ea580c", bg: "#ffedd5", label: "High — Urgent issue" },
    critical: { color: "#dc2626", bg: "#fee2e2", label: "Critical — Immediate danger" },
  };

  return (
    <>
      <Navbar isAuth={true} />

      <div className="ri-page">
        <div className="ri-layout">

          {/* ════ LEFT PANEL ════ */}
          <aside className="ri-aside">
            <div className="ri-aside-inner">

              <div className="ri-aside-brand">
                <div className="ri-aside-logo">
                  <Ic d={IC.warn} size={22} />
                </div>
                <div>
                  <div className="ri-aside-title">Report an Issue</div>
                  <div className="ri-aside-sub">Help your community</div>
                </div>
              </div>

              {/* progress ring */}
              <div className="ri-ring-wrap">
                <svg viewBox="0 0 80 80" className="ri-ring-svg">
                  <circle cx="40" cy="40" r="32" className="ri-ring-track" />
                  <circle cx="40" cy="40" r="32" className="ri-ring-fill"
                    style={{ strokeDashoffset: `${201 - (201 * pct) / 100}` }} />
                </svg>
                <div className="ri-ring-label">
                  <strong>{pct}%</strong>
                  <span>done</span>
                </div>
              </div>

              {/* step list */}
              <div className="ri-aside-steps">
                {[
                  { n: 1, icon: IC.tag,      label: "Issue Details",    done: !!(issueType && priority) },
                  { n: 2, icon: IC.pencil,   label: "Description",      done: !!description },
                  { n: 3, icon: IC.img,      label: "Photos",           done: images.length > 0 },
                  { n: 4, icon: IC.pin,      label: "Location",         done: !!markerPos },
                ].map(({ n, icon, label, done }) => (
                  <div key={n} className={`ri-aside-step ${done ? "ri-step-done" : ""}`}>
                    <div className="ri-aside-step-num">
                      {done ? <Ic d={IC.check} size={13} /> : n}
                    </div>
                    <Ic d={icon} size={14} cls="ri-aside-step-icon" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <div className="ri-aside-note">
                <Ic d={IC.info} size={13} />
                Reports are reviewed within 24 hours by municipal authorities.
              </div>
            </div>
          </aside>

          {/* ════ FORM PANEL ════ */}
          <main className="ri-main">

            {/* page header */}
            <div className="ri-header">
              <div className="ri-header-eyebrow">
                <span className="ri-live-dot" /> Civic Issue Platform
              </div>
              <h1 className="ri-header-title">
                Report a Civic <em>Issue</em>
              </h1>
              <p className="ri-header-sub">
                Fill in the details below to report a public issue. Fields marked <span className="ri-req-inline">*</span> are required.
              </p>
            </div>

            {/* ── SECTION 1: ISSUE DETAILS ── */}
            <div className="ri-section">
              <StepBadge n="1" icon={IC.tag} title="Issue Details" sub="Type, priority, and when it was observed" />

              <div className="ri-grid-2">

                {/* Issue type */}
                <div className="ri-field">
                  <Lbl text="Issue Type" req />
                  <Sel value={issueType} onChange={setIssueType}>
                    <option value="">Select issue type…</option>
                    {["Garbage Overflow","Road Damage","Water Leakage","Street Light Not Working",
                      "Drainage Blockage","Illegal Dumping","Broken Footpath","Other"]
                      .map(o => <option key={o}>{o}</option>)}
                  </Sel>
                </div>

                {/* Priority */}
                <div className="ri-field">
                  <Lbl text="Priority Level" req />
                  <Sel value={priority} onChange={setPriority}>
                    <option value="">Select priority…</option>
                    <option value="low">🟢 Low — Minor inconvenience</option>
                    <option value="medium">🟡 Medium — Needs attention</option>
                    <option value="high">🟠 High — Urgent issue</option>
                    <option value="critical">🔴 Critical — Immediate danger</option>
                  </Sel>
                  {priority && (
                    <div className="ri-priority-chip"
                      style={{
                        background: priorityColors[priority]?.bg,
                        color: priorityColors[priority]?.color,
                        border: `1px solid ${priorityColors[priority]?.color}30`
                      }}>
                      <span className="ri-priority-dot"
                        style={{ background: priorityColors[priority]?.color }} />
                      {priorityColors[priority]?.label}
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="ri-field">
                  <Lbl text="Observed On" />
                  <div className="ri-iico-wrap">
                    <Ic d={IC.cal} size={15} cls="ri-iico" />
                    <input type="datetime-local" className="ri-input ri-iico-input"
                      value={observedOn} onChange={e => setObservedOn(e.target.value)} />
                  </div>
                  <p className="ri-hint">When did you first notice this?</p>
                </div>

                {/* Landmark */}
                <div className="ri-field">
                  <Lbl text="Nearby Landmark" />
                  <div className="ri-iico-wrap">
                    <Ic d={IC.landmark} size={15} cls="ri-iico" />
                    <input className="ri-input ri-iico-input"
                      placeholder="e.g. Near City Park Gate"
                      value={landmark} onChange={e => setLandmark(e.target.value)} />
                  </div>
                  <p className="ri-hint">Helps authorities find it faster</p>
                </div>
              </div>
            </div>

            <div className="ri-sep" />

            {/* ── SECTION 2: DESCRIPTION ── */}
            <div className="ri-section">
              <StepBadge n="2" icon={IC.pencil} title="Description" sub="Describe what you see in detail" />

              <div className="ri-field">
                <Lbl text="Description" />
                <textarea
                  className="ri-input ri-textarea"
                  placeholder="What exactly is the problem? How long has it been there? Any safety risks to people nearby?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
                <div className="ri-char-count">{description.length} characters</div>
              </div>
            </div>

            <div className="ri-sep" />

            {/* ── SECTION 3: PHOTOS ── */}
            <div className="ri-section">
              <StepBadge n="3" icon={IC.img} title="Photo Evidence" sub="Clear photos help resolve issues faster" />

              <div
                className={`ri-dropzone ${dragActive ? "ri-drop-active" : ""} ${images.length > 0 ? "ri-drop-has" : ""}`}
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => !images.length && fileRef.current.click()}
              >
                <input type="file" multiple accept="image/*" hidden ref={fileRef}
                  onChange={e => Array.from(e.target.files).forEach(processImage)} />

                {images.length === 0 ? (
                  <div className="ri-drop-placeholder">
                    <div className="ri-drop-icon">
                      <Ic d={IC.upload} size={26} />
                    </div>
                    <p className="ri-drop-title">Drag & drop photos here</p>
                    <p className="ri-drop-hint">
                      or <button className="ri-drop-browse" onClick={e => { e.stopPropagation(); fileRef.current.click(); }}>browse files</button>
                      &nbsp;· PNG, JPG, WEBP · max 5 MB each
                    </p>
                  </div>
                ) : (
                  <div className="ri-previews" onClick={e => e.stopPropagation()}>
                    {images.map((img, i) => (
                      <div key={i} className="ri-preview">
                        <img src={img.preview} alt="" />
                        <div className="ri-preview-overlay">
                          <span>Photo {i + 1}</span>
                        </div>
                        <button className="ri-preview-del"
                          onClick={e => { e.stopPropagation(); setImages(p => p.filter((_, j) => j !== i)); }}>
                          <Ic d={IC.x} size={11} />
                        </button>
                      </div>
                    ))}
                    <button className="ri-preview-add"
                      onClick={e => { e.stopPropagation(); fileRef.current.click(); }}>
                      <Ic d={IC.upload} size={20} />
                      <span>Add more</span>
                    </button>
                  </div>
                )}
              </div>

              {images.length > 0 && (
                <div className="ri-photo-count">
                  <Ic d={IC.check} size={13} />
                  {images.length} photo{images.length !== 1 ? "s" : ""} ready
                </div>
              )}
            </div>

            <div className="ri-sep" />

            {/* ── SECTION 4: LOCATION ── */}
            <div className="ri-section">
              <StepBadge n="4" icon={IC.map} title="Pin Location" sub="Click the map or use GPS to mark the exact spot" />

              <div className="ri-location-bar">
                <div className="ri-field ri-addr-field">
                  <Lbl text="Full Address" req />
                  <div className="ri-iico-wrap">
                    <Ic d={IC.pin} size={15} cls="ri-iico" />
                    <input className="ri-input ri-iico-input"
                      placeholder="Auto-fills when you click the map…"
                      value={address} onChange={e => setAddress(e.target.value)} />
                  </div>
                </div>
                <button className="ri-gps-btn" onClick={useGPS}>
                  <Ic d={IC.pin} size={16} />
                  Use My GPS
                </button>
              </div>

              {markerPos && (
                <div className="ri-coords">
                  <Ic d={IC.check} size={13} />
                  Pinned · {markerPos[0].toFixed(5)}, {markerPos[1].toFixed(5)}
                </div>
              )}

              <div className="ri-map-shell">
                <MapContainer
                  center={[12.9716, 77.5946]}
                  zoom={13}
                  className="ri-map"
                  ref={mapRef}
                >
                  <TileLayer
                    attribution="© OpenStreetMap"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClick onMapClick={handleMapClick} />
                  {markerPos && <Marker position={markerPos} draggable />}
                </MapContainer>

                {!markerPos && (
                  <div className="ri-map-tip">
                    <Ic d={IC.info} size={13} />
                    Click anywhere on the map to pin the issue location
                  </div>
                )}
              </div>
            </div>

            {/* ── SUBMIT ── */}
            <div className="ri-submit-area">
              <p className="ri-submit-note">
                <Ic d={IC.info} size={13} />
                Your report will be forwarded to the relevant municipal authority within 24 hours.
              </p>

              <button
                className={`ri-submit ${loading ? "ri-loading" : ""} ${submitted ? "ri-success" : ""}`}
                onClick={handleSubmit}
                disabled={loading || submitted}
              >
                {loading ? (
                  <><Ic d={IC.spin} size={18} cls="ri-spinner" />Submitting…</>
                ) : submitted ? (
                  <><Ic d={IC.check} size={18} />Issue Reported!</>
                ) : (
                  <>Submit Report<Ic d={IC.arrow} size={18} /></>
                )}
              </button>
            </div>

          </main>
        </div>
      </div>
    </>
  );
};

export default Reportissue;