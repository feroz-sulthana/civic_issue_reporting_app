const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");

const User = require("../models/User");
const Otp = require("../models/Otp");
const Issue = require("../models/Issue");

const sendOtp = require("../utils/sendOtp");
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/issueUpload");

const cloudinary = require("../config/cloudinary");

const router = express.Router();

/* ================= CONFIG ================= */

const OTP_EXPIRY_MS =
  Number(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000;

const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_RESENDS = 3;

/* ================= EMAIL MASK ================= */

const maskEmail = (email) => {
  const [name, domain] = email.split("@");

  const masked =
    name.length <= 2
      ? name[0] + "*"
      : name[0] + "*".repeat(name.length - 2) + name[name.length - 1];

  return `${masked}@${domain}`;
};

/* ================= USERNAME CHECK ================= */

router.get("/check-username", async (req, res) => {
  try {
    const username = req.query.username?.trim().toLowerCase();

    if (!username) return res.json({ exists: false });

    const user = await User.findOne({ username });

    res.json({ exists: !!user });

  } catch (err) {
    console.error("USERNAME CHECK ERROR:", err);
    res.status(500).json({ exists: false });
  }
});

/* ================= GOOGLE AUTH ================= */

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:5173/",
  }),
  (req, res) => {

    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.redirect(
      `http://localhost:5173/oauth-success?token=${token}&role=${req.user.role}&userId=${req.user._id}`
    );
  }
);

/* ================= REGISTER ================= */

router.post("/register", async (req, res) => {
  try {

    let { name, username, email, password, state, role, securityKey } =
      req.body;

    email = email?.toLowerCase().trim();
    username = username?.toLowerCase().trim();

    if (!name || !username || !email || !password || !state) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    /* ADMIN SECURITY KEY */

    if (role === "admin" && securityKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ msg: "Invalid admin security key" });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    if (await User.findOne({ username })) {
      return res.status(400).json({ msg: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      state,
      role: role === "admin" ? "admin" : "citizen",
      provider: "local",
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      token,
      role: user.role,
      userId: user._id,
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ msg: "Registration failed" });
  }
});

/* ================= LOGIN → SEND OTP ================= */

router.post("/login", async (req, res) => {
  try {

    let { identifier, password } = req.body;

    identifier = identifier?.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) return res.status(400).json({ msg: "User not found" });

    if (user.provider === "local") {

      if (!password)
        return res.status(400).json({ msg: "Password required" });

      const ok = await bcrypt.compare(password, user.password);

      if (!ok)
        return res.status(400).json({ msg: "Invalid credentials" });

    }

    await Otp.deleteMany({ userId: user._id });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.create({
      userId: user._id,
      otp,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      resendCount: 0,
      lastSentAt: new Date(),
    });

    await sendOtp(user.email, otp);

    res.json({
      msg: `OTP sent to ${maskEmail(user.email)}`,
      userId: user._id,
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ msg: "Login failed" });
  }
});

/* ================= RESEND OTP ================= */

router.post("/resend-otp", async (req, res) => {
  try {

    const { userId } = req.body;

    const record = await Otp.findOne({ userId });

    if (!record)
      return res.status(400).json({ msg: "OTP session expired" });

    if (record.resendCount >= MAX_RESENDS)
      return res.status(429).json({ msg: "Resend limit reached" });

    if (Date.now() - record.lastSentAt < RESEND_COOLDOWN_MS)
      return res.status(429).json({ msg: "Please wait before resending OTP" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    record.otp = otp;
    record.expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    record.resendCount += 1;
    record.lastSentAt = new Date();

    await record.save();

    const user = await User.findById(userId);

    await sendOtp(user.email, otp);

    res.json({ msg: `OTP resent to ${maskEmail(user.email)}` });

  } catch (err) {
    console.error("RESEND OTP ERROR:", err);
    res.status(500).json({ msg: "Failed to resend OTP" });
  }
});

/* ================= VERIFY OTP ================= */

router.post("/verify-otp", async (req, res) => {
  try {

    const { userId, otp } = req.body;

    const record = await Otp.findOne({ userId, otp });

    if (!record || record.expiresAt < new Date())
      return res.status(400).json({ msg: "Invalid or expired OTP" });

    await Otp.deleteMany({ userId });

    const user = await User.findById(userId);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: user.role,
      userId: user._id,
    });

  } catch (err) {
    console.error("OTP VERIFY ERROR:", err);
    res.status(500).json({ msg: "OTP verification failed" });
  }
});

/* ================= GET PROFILE ================= */

router.get("/me", auth, async (req, res) => {
  try {

    const user = await User.findById(req.user.id).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });

    // Fetch all issues reported by this user
    const userIssues = await Issue.find({ user: req.user.id });

    const complaintsCount = userIssues.length;
    const resolvedCount   = userIssues.filter(i => i.status === "resolved").length;
    const votesCount      = userIssues.reduce(
      (sum, i) => sum + (i.upvotes?.length ?? 0), 0
    );

    res.json({
      ...user.toObject(),
      complaintsCount,
      resolvedCount,
      votesCount,
      commentsCount: 0,
    });

  } catch (err) {
    console.error("GET ME ERROR:", err);
    res.status(500).json({ msg: "Failed to load profile" });
  }
});

/* ================= UPDATE PROFILE ================= */

router.put("/me", auth, async (req, res) => {

  const { name, username, phone, state } = req.body;

  if (phone && !/^[0-9]{10}$/.test(phone))
    return res.status(400).json({ msg: "Invalid phone number" });

  if (username) {

    const exists = await User.findOne({
      username,
      _id: { $ne: req.user.id },
    });

    if (exists)
      return res.status(400).json({ msg: "Username already taken" });

  }

  const updated = await User.findByIdAndUpdate(
    req.user.id,
    { name, username, phone, state },
    { new: true }
  ).select("-password");

  res.json(updated);

});

/* ================= PROFILE PHOTO ================= */

router.put("/me/photo", auth, upload.single("photo"), async (req, res) => {

  if (!req.file)
    return res.status(400).json({ msg: "No image uploaded" });

  const user = await User.findById(req.user.id);

  if (user.profilePhoto?.includes("res.cloudinary.com")) {

    const publicId = user.profilePhoto.split("/").pop().split(".")[0];

    await cloudinary.uploader.destroy(
      `cleanstreet/profile/${publicId}`
    );
  }

  user.profilePhoto = req.file.path;

  await user.save();

  res.json(user);

});

module.exports = router;