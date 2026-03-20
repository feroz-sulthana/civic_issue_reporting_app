import { useState, useEffect } from "react";
import "./login.css";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Eye, EyeOff, Mail, ArrowLeft, ShieldCheck } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [identifier,   setIdentifier]   = useState("");
  const [password,     setPassword]     = useState("");

  const [otp,          setOtp]          = useState(Array(6).fill(""));
  const [step,         setStep]         = useState(1);
  const [userId,       setUserId]       = useState("");
  const [maskedEmail,  setMaskedEmail]  = useState("");

  const [cooldown,     setCooldown]     = useState(0);
  const [resendCount,  setResendCount]  = useState(0);

  const navigate = useNavigate();

  /* ── COOLDOWN TIMER ── */
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  /* ── LOGIN ── */
  const handleLogin = async () => {
    if (!identifier.trim()) { toast.error("Email or Username required"); return; }
    try {
      const res   = await axios.post(`${API_URL}/api/auth/login`, {
        identifier, password: password.trim() || undefined,
      });
      const match = res.data.msg.match(/to (.+)$/);
      if (match) setMaskedEmail(match[1]);
      setUserId(res.data.userId);
      setStep(2);
      setCooldown(30);
      setResendCount(0);
      setOtp(Array(6).fill(""));
      toast.success(res.data.msg);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Login failed");
    }
  };

  /* ── VERIFY OTP ── */
  const handleVerifyOtp = async (finalOtp = otp.join("")) => {
    if (finalOtp.length !== 6) return;
    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        userId, otp: finalOtp,
      });
      localStorage.setItem("token",  res.data.token);
      localStorage.setItem("role",   res.data.role);
      localStorage.setItem("userId", res.data.userId);
      toast.success("Login successful");
      navigate(res.data.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.msg || "Invalid OTP");
    }
  };

  /* ── OTP INPUT ── */
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`).focus();
    if (newOtp.join("").length === 6) handleVerifyOtp(newOtp.join(""));
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      document.getElementById(`otp-${index - 1}`).focus();
  };

  /* ── RESEND OTP ── */
  const handleResendOtp = async () => {
    if (cooldown > 0 || resendCount >= 3) return;
    try {
      const res   = await axios.post(`${API_URL}/api/auth/resend-otp`, { userId });
      const match = res.data.msg.match(/to (.+)$/);
      if (match) setMaskedEmail(match[1]);
      setCooldown(30);
      setResendCount(c => c + 1);
      setOtp(Array(6).fill(""));
      toast.success(res.data.msg);
    } catch {
      toast.error("Failed to resend OTP");
    }
  };

  /* ── GOOGLE ── */
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  /* ── ENTER KEY ── */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && step === 1) handleLogin();
  };

  return (
    <>
      <Navbar isAuth={false} />

      <div className="login-wrapper">
        <div className="login-card">

          {/* ── EYEBROW ── */}
          <div className="login-eyebrow">
            <div className="login-eyebrow-dot" />
            CleanStreet
          </div>

          <h2>{step === 1 ? "Welcome Back" : "Check Your Email"}</h2>
          <p className="subtitle">
            {step === 1
              ? "Login to continue to CleanStreet"
              : "Enter the 6-digit OTP sent to your email"}
          </p>

          {/* ════════ STEP 1 ════════ */}
          {step === 1 && (
            <>
              <input
                type="text"
                placeholder="Email or Username"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(p => !p)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>

              <button className="login-btn" onClick={handleLogin}>
                Continue
              </button>

              <div className="divider"><span>or</span></div>

              <button className="google-btn" onClick={handleGoogleLogin}>
                <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google"
                />
                Continue with Google
              </button>

              <p className="register-text">
                Don't have an account? <Link to="/register">Sign up free</Link>
              </p>
            </>
          )}

          {/* ════════ STEP 2 ════════ */}
          {step === 2 && (
            <>
              {/* sent-to banner */}
              <div className="otp-sent-info">
                <Mail size={15} />
                OTP sent to&nbsp;<strong>{maskedEmail}</strong>
              </div>

              {/* OTP boxes */}
              <div className="otp-box-wrapper">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    className="otp-box"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(e.target.value, index)}
                    onKeyDown={e => handleOtpKeyDown(e, index)}
                  />
                ))}
              </div>

              <button className="login-btn" onClick={() => handleVerifyOtp()}>
                <ShieldCheck size={16} style={{ marginRight: 7, verticalAlign: "middle" }} />
                Verify OTP
              </button>

              {/* resend */}
              <p className="resend-row">
                {resendCount >= 3 ? (
                  <span className="resend-timer">Resend limit reached</span>
                ) : cooldown > 0 ? (
                  <span className="resend-timer">Resend in {cooldown}s</span>
                ) : (
                  <>
                    Didn't receive it?&nbsp;
                    <button className="resend-btn" onClick={handleResendOtp}>
                      Resend OTP
                    </button>
                  </>
                )}
              </p>

              {/* back */}
              <button className="back-link" onClick={() => setStep(1)}>
                <ArrowLeft size={13} /> Back to login
              </button>
            </>
          )}

        </div>
      </div>
    </>
  );
}

export default Login;

