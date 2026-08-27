/* =========================================================
   backend/controllers/blogController.js
   ========================================================= */

const Blog = require("../models/Blog");

async function getAllBlogs(req, res) {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    const blogs = await Blog.find(filter).sort({ createdAt: -1 });
    return res.json(blogs);
  } catch (err) {
    return res.status(500).json({ message: "Could not load posts." });
  }
}

async function getMyBlogs(req, res) {
  try {
    const blogs = await Blog.find({ authorEmail: req.user.email }).sort({ createdAt: -1 });
    return res.json(blogs);
  } catch (err) {
    return res.status(500).json({ message: "Could not load your posts." });
  }
}

async function getBlogById(req, res) {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Post not found." });
    }
    return res.json(blog);
  } catch (err) {
    // an id that isn't a valid Mongo ObjectId throws a CastError — treat it as "not found"
    return res.status(404).json({ message: "Post not found." });
  }
}

async function createBlog(req, res) {
  const { title, category, excerpt, content } = req.body || {};

  if (!title || title.trim().length < 4) {
    return res.status(400).json({ message: "Give it a title (4+ characters)." });
  }
  if (!category) {
    return res.status(400).json({ message: "Pick a category." });
  }
  if (!excerpt || excerpt.trim().length < 10) {
    return res.status(400).json({ message: "Write a short excerpt (10+ characters)." });
  }
  if (!content || content.trim().length < 20) {
    return res.status(400).json({ message: "The post body needs more content." });
  }

  try {
    const blog = await Blog.create({
      title: title.trim(),
      category,
      excerpt: excerpt.trim(),
      content: content.trim(),
      author: req.user.name,
      authorEmail: req.user.email,
    });
    return res.status(201).json(blog);
  } catch (err) {
    return res.status(500).json({ message: "Could not publish post. Try again." });
  }
}

async function updateBlog(req, res) {
  const { title, category, excerpt, content } = req.body || {};

  if (!title || title.trim().length < 4) {
    return res.status(400).json({ message: "Give it a title (4+ characters)." });
  }
  if (!category) {
    return res.status(400).json({ message: "Pick a category." });
  }
  if (!excerpt || excerpt.trim().length < 10) {
    return res.status(400).json({ message: "Write a short excerpt (10+ characters)." });
  }
  if (!content || content.trim().length < 20) {
    return res.status(400).json({ message: "The post body needs more content." });
  }

  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Post not found." });
    }
    if (blog.authorEmail !== req.user.email) {
      return res.status(403).json({ message: "You can only edit your own posts." });
    }

    blog.title = title.trim();
    blog.category = category;
    blog.excerpt = excerpt.trim();
    blog.content = content.trim();
    await blog.save();

    return res.json(blog);
  } catch (err) {
    return res.status(404).json({ message: "Post not found." });
  }
}

async function deleteBlog(req, res) {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Post not found." });
    }
    if (blog.authorEmail !== req.user.email) {
      return res.status(403).json({ message: "You can only delete your own posts." });
    }
    await blog.deleteOne();
    return res.json({ message: "Deleted." });
  } catch (err) {
    return res.status(404).json({ message: "Post not found." });
  }
}

module.exports = { getAllBlogs, getMyBlogs, getBlogById, createBlog, updateBlog, deleteBlog };
