/* =========================================================
   frontend/js/app.js
   Loaded by every page. Talks to the real backend via a
   REST API instead of storing users/blogs in localStorage.
   The session (token + basic user info) still lives in
   localStorage — that's normal, that's what every app does
   between logging in and getting a signed JWT (Module 5).
   ========================================================= */

// While developing locally, this points at your local backend.
// Once the backend is deployed (Module 6), replace the string
// below with your live backend URL, e.g.:
//   "https://inkwell-backend.onrender.com/api"
const DEPLOYED_API_BASE = "https://inkwell-backend-k8ct.onrender.com/api";

const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_BASE = isLocal ? "http://localhost:5000/api" : DEPLOYED_API_BASE;

const SESSION_KEY = "inkwell_session"; // { token, name, email }

/* ---------- session helpers ---------- */

function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
}

function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function authHeaders() {
  const session = getSession();
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}

function logout() {
  apiFetch("/auth/logout", { method: "POST" })
    .catch(() => {}) // logging out client-side still works even if the request fails
    .finally(() => {
      clearSession();
      window.location.href = "login.html";
    });
}

/* ---------- fetch wrapper ---------- */
// Centralizes the base URL, JSON headers, auth header, and error handling
// so every page doesn't have to repeat try/catch + res.ok boilerplate.

async function apiFetch(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    throw new Error("Can't reach the server. Is the backend running on port 5000?");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

/* ---------- nav: mobile toggle + login-state awareness ---------- */

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
  }

  const session = getSession();
  const guestOnly = document.querySelectorAll("[data-nav='guest']");
  const userOnly = document.querySelectorAll("[data-nav='user']");
  const userName = document.querySelector("[data-nav='username']");

  guestOnly.forEach((el) => (el.style.display = session ? "none" : ""));
  userOnly.forEach((el) => (el.style.display = session ? "" : "none"));
  if (userName && session) userName.textContent = session.name.split(" ")[0];

  const logoutBtn = document.querySelector("[data-action='logout']");
  if (logoutBtn) logoutBtn.addEventListener("click", (e) => { e.preventDefault(); logout(); });
}

/* ---------- route guard for protected pages ---------- */

function requireAuth() {
  if (!getSession()) {
    window.location.href = "login.html";
  }
}

/* ---------- Home page: render blog cards from the API ---------- */

let homeSearchTimer = null;

function initHome() {
  const grid = document.querySelector("#blog-grid");
  if (!grid) return;

  const searchInput = document.querySelector("#search-input");
  const categorySelect = document.querySelector("#category-filter");

  loadHomeBlogs();

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(homeSearchTimer);
      homeSearchTimer = setTimeout(loadHomeBlogs, 300); // debounce so it's not firing on every keystroke
    });
  }
  if (categorySelect) {
    categorySelect.addEventListener("change", loadHomeBlogs);
  }
}

