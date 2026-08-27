# Inkwell — Full-Stack Blog Application

A full-stack blog platform built as a learning project for the **Codomax Digital Solutions** Frontend & Backend Development internship. Users can register, log in, publish blog posts, edit or delete their own posts, and browse/search everyone else's — all backed by a real REST API and database.

**Live app:** [YOUR_NETLIFY_URL_HERE](#)
**Backend API:** [YOUR_RENDER_URL_HERE](#)

---

## Features

- 🔐 **Authentication** — JWT-based login/register, with bcrypt-hashed passwords
- 📝 **Full CRUD** — create, read, update, and delete blog posts
- 📊 **Personal dashboard** — see and manage only your own posts
- 👤 **Profile page** — view account details and log out
- 🔍 **Search & category filtering** — find posts by keyword or category
- 📱 **Responsive design** — usable on phones, tablets, and desktop
- 🍃 **Real database** — MongoDB Atlas via Mongoose, not mock/local data

## Tech Stack

**Frontend:** HTML5, CSS3 (no framework), vanilla JavaScript (`fetch` API)
**Backend:** Node.js, Express.js
**Database:** MongoDB Atlas (Mongoose ODM)
**Auth:** JSON Web Tokens (JWT), bcrypt password hashing
**Deployment:** Frontend on Netlify · Backend on Render

## Project Structure

```
inkwell-app/
├── frontend/
│   ├── index.html          Home — post feed, search, category filter
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html      Your posts — edit/delete
│   ├── create-blog.html    Create post (also handles edit mode)
│   ├── blog-detail.html    Single post view
│   ├── profile.html        Account info + logout
│   ├── css/style.css
│   └── js/app.js
└── backend/
    ├── server.js
    ├── config/db.js            MongoDB connection
    ├── models/                 User.js, Blog.js (Mongoose schemas)
    ├── controllers/            authController.js, blogController.js
    ├── middleware/authMiddleware.js   JWT verification
    ├── routes/                 authRoutes.js, blogRoutes.js
    └── data/blacklist.js       Logout token blacklist
```

## API Reference

| Method | Route               | Auth | Description                                        |
|--------|---------------------|------|------------------------------------------------------|
| POST   | `/api/auth/register`| No   | Create an account                                    |
| POST   | `/api/auth/login`   | No   | Log in, receive a JWT                                |
| POST   | `/api/auth/logout`  | No   | Blacklist the current JWT                            |
| GET    | `/api/auth/me`      | Yes  | Get the current user's profile                       |
| GET    | `/api/blogs`        | No   | List all posts — supports `?search=` and `?category=`|
| GET    | `/api/blogs/mine`   | Yes  | List the current user's posts                        |
| GET    | `/api/blogs/:id`    | No   | Get a single post                                     |
| POST   | `/api/blogs`        | Yes  | Create a post                                         |
| PUT    | `/api/blogs/:id`    | Yes  | Update your own post                                  |
| DELETE | `/api/blogs/:id`    | Yes  | Delete your own post                                  |

Protected routes require an `Authorization: Bearer <token>` header.

## Running Locally

### Backend
```bash
cd backend
npm install
```
Create a `.env` file:
```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=any_long_random_string
JWT_EXPIRES_IN=7d
```
```bash
npm start
```

### Frontend
Open `frontend/index.html` with VS Code's Live Server extension (or any static file server). It automatically points at `http://localhost:5000/api` when running locally.

## Deployment

- **Backend** deployed to [Render](https://render.com) as a Web Service, root directory `backend`, build command `npm install`, start command `npm start`, with `MONGO_URI`, `JWT_SECRET`, and `JWT_EXPIRES_IN` set as environment variables.
- **Frontend** deployed to [Netlify](https://netlify.com), publish directory `frontend`. Before deploying, `frontend/js/app.js` was updated to point `DEPLOYED_API_BASE` at the live Render backend URL.

## Author

**Disha Bisht**
B.Tech Information Technology, HMRITM (GGSIPU), Delhi
[GitHub](https://github.com/dishabisht17) · [LinkedIn](https://linkedin.com/in/disha-bisht-504a58334)

Built as part of the Codomax Digital Solutions internship program.
