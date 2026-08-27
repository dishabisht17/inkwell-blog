/* =========================================================
   backend/config/db.js
   Connects to MongoDB Atlas using the MONGO_URI from .env
   ========================================================= */

const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1); // no point running the server without a DB
  }
}

module.exports = connectDB;