async function loadHomeBlogs() {
  const grid = document.querySelector("#blog-grid");
  if (!grid) return;

  const search = document.querySelector("#search-input")?.value.trim() || "";
  const category = document.querySelector("#category-filter")?.value || "";

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  const query = params.toString() ? `?${params.toString()}` : "";

  grid.innerHTML = `<div class="empty-state">Loading posts…</div>`;

  try {
    const blogs = await apiFetch(`/blogs${query}`);

    const countEl = document.querySelector("#blog-count");
    if (countEl) countEl.textContent = `${blogs.length} post${blogs.length === 1 ? "" : "s"}`;

    if (!blogs.length) {
      grid.innerHTML = `<div class="empty-state">No posts match your filters.</div>`;
      return;
    }

    grid.innerHTML = blogs
      .map(
        (b) => `
        <a class="blog-card" href="blog-detail.html?id=${b.id}">
          <span class="stamp">${b.category}</span>
          <h3>${escapeHtml(b.title)}</h3>
          <p>${escapeHtml(b.excerpt)}</p>
          <span class="read-more">Read more &rarr;</span>
          <div class="byline">
            <span>${escapeHtml(b.author)}</span>
            <span>${formatDate(b.date)}</span>
          </div>
        </a>`
      )
      .join("");
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

/* ---------- Blog detail page ---------- */

async function initBlogDetail() {
  const container = document.querySelector("#blog-detail");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    container.innerHTML += `<div class="empty-state">No post specified.</div>`;
    return;
  }

  try {
    const blog = await apiFetch(`/blogs/${id}`);
    document.title = `${blog.title} — Inkwell`;

    container.innerHTML = `
      <a href="index.html" class="back-link">&larr; Back to all posts</a>
      <span class="stamp">${blog.category}</span>
      <h1>${escapeHtml(blog.title)}</h1>
      <div class="detail-byline">
        <span>${escapeHtml(blog.author)}</span>
        <span>${formatDate(blog.date)}</span>
      </div>
      <p class="detail-content">${escapeHtml(blog.content)}</p>
    `;
  } catch (err) {
    container.innerHTML = `
      <a href="index.html" class="back-link">&larr; Back to all posts</a>
      <div class="empty-state">${escapeHtml(err.message)}</div>
    `;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ---------- Register page ---------- */

function initRegister() {
  const form = document.querySelector("#register-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors(form);

    const name = form.name.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    const confirm = form.confirm.value;

    let valid = true;
    if (name.length < 2) valid = fieldError(form.name, "Enter your full name") && valid;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) valid = fieldError(form.email, "Enter a valid email") && valid;
    if (password.length < 6) valid = fieldError(form.password, "Use at least 6 characters") && valid;
    if (confirm !== password) valid = fieldError(form.confirm, "Passwords don't match") && valid;
    if (!valid) return;

    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      showMsg(form, "Account created. Redirecting to sign in…", "success");
      setTimeout(() => (window.location.href = "login.html"), 900);
    } catch (err) {
      showMsg(form, err.message, "error");
      submitBtn.disabled = false;
    }
  });
}

/* ---------- Login page ---------- */

function initLogin() {
  const form = document.querySelector("#login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors(form);

    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setSession({ token: data.token, name: data.user.name, email: data.user.email });
      window.location.href = "dashboard.html";
    } catch (err) {
      showMsg(form, err.message, "error");
      submitBtn.disabled = false;
    }
  });
}

/* ---------- Dashboard page ---------- */

function initDashboard() {
  const list = document.querySelector("#my-blogs");
  if (!list) return;

  requireAuth();
  const session = getSession();
  if (!session) return;

  const greeting = document.querySelector("#dash-greeting");
  if (greeting) greeting.textContent = `Welcome back, ${session.name.split(" ")[0]}`;

  renderMyBlogs();
}

