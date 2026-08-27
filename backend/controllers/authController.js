/* =========================================================
   backend/controllers/authController.js
   ========================================================= */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { blacklist } = require("../data/blacklist");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function signToken(user) {
  // Keep the payload small — just enough to identify the user.
  // The middleware looks the user back up in the DB on every request,
  // so this never goes stale even if the user's name changes later.
  return jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

async function register(req, res) {
  const { name, email, password } = req.body || {};

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: "Enter your full name." });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ message: "Enter a valid email." });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({ message: "Account created.", user: user.toJSON() });
  } catch (err) {
    return res.status(500).json({ message: "Could not create account. Try again." });
  }
}

async function login(req, res) {
  const { email, password } = req.body || {};
  const normalizedEmail = (email || "").trim().toLowerCase();

  try {
    // password has select:false in the schema, so we must ask for it explicitly here
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    const passwordMatches = await bcrypt.compare(password || "", user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    const token = signToken(user);
    return res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    return res.status(500).json({ message: "Login failed. Try again." });
  }
}

function logout(req, res) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) blacklist.add(token); // reject this token even though it hasn't expired yet
  return res.json({ message: "Logged out." });
}

function me(req, res) {
  return res.json({ user: req.user });
}

module.exports = { register, login, logout, me };
