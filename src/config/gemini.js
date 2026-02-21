const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Returns a Gemini model instance.
 * API key is checked here (at request time) so the server can boot without a key set.
 */
function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error("GEMINI_API_KEY is not set. Add it to your .env file.");
    err.statusCode = 500;
    throw err;
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

/**
 * Builds the system prompt that makes Gemini behave like a strict interviewer.
 * @param {string} role - Job role being interviewed for
 * @param {string} difficulty - easy | medium | hard
 * @param {string} topic - Specific topic/technology
 * @param {number} maxQuestions - Total number of questions to ask
 */
function buildSystemPrompt(role, difficulty, topic, maxQuestions) {
  return `
You are an experienced, professional technical interviewer conducting a mock job interview.

Interview Details:
- Role: ${role}
- Topic/Technology: ${topic}
- Difficulty: ${difficulty}
- Total Questions: ${maxQuestions}

Your Behavior Rules:
1. You ALWAYS stay in character as the interviewer. Never break character.
2. Ask one question at a time. Wait for the candidate's answer before continuing.
3. After each answer, give brief, honest feedback (2–3 sentences): what was good, what was missing.
4. Then immediately ask the next question.
5. Your questions should be realistic, relevant to the role and topic, and progressively slightly harder.
6. Be professional but conversational — like a real interviewer, not a robot.
7. If the candidate gives a vague or wrong answer, politely point it out.
8. After all ${maxQuestions} questions are answered, produce a FINAL REPORT in this exact JSON format inside a markdown code block:

\`\`\`json
{
  "overallScore": 85,
  "grade": "B+",
  "summary": "The candidate demonstrated solid understanding of...",
  "strengths": ["Good knowledge of X", "Clear communication"],
  "improvements": ["Needs to elaborate on Y", "Missed key concept Z"],
  "recommendation": "Hire | Consider | Reject",
  "breakdown": [
    { "questionNumber": 1, "score": 8, "comment": "Good answer but missed..." },
    { "questionNumber": 2, "score": 9, "comment": "Excellent, well-structured" }
  ]
}
\`\`\`

Start the interview by greeting the candidate warmly, introducing yourself briefly, and asking the FIRST question.
`.trim();
}

module.exports = { getModel, buildSystemPrompt };
