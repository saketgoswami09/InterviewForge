const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/interviewController");

// Start a new interview session
router.post("/start", ctrl.startInterview);

// Submit an answer to the current question
router.post("/answer", ctrl.submitAnswer);

// Get session state & full conversation history
router.get("/session/:sessionId", ctrl.getSession);

// Get the final interview report (only when completed)
router.get("/report/:sessionId", ctrl.getReport);

// Delete a session
router.delete("/session/:sessionId", ctrl.deleteSession);

// List all sessions (debug)
router.get("/sessions", ctrl.listSessions);

module.exports = router;
