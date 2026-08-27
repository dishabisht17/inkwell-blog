/* =========================================================
   backend/data/blacklist.js
   JWTs are stateless — the server doesn't normally track them.
   That means logout can't just "delete a session" like before.
   Instead, when someone logs out, we add their token to this
   blacklist so it's rejected even though it's still technically
   valid until it expires. In-memory is fine for a learning
   project; a real production app would use Redis with a TTL
   matching the token's expiry.
   ========================================================= */

const blacklist = new Set();

module.exports = { blacklist };
