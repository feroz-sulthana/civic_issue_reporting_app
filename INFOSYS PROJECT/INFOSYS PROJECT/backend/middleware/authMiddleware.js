const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  /* ================= CHECK AUTH HEADER ================= */

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Authorization token missing" });
  }

  /* ================= CHECK JWT SECRET ================= */

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ msg: "JWT secret not configured" });
  }

  try {
    /* ================= EXTRACT TOKEN ================= */

    const token = authHeader.split(" ")[1];

    /* ================= VERIFY TOKEN ================= */

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /* ================= ATTACH USER DATA ================= */

    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();

  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ msg: "Token expired, please login again" });
    }

    return res.status(401).json({ msg: "Invalid token" });
  }
};