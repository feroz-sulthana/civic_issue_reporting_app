import { useEffect, useRef, useState } from "react";
import "./register.css";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import { Eye, EyeOff, Check, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const getPasswordStrength = (password) => {
  if (!password) return "";
  if (password.length < 6) return "weak";
  if (/[A-Z]/.test(password) && /\d/.test(password) && password.length >= 8)
    return "strong";
  return "medium";
};

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir",
  "Ladakh","Puducherry","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep","Andaman and Nicobar Islands",
];

function Register() {
  const navigate    = useNavigate();
  const debounceRef = useRef(null);

  const [form, setForm] = useState({
    name: "", username: "", email: "",
    state: "", role: "citizen", securityKey: "", password: "",
  });

  const [showPassword,    setShowPassword]    = useState(false);
  const [usernameStatus,  setUsernameStatus]  = useState("");
  const [passwordStrength,setPasswordStrength]= useState("");
  const [submitting,      setSubmitting]      = useState(false);

  /* ── GOOGLE ── */
  const handleGoogleSignup = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  /* ── USERNAME CHECK ── */
  const checkUsername = async (username) => {
    if (!username) return;
    setUsernameStatus("loading");
    try {
      const res  = await fetch(`${API_URL}/api/auth/check-username?username=${username}`);
      const data = await res.json();
      setUsernameStatus(data.exists ? "taken" : "available");
    } catch {
      setUsernameStatus("");
    }
  };

  /* ── INPUT CHANGE ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = name === "username" ? value.toLowerCase().trim() : value.trimStart();
    setForm(prev => ({ ...prev, [name]: updated }));

    if (name === "password") setPasswordStrength(getPasswordStrength(updated));

    if (name === "username") {
      setUsernameStatus("");
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => checkUsername(updated), 400);
    }
  };

  const handleRoleChange = (e) =>
    setForm(prev => ({ ...prev, role: e.target.value, securityKey: "" }));

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  /* ── SUBMIT ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (usernameStatus === "taken")                        { toast.error("Username already exists"); return; }
    if (passwordStrength === "weak")                       { toast.error("Password too weak"); return; }
    if (form.role === "admin" && !form.securityKey.trim()){ toast.error("Admin security key required"); return; }

    setSubmitting(true);
    const loadingToast = toast.loading("Creating account...");

    try {
      const payload = {
        name: form.name, username: form.username,
        email: form.email, password: form.password,
        state: form.state, role: form.role,
      };
      if (form.role === "admin") payload.securityKey = form.securityKey.trim();

      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);

      localStorage.setItem("token",  data.token);
      localStorage.setItem("role",   data.role);
      localStorage.setItem("userId", data.userId);

      toast.success("Account created successfully", { id: loadingToast });
      navigate(data.role === "admin" ? "/admin" : "/dashboard", { replace: true });

    } catch (err) {
      toast.error(err.message || "Registration failed", { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── STRENGTH LABEL ── */
  const strengthLabel = { weak: "Weak", medium: "Medium", strong: "Strong" };

  return (
    <>
      <Navbar isAuth={false} />

      <div className="register-wrapper">
        <form className="register-card" onSubmit={handleSubmit}>

          {/* ── EYEBROW ── */}
          <div className="register-eyebrow">
            <div className="register-eyebrow-dot" />
            CleanStreet
          </div>

          <h2>Create Account</h2>
          <p className="subtitle">Join CleanStreet. Make your city better.</p>

          {/* ── NAME + USERNAME ── */}
          <div className="two-col">
            <input
              name="name"
              placeholder="Full name"
              onChange={handleChange}
              required
            />

            <div className="username-field">
              <input
                name="username"
                placeholder="Username"
                onChange={handleChange}
                required
              />
              {usernameStatus === "available" &&
                <span className="status available"><Check size={13} /></span>}
              {usernameStatus === "taken" &&
                <span className="status taken"><X size={13} /></span>}
            </div>
          </div>

          {/* ── EMAIL ── */}
          <input
            name="email"
            type="email"
            placeholder="Email address"
            onChange={handleChange}
            required
          />

          {/* ── STATE + ROLE ── */}
          <div className="two-col">
            <select name="state" value={form.state} onChange={handleChange} required>
              <option value="">Select State</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <div className="role-box">
              <label>
                <input
                  type="radio" name="role" value="citizen"
                  checked={form.role === "citizen"}
                  onChange={handleRoleChange}
                />
                Citizen
              </label>
              <label>
                <input
                  type="radio" name="role" value="admin"
                  checked={form.role === "admin"}
                  onChange={handleRoleChange}
                />
                Admin
              </label>
            </div>
          </div>

          {/* ── ADMIN KEY ── */}
          {form.role === "admin" && (
            <input
              name="securityKey"
              placeholder="Admin security key"
              onChange={handleChange}
              required
            />
          )}

          {/* ── PASSWORD ── */}
          <div className="password-field">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword(p => !p)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* ── STRENGTH BARS ── */}
          {form.password && (
            <div className={`strength-row ${passwordStrength}`}>
              <div className="strength-bars">
                <div className="strength-bar" />
                <div className="strength-bar" />
                <div className="strength-bar" />
              </div>
              <span className="strength-label">
                {strengthLabel[passwordStrength]}
              </span>
            </div>
          )}

          {/* ── SUBMIT ── */}
          <button className="register-btn" disabled={submitting}>
            {submitting ? "Registering…" : "Create Account"}
          </button>

          {/* ── DIVIDER ── */}
          <div className="divider"><span>or</span></div>

          {/* ── GOOGLE ── */}
          <button type="button" className="google-btn" onClick={handleGoogleSignup}>
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
            />
            Continue with Google
          </button>

          {/* ── FOOTER ── */}
          <p className="login-text">
            Already have an account? <Link to="/">Log in</Link>
          </p>

        </form>
      </div>
    </>
  );
}

export default Register;