async function renderMyBlogs() {
  const list = document.querySelector("#my-blogs");
  const session = getSession();
  if (!list || !session) return;

  list.innerHTML = `<div class="empty-state">Loading your posts…</div>`;

  try {
    const myBlogs = await apiFetch("/blogs/mine");

    const countEl = document.querySelector("#stat-count");
    if (countEl) countEl.textContent = myBlogs.length;

    if (!myBlogs.length) {
      list.innerHTML = `<div class="empty-state">You haven't published anything yet — start with "Create Blog".</div>`;
      return;
    }

    list.innerHTML = myBlogs
      .map(
        (b) => `
        <div class="dash-row" data-id="${b.id}">
          <div class="info">
            <h3>${escapeHtml(b.title)}</h3>
            <span>${b.category} · ${formatDate(b.date)}</span>
          </div>
          <div class="actions">
            <a class="btn btn-outline" href="create-blog.html?id=${b.id}">Edit</a>
            <button class="btn btn-danger" data-action="delete" data-id="${b.id}">Delete</button>
          </div>
        </div>`
      )
      .join("");

    list.querySelectorAll("[data-action='delete']").forEach((btn) => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        try {
          await apiFetch(`/blogs/${btn.dataset.id}`, { method: "DELETE" });
          renderMyBlogs();
        } catch (err) {
          alert(err.message);
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    list.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

/* ---------- Profile page ---------- */

async function initProfile() {
  const nameEl = document.querySelector("#profile-name");
  if (!nameEl) return;

  requireAuth();

  const logoutBtn = document.querySelector("#profile-logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  try {
    const { user } = await apiFetch("/auth/me");
    document.querySelector("#profile-name").textContent = user.name;
    document.querySelector("#profile-email").textContent = user.email;
    const sinceEl = document.querySelector("#profile-since");
    if (sinceEl) sinceEl.textContent = user.memberSince ? formatDate(user.memberSince) : "—";
  } catch (err) {
    // token is invalid/expired server-side — clear the stale local session and send them to log in again
    clearSession();
    window.location.href = "login.html";
  }
}

/* ---------- Create / Edit Blog page ---------- */

function initCreateBlog() {
  const form = document.querySelector("#create-blog-form");
  if (!form) return;

  requireAuth();

  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");
  const heading = document.querySelector("#form-heading");
  const eyebrow = document.querySelector("#form-eyebrow");
  const submitBtn = document.querySelector("#form-submit-btn");

  if (editId) {
    // Edit mode — load the existing post and prefill the form.
    if (heading) heading.textContent = "Edit your post";
    if (eyebrow) eyebrow.textContent = "Editing";
    if (submitBtn) submitBtn.textContent = "Save Changes";

    apiFetch(`/blogs/${editId}`)
      .then((blog) => {
        form.title.value = blog.title;
        form.category.value = blog.category;
        form.excerpt.value = blog.excerpt;
        form.content.value = blog.content;
      })
      .catch((err) => showMsg(form, err.message, "error"));
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors(form);

    const title = form.title.value.trim();
    const category = form.category.value;
    const excerpt = form.excerpt.value.trim();
    const content = form.content.value.trim();

    let valid = true;
    if (title.length < 4) valid = fieldError(form.title, "Give it a title (4+ characters)") && valid;
    if (!category) valid = fieldError(form.category, "Pick a category") && valid;
    if (excerpt.length < 10) valid = fieldError(form.excerpt, "Write a short excerpt (10+ characters)") && valid;
    if (content.length < 20) valid = fieldError(form.content, "The post body needs more content") && valid;
    if (!valid) return;

    submitBtn.disabled = true;

    try {
      if (editId) {
        await apiFetch(`/blogs/${editId}`, {
          method: "PUT",
          body: JSON.stringify({ title, category, excerpt, content }),
        });
        showMsg(form, "Updated. Redirecting to your dashboard…", "success");
      } else {
        await apiFetch("/blogs", {
          method: "POST",
          body: JSON.stringify({ title, category, excerpt, content }),
        });
        showMsg(form, "Published. Redirecting to your dashboard…", "success");
      }
      setTimeout(() => (window.location.href = "dashboard.html"), 900);
    } catch (err) {
      showMsg(form, err.message, "error");
      submitBtn.disabled = false;
    }
  });
}

/* ---------- shared form helpers ---------- */

function fieldError(input, message) {
  const field = input.closest(".field");
  field.classList.add("has-error");
  field.querySelector(".field-error").textContent = message;
  return false;
}

function clearErrors(form) {
  form.querySelectorAll(".field.has-error").forEach((f) => f.classList.remove("has-error"));
  const msg = form.querySelector(".form-msg");
  if (msg) msg.classList.remove("show", "error", "success");
}

function showMsg(form, text, type) {
  const msg = form.querySelector(".form-msg");
  if (!msg) return;
  msg.textContent = text;
  msg.classList.add("show", type);
}

/* ---------- boot ---------- */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initHome();
  initRegister();
  initLogin();
  initDashboard();
  initCreateBlog();
  initBlogDetail();
  initProfile();
});
