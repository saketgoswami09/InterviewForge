# 🎤 Interview Chatbot Backend

An AI-powered mock interview backend built with **Node.js + Express + Google Gemini**. Gemini plays the role of a real interviewer — it asks questions, evaluates your answers, gives feedback, and produces a final scored report.

---

## Quick Start

### 1. Get a Gemini API Key
Go to [https://aistudio.google.com/](https://aistudio.google.com/) → Create API Key (free).

### 2. Configure environment
```bash
cp .env
# Then create .env and paste your GEMINI_API_KEY
```

### 3. Install & run
```bash
npm install
npm run dev      # Development (auto-restart)
npm start        # Production
```

Server starts at: `http://localhost:5000`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/interview/start` | Start a new interview session |
| `POST` | `/api/interview/answer` | Submit your answer to the current question |
| `GET`  | `/api/interview/session/:id` | Get session state + full chat history |
| `GET`  | `/api/interview/report/:id` | Get the final interview report (when completed) |
| `DELETE` | `/api/interview/session/:id` | Delete a session |
| `GET`  | `/api/interview/sessions` | List all active sessions |

---

## Example Flow

### 1. Start Interview
```bash
curl -X POST http://localhost:5000/api/interview/start \
  -H "Content-Type: application/json" \
  -d '{"role":"Frontend Engineer","difficulty":"medium","topic":"React & JavaScript","maxQuestions":3}'
```

**Response:**
```json
{
  "success": true,
  "sessionId": "abc-123",
  "message": "Hi! I'm Alex, your interviewer today. Let's get started! \n\nFirst question: Can you explain the difference between `==` and `===` in JavaScript?",
  "questionNumber": 1,
  "totalQuestions": 3
}
```

### 2. Submit Answer
```bash
curl -X POST http://localhost:5000/api/interview/answer \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"abc-123","answer":"== checks value only, === checks value and type."}'
```

**Response:**
```json
{
  "success": true,
  "message": "Good! That's the core difference. You could also mention type coercion. \n\nNext question: What is the Virtual DOM and why does React use it?",
  "questionNumber": 2,
  "totalQuestions": 3,
  "completed": false
}
```

### 3. Get Report (after all answers)
```bash
curl http://localhost:5000/api/interview/report/abc-123
```

**Response:**
```json
{
  "success": true,
  "role": "Frontend Engineer",
  "report": {
    "overallScore": 78,
    "grade": "B",
    "summary": "Solid fundamentals with room to improve on advanced concepts.",
    "strengths": ["Clear communication", "Good JS basics"],
    "improvements": ["Elaborate more on React internals"],
    "recommendation": "Consider",
    "breakdown": [...]
  }
}
```

---

## Body Parameters

### POST `/api/interview/start`
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `role` | string | ✅ | — | Job role (e.g. "Backend Engineer") |
| `topic` | string | ✅ | — | Topic (e.g. "Node.js & Express") |
| `difficulty` | string | ❌ | `medium` | `easy` / `medium` / `hard` |
| `maxQuestions` | number | ❌ | `5` | Number of questions (1–10) |

### POST `/api/interview/answer`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | string | ✅ | Session ID from `/start` |
| `answer` | string | ✅ | Your answer to the current question |

---

## Project Structure
```
inter/
├── src/
│   ├── config/
│   │   └── gemini.js           # Gemini client + system prompt builder
│   ├── controllers/
│   │   └── interviewController.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── routes/
│   │   └── interview.js
│   ├── services/
│   │   └── interviewService.js  # Core interview logic & session store
│   ├── app.js                   # Express app config
│   └── server.js                # Entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```
