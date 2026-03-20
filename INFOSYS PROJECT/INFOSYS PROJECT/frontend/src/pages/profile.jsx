import { useEffect, useState } from "react";
import "./profile.css";
import Navbar from "../components/Navbar";
import axios from "axios";
import toast from "react-hot-toast";
import {
  User, Mail, Phone, MapPin, Calendar, Camera,
  Edit3, Check, X, Lock, AlertTriangle, CheckCircle, Star,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

/* ================= INDIAN STATES ================= */
const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh",
];

const Profile = () => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit]       = useState(false);

  const [form, setForm] = useState({
    name: "", username: "", phone: "", state: "",
  });

  /* ── FETCH PROFILE ── */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token");

        const res = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data);
        setForm({
          name:     res.data.name,
          username: res.data.username,
          phone:    res.data.phone || "",
          state:    res.data.state || "",
        });
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ── SAVE ── */
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${API_URL}/api/auth/me`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setEdit(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Update failed");
    }
  };

  /* ── PHOTO UPLOAD ── */
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${API_URL}/api/auth/me/photo`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      toast.success("Profile photo updated");
    } catch {
      toast.error("Photo upload failed");
    }
  };

  if (loading) return <p className="loading">Loading profile…</p>;
  if (!user)   return <p className="loading">Profile unavailable</p>;

  return (
    <>
      <Navbar isAuth={true} />

      <main className="page">

        {/* ── HEADER ── */}
        <div className="page-header">
          <h2>My Profile</h2>
          <p className="subtitle">Manage your personal information and account settings</p>
        </div>

        <section className="profile-wrapper">

          {/* ════════ LEFT CARD ════════ */}
          <div className="profile-card">

            {/* Avatar */}
            <div className="avatar">
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt="profile" referrerPolicy="no-referrer" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}

              {edit && (
                <label className="camera">
                  <Camera size={13} />
                  <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>

            <h3>{user.name}</h3>

            <div className="username-badge">
              <span className="username">@{user.username}</span>
              <span className={`badge ${user.role}`}>
                {user.role === "admin" ? "Admin" : "Citizen"}
              </span>
            </div>

            <p className="member">
              <Calendar size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Member since {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>

            <div className="divider" />

            {/* Mini stats */}
            <div className="profile-stats">
              <div className="profile-stat-item">
                <span className="stat-val">
                  {user.complaintsCount ?? 0}
                </span>
                <span className="stat-label">
                  <AlertTriangle size={10} style={{ marginRight: 3 }} />
                  Reported
                </span>
              </div>
              <div className="profile-stat-item">
                <span className="stat-val" style={{ color: "var(--green)" }}>
                  {user.resolvedCount ?? 0}
                </span>
                <span className="stat-label">
                  <CheckCircle size={10} style={{ marginRight: 3 }} />
                  Resolved
                </span>
              </div>
              <div className="profile-stat-item">
                <span className="stat-val" style={{ color: "var(--teal)" }}>
                  {user.votesCount ?? 0}
                </span>
                <span className="stat-label">
                  <Star size={10} style={{ marginRight: 3 }} />
                  Upvotes
                </span>
              </div>
              <div className="profile-stat-item">
                <span className="stat-val">
                  {user.commentsCount ?? 0}
                </span>
                <span className="stat-label">
                  Comments
                </span>
              </div>
            </div>

          </div>

          {/* ════════ RIGHT CARD ════════ */}
          <div className="info-card">

            <div className="info-header">
              <h3 className="account-title">
                <User size={17} /> Account Information
              </h3>

              <div className="action-buttons">
                {!edit ? (
                  <button className="btn primary" onClick={() => setEdit(true)}>
                    <Edit3 size={14} /> Edit Profile
                  </button>
                ) : (
                  <>
                    <button className="btn success" onClick={handleSave}>
                      <Check size={14} /> Save
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => {
                        setEdit(false);
                        setForm({
                          name:     user.name,
                          username: user.username,
                          phone:    user.phone || "",
                          state:    user.state || "",
                        });
                      }}
                    >
                      <X size={14} /> Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ── BASIC INFO ── */}
            <p className="section-label">Basic Information</p>
            <div className="form-grid">

              <div className="form-group">
                <label><User size={12} style={{ marginRight: 4 }} />Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  readOnly={!edit}
                  className={!edit ? "readonly" : ""}
                  placeholder="Your full name"
                />
              </div>

              <div className="form-group">
                <label><User size={12} style={{ marginRight: 4 }} />Username</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  readOnly={!edit}
                  className={!edit ? "readonly" : ""}
                  placeholder="@username"
                />
              </div>

            </div>

            {/* ── CONTACT ── */}
            <p className="section-label">Contact Details</p>
            <div className="form-grid">

              <div className="form-group email-field">
                <label><Mail size={12} style={{ marginRight: 4 }} />Email Address</label>
                <input value={user.email} readOnly className="readonly" />
                <span className="email-lock"><Lock size={9} style={{ marginRight: 3 }} />Locked</span>
              </div>

              <div className="form-group">
                <label><Phone size={12} style={{ marginRight: 4 }} />Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 10) setForm({ ...form, phone: value });
                  }}
                  readOnly={!edit}
                  className={!edit ? "readonly" : ""}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
              </div>

            </div>

            {/* ── LOCATION ── */}
            <p className="section-label">Location</p>
            <div className="form-grid">

              <div className="form-group">
                <label><MapPin size={12} style={{ marginRight: 4 }} />State</label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  disabled={!edit}
                  className={!edit ? "readonly" : ""}
                >
                  <option value="">Select State</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

            </div>

          </div>
        </section>
      </main>
    </>
  );
};

export default Profile;