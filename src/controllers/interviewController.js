const interviewService = require("../services/interviewService");

/**
 * POST /api/interview/start
 * Starts a new interview session.
 */
async function startInterview(req, res, next) {
  try {
    const { role, difficulty = "medium", topic, maxQuestions = 5 } = req.body;

    if (!role) return res.status(400).json({ success: false, error: "role is required." });
    if (!topic) return res.status(400).json({ success: false, error: "topic is required." });
    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return res.status(400).json({ success: false, error: "difficulty must be easy | medium | hard." });
    }

    const data = await interviewService.createSession({ role, difficulty, topic, maxQuestions: Number(maxQuestions) });

    res.status(200).json({
      success: true,
      sessionId: data.sessionId,
      message: data.message,           // Gemini's opening greeting + first question
      questionNumber: data.questionNumber,
      totalQuestions: data.totalQuestions,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/interview/answer
 * Submit a candidate answer; receive interviewer feedback + next question.
 */
async function submitAnswer(req, res, next) {
  try {
    const { sessionId, answer } = req.body;

    if (!sessionId) return res.status(400).json({ success: false, error: "sessionId is required." });
    if (!answer || !answer.trim()) return res.status(400).json({ success: false, error: "answer cannot be empty." });

    const data = await interviewService.processAnswer(sessionId, answer.trim());

    res.status(200).json({
      success: true,
      message: data.interviewerReply,   // Feedback + next question (or closing + report prompt)
      questionNumber: data.questionNumber,
      totalQuestions: data.totalQuestions,
      completed: data.completed,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/interview/session/:sessionId
 * Returns the current session state including full conversation history.
 */
function getSession(req, res, next) {
  try {
    const session = interviewService.getSession(req.params.sessionId);
    res.status(200).json({ success: true, session });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/interview/report/:sessionId
 * Returns the final structured report (only available when interview is completed).
 */
async function getReport(req, res, next) {
  try {
    const report = await interviewService.getReport(req.params.sessionId);
    res.status(200).json({ success: true, ...report });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/interview/session/:sessionId
 * Deletes a session from memory.
 */
function deleteSession(req, res, next) {
  try {
    interviewService.deleteSession(req.params.sessionId);
    res.status(200).json({ success: true, message: "Session deleted." });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/interview/sessions
 * Lists all sessions (for debugging).
 */
function listSessions(req, res, next) {
  try {
    const sessions = interviewService.listSessions();
    res.status(200).json({ success: true, count: sessions.length, sessions });
  } catch (err) {
    next(err);
  }
}

module.exports = { startInterview, submitAnswer, getSession, getReport, deleteSession, listSessions };
