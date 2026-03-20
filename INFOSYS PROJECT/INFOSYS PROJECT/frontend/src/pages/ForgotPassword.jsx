import { useState, useRef, useEffect } from "react";
import "./forgotPassword.css";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Mail, KeyRound, ArrowLeft, RotateCcw } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

function ForgotPassword() {
  const [step,        setStep]        = useState(1);
  const [email,       setEmail]       = useState("");
  const [otp,         setOtp]         = useState(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [userId,      setUserId]      = useState("");
  const [loading,     setLoading]     = useState(false);

  const otpRefs  = useRef([]);
  const navigate = useNavigate();

  /* ── SEND OTP ── */
  const handleSendOtp = async () => {
    if (!email.trim()) { toast.error("Registered email required"); return; }
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      toast.success(res.data.msg);
      setUserId(res.data.userId);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ── OTP INPUT ── */
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) otpRefs.current[index + 1].focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1].focus();
  };

  /* ── AUTO-SUBMIT WHEN ALL 6 FILLED ── */
  useEffect(() => {
    if (otp.every(d => d !== "")) handleResetPassword();
  }, [otp]);

  /* ── RESET PASSWORD ── */
  const handleResetPassword = async () => {
    if (!newPassword.trim()) { toast.error("New password required"); return; }
    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        userId, otp: otp.join(""), newPassword,
      });
      toast.success("Password reset successful");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  /* ── ENTER KEY ── */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") step === 1 ? handleSendOtp() : handleResetPassword();
  };

  return (
    <>
      <Navbar isAuth={false} />

      <div className="forgot-wrapper">
        <div className="forgot-card">

          {/* ── EYEBROW ── */}
          <div className="forgot-eyebrow">
            <div className="forgot-eyebrow-dot" />
            CleanStreet
          </div>

          {/* ── STEP INDICATOR ── */}
          <div className="fp-step-row">
            <div className={`fp-step-dot ${step >= 1 ? (step > 1 ? "done" : "active") : ""}`} />
            <div className={`fp-step-dot ${step >= 2 ? "active" : ""}`} />
          </div>

          <h2>{step === 1 ? "Forgot Password" : "Reset Password"}</h2>
          <p className="subtitle">
            {step === 1
              ? "Enter your registered email and we'll send you an OTP"
              : "Enter the OTP sent to your email and choose a new password"}
          </p>

          {/* ════════ STEP 1 ════════ */}
          {step === 1 && (
            <>
              <input
                type="email"
                placeholder="Registered email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              <button
                className="forgot-btn"
                onClick={handleSendOtp}
                disabled={loading}
              >
                <Mail size={15} style={{ marginRight: 7, verticalAlign: "middle" }} />
                {loading ? "Sending OTP…" : "Send OTP"}
              </button>

              <p className="fp-login-text">
                Remember your password? <Link to="/">Log in</Link>
              </p>
            </>
          )}

          {/* ════════ STEP 2 ════════ */}
          {step === 2 && (
            <>
              {/* info banner */}
              <div className="fp-info-banner">
                <Mail size={14} />
                OTP sent to <strong style={{ marginLeft: 4 }}>{email}</strong>
              </div>

              {/* OTP boxes */}
              <div className="otp-box-wrapper">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => (otpRefs.current[index] = el)}
                    className="otp-box"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(e.target.value, index)}
                    onKeyDown={e => handleOtpKeyDown(e, index)}
                  />
                ))}
              </div>

              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              <button
                className="forgot-btn"
                onClick={handleResetPassword}
                disabled={loading}
              >
                <KeyRound size={15} style={{ marginRight: 7, verticalAlign: "middle" }} />
                {loading ? "Resetting…" : "Reset Password"}
              </button>

              <button
                className="back-link"
                onClick={() => { setStep(1); setOtp(Array(6).fill("")); }}
              >
                <ArrowLeft size={13} /> Back
              </button>
            </>
          )}

        </div>
      </div>
    </>
  );
}

export default ForgotPassword;