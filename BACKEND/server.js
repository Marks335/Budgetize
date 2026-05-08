// ============================================================
//  server.js  —  The Entry Point (Main Class equivalent)
// ============================================================
// This is like your main() in Java/C++. It starts the server,
// connects all the routes, and serves static files.

const express = require("express");
const path    = require("path");

const expenseRoutes = require("./routes/expenses");
const goalRoutes    = require("./routes/goals");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────
// Middleware = functions that run on EVERY request before your route.
// Think of it as a filter/interceptor in Java.

// Parse incoming JSON bodies (like Jackson in Spring)
app.use(express.json());

// Serve all files in /public as static files
// (When browser asks for index.html, style.css, script.js — it gets them)
app.use(express.static(path.join(__dirname, "..", "FRONTEND")));

// ── Routes ────────────────────────────────────────────────────
// All URLs starting with /api/expenses go to our expense router
app.use("/api/expenses", expenseRoutes);
app.use("/api/goals",   goalRoutes);

// ── Catch-all: always serve index.html for unknown routes ──────
// This makes the frontend handle any URL (single-page app style)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start the server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎓 Budgetize running at http://localhost:${PORT}`);
  console.log(`   Press Ctrl+C to stop.\n`);
});
