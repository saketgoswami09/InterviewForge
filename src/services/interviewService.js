const { v4: uuidv4 } = require("uuid");
const { getModel, buildSystemPrompt } = require("../config/gemini");

// In-memory session store: sessionId -> session object
const sessions = new Map();

/**
 * Creates a new interview session and gets the opening message from Gemini (the interviewer).
 */
async function createSession({ role, difficulty = "medium", topic, maxQuestions = 5 }) {
  const sessionId = uuidv4();
  const model = getModel();
  const systemPrompt = buildSystemPrompt(role, difficulty, topic, maxQuestions);

  // Start a Gemini chat with the system prompt baked into the first user turn
  const chat = model.startChat({
    history: [],
    generationConfig: { maxOutputTokens: 1024, temperature: 0.8 },
  });

  // Send the system prompt as the very first message so Gemini adopts the interviewer role
  const result = await chat.sendMessage(systemPrompt);
  const openingMessage = result.response.text();

  const session = {
    sessionId,
    role,
    difficulty,
    topic,
    maxQuestions,
    questionCount: 1,
    answers: [],
    status: "active",
    startedAt: new Date().toISOString(),
    completedAt: null,
    chat, // Gemini chat instance (maintains conversation history internally)
    history: [
      { role: "interviewer", content: openingMessage },
    ],
  };

  sessions.set(sessionId, session);

  return {
    sessionId,
    message: openingMessage,
    questionNumber: 1,
    totalQuestions: maxQuestions,
  };
}

/**
 * Submits a candidate's answer and gets the interviewer's response (feedback + next question).
 */
async function processAnswer(sessionId, userAnswer) {
  const session = sessions.get(sessionId);
  if (!session) throw Object.assign(new Error("Session not found"), { statusCode: 404 });
  if (session.status === "completed") {
    throw Object.assign(new Error("Interview is already completed. Fetch the report."), { statusCode: 400 });
  }

  // Log candidate answer
  session.history.push({ role: "candidate", content: userAnswer });
  session.answers.push({ questionNumber: session.questionCount, answer: userAnswer });

  // Send answer to Gemini — it will reply with feedback + next question (or final report)
  const result = await session.chat.sendMessage(userAnswer);
  const interviewerReply = result.response.text();

  session.history.push({ role: "interviewer", content: interviewerReply });

  const isLastQuestion = session.questionCount >= session.maxQuestions;

  if (isLastQuestion) {
    session.status = "completed";
    session.completedAt = new Date().toISOString();
  } else {
    session.questionCount++;
  }

  return {
    interviewerReply,
    questionNumber: session.questionCount,
    totalQuestions: session.maxQuestions,
    completed: session.status === "completed",
  };
}

/**
 * Returns a snapshot of the session (without the Gemini chat object).
 */
function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) throw Object.assign(new Error("Session not found"), { statusCode: 404 });

  const { chat, ...snapshot } = session;
  return snapshot;
}

/**
 * Extracts and returns the final report from the last interviewer message.
 */
async function getReport(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) throw Object.assign(new Error("Session not found"), { statusCode: 404 });
  if (session.status !== "completed") {
    throw Object.assign(new Error("Interview is not completed yet."), { statusCode: 400 });
  }

  // Look for JSON block in the conversation history (Gemini embeds it in its last message)
  const lastInterviewerMsg = [...session.history]
    .reverse()
    .find((m) => m.role === "interviewer");

  let report = null;

  if (lastInterviewerMsg) {
    const jsonMatch = lastInterviewerMsg.content.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        report = JSON.parse(jsonMatch[1]);
      } catch {
        report = null;
      }
    }
  }

  // If no report found in history, ask Gemini explicitly
  if (!report) {
    const result = await session.chat.sendMessage(
      "Please now provide the final interview report in the exact JSON format specified earlier."
    );
    const text = result.response.text();
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        report = JSON.parse(jsonMatch[1]);
      } catch {
        report = { raw: text };
      }
    } else {
      report = { raw: text };
    }
  }

  return {
    sessionId,
    role: session.role,
    topic: session.topic,
    difficulty: session.difficulty,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    totalQuestions: session.maxQuestions,
    report,
  };
}

/**
 * Deletes a session.
 */
function deleteSession(sessionId) {
  if (!sessions.has(sessionId)) {
    throw Object.assign(new Error("Session not found"), { statusCode: 404 });
  }
  sessions.delete(sessionId);
}

/**
 * Lists all session IDs and their status (for debugging).
 */
function listSessions() {
  const result = [];
  for (const [id, s] of sessions.entries()) {
    result.push({
      sessionId: id,
      role: s.role,
      topic: s.topic,
      status: s.status,
      questionCount: s.questionCount,
      maxQuestions: s.maxQuestions,
      startedAt: s.startedAt,
    });
  }
  return result;
}

module.exports = { createSession, processAnswer, getSession, getReport, deleteSession, listSessions };
