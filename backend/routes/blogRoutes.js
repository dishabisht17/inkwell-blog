/* =========================================================
   backend/routes/blogRoutes.js
   Mounted at /api/blogs in server.js

   Route order matters here: "/mine" must be declared before
   "/:id", otherwise Express would treat "mine" as an :id value.
   ========================================================= */

const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/authMiddleware");
const {
  getAllBlogs,
  getMyBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
} = require("../controllers/blogController");

router.get("/", getAllBlogs);                    // public — Home page feed
router.get("/mine", requireAuth, getMyBlogs);     // protected — Dashboard
router.get("/:id", getBlogById);                  // public — Blog detail page
router.post("/", requireAuth, createBlog);        // protected — Create Blog
router.put("/:id", requireAuth, updateBlog);      // protected — Edit Blog
router.delete("/:id", requireAuth, deleteBlog);   // protected — Dashboard delete

module.exports = router;
