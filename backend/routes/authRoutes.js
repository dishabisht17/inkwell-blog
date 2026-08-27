/* =========================================================
   backend/routes/authRoutes.js
   Mounted at /api/auth in server.js
   ========================================================= */

const express = require("express");
const router = express.Router();

const { register, login, logout, me } = require("../controllers/authController");
const requireAuth = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

module.exports = router;
