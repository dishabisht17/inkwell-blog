/* =========================================================
   backend/server.js
   Entry point — run with: npm start  (or npm run dev)
   ========================================================= */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); // allows the frontend (running on a different port) to call this API
app.use(express.json()); // parses JSON request bodies into req.body

app.get("/", (req, res) => {
  res.json({ message: "Inkwell API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);

// 404 handler — must come after all real routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Inkwell backend running on http://localhost:${PORT}`);
  });
});
