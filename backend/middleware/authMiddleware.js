/* =========================================================
   backend/middleware/authMiddleware.js
   Protects routes that require a logged-in user. Expects
   header: Authorization: Bearer <jwt>
   ========================================================= */

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { blacklist } = require("../data/blacklist");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated. Please log in." });
  }
  if (blacklist.has(token)) {
    return res.status(401).json({ message: "Session ended. Please log in again." });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // covers both an invalid signature and an expired token (TokenExpiredError)
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }

  try {
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(401).json({ message: "Account no longer exists." });
    }
    req.user = {
      name: user.name,
      email: user.email,
      memberSince: user.createdAt,
    };
    next();
  } catch (err) {
    return res.status(500).json({ message: "Authentication check failed." });
  }
}

module.exports = requireAuth;
