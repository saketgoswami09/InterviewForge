require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const interviewRoutes = require("./routes/interview");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limit: max 60 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, error: "Too many requests. Please slow down." },
});
app.use(limiter);

// ── Health check ──────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🎤 Interview Chatbot API is live!",
    version: "1.0.0",
    endpoints: {
      startInterview:  "POST   /api/interview/start",
      submitAnswer:    "POST   /api/interview/answer",
      getSession:      "GET    /api/interview/session/:sessionId",
      getReport:       "GET    /api/interview/report/:sessionId",
      deleteSession:   "DELETE /api/interview/session/:sessionId",
      listSessions:    "GET    /api/interview/sessions",
    },
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────

app.use("/api/interview", interviewRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ──────────────────────────────────────────────────────

app.use(errorHandler);

module.exports = app;
