# 🤖 AI Quiz Generation Feature - Complete Implementation Guide

## Overview

This document provides a complete guide for the AI-powered Quiz Generation system using Google Gemini API, integrated seamlessly with your existing Quiz App.

---

## 🏗️ Architecture

### Backend Stack
- **API Framework**: Node.js/Express
- **Database**: SQLite (auto-initialized)
- **AI Provider**: Google Generative AI (Gemini 2.0 Flash)
- **Authentication**: JWT Token-based

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **UI Components**: Custom Tailwind CSS components
- **State Management**: React Hooks & Context API
- **Build Tool**: Vite

---

## 📦 Features Implemented

### 1. **AI Quiz Generation**
- Generate unique multiple-choice questions on any topic
- 3 difficulty levels: Easy, Medium, Hard
- Configurable number of questions (1-50)
- 4 options per question with one correct answer

### 2. **Quiz Submission & Scoring**
- Real-time quiz display with timer
- Question navigation grid
- Answer tracking with visual feedback
- Automatic score calculation
- Per-question analysis

### 3. **Global Leaderboard**
- Rank users by best score
- View average performance
- Track attempt history
- Sort by percentage (DESC), then time taken (ASC)

### 4. **User Statistics**
- Total quizzes attempted
- Unique topics explored
- Highest score tracking
- Average performance metrics

### 5. **Faculty Feature** (Optional)
- Create manual quizzes
- Set custom questions and answers
- Restricted to admin/faculty role

---

## 🚀 API Endpoints

### Quiz Generation
```
POST /api/quiz/generate
Headers: Authorization: Bearer {token}, Content-Type: application/json
Body: {
  "topic": "JavaScript",
  "difficulty": "medium",
  "numberOfQuestions": 10
}
Response: {
  "quizId": "uuid",
  "topic": "JavaScript",
  "difficulty": "medium",
  "totalQuestions": 10,
  "questions": [
    {
      "question": "What is...",
      "options": ["A", "B", "C", "D"]
    }
  ]
}
```

### Quiz Submission
```
POST /api/quiz/submit
Headers: Authorization: Bearer {token}
Body: {
  "quizId": "uuid",
  "topic": "JavaScript",
  "difficulty": "medium",
  "answers": [
    {"questionId": 1, "selectedAnswer": "Option A"}
  ],
  "timeTaken": 300
}
Response: {
  "attemptId": 1,
  "score": 8,
  "totalQuestions": 10,
  "percentage": 80,
  "correctAnswers": 8,
  "timeTaken": 300
}
```

### Get Leaderboard
```
GET /api/quiz/leaderboard?limit=100
Headers: Authorization: Bearer {token}
Response: [
  {
    "rank": 1,
    "userId": 1,
    "userName": "John Doe",
    "bestScore": 95,
    "averageScore": 87.5,
    "totalAttempts": 5,
    "totalTimeSpent": 2500,
    "lastAttemptAt": "2024-01-15T10:30:00Z"
  }
]
```

### Get User Statistics
```
GET /api/quiz/stats/{userId}
Headers: Authorization: Bearer {token}
Response: {
  "totalAttempts": 5,
  "uniqueTopics": 3,
  "highestScore": 95,
  "averageScore": 87.5,
  "totalTimeSpent": 2500,
  "totalCorrectAnswers": 42,
  "totalQuestionsAttempted": 50
}
```

### Get Quiz History
```
GET /api/quiz/history/{userId}?topic=JavaScript&difficulty=medium&limit=20
Headers: Authorization: Bearer {token}
Response: [
  {
    "id": 1,
    "quizId": "uuid",
    "topic": "JavaScript",
    "difficulty": "medium",
    "totalQuestions": 10,
    "correctAnswers": 8,
    "score": 8,
    "percentage": 80,
    "timeTaken": 300,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

## 🗄️ Database Schema

### ai_quiz_questions
```sql
CREATE TABLE ai_quiz_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quizId TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  question TEXT NOT NULL,
  option1 TEXT NOT NULL,
  option2 TEXT NOT NULL,
  option3 TEXT NOT NULL,
  option4 TEXT NOT NULL,
  correctAnswer TEXT NOT NULL,
  questionOrder INTEGER NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### quiz_attempts
```sql
CREATE TABLE quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  quizId TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  totalQuestions INTEGER NOT NULL,
  correctAnswers INTEGER NOT NULL,
  score REAL NOT NULL,
  percentage REAL NOT NULL,
  timeTaken INTEGER NOT NULL,
  answers TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### leaderboard_cache
```sql
CREATE TABLE leaderboard_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL UNIQUE,
  userName TEXT NOT NULL,
  totalAttempts INTEGER NOT NULL,
  bestScore REAL NOT NULL,
  averageScore REAL NOT NULL,
  bestPercentage REAL NOT NULL,
  totalTimeSpent INTEGER NOT NULL,
  lastAttemptAt DATETIME,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🔐 Environment Configuration

### Server (.env)
```bash
# Gemini API Configuration
GOOGLE_GEMINI_API_KEY=your-google-gemini-api-key-here
AI_PROVIDER=google-gemini

# Database
DB_TYPE=sqlite
DB_PATH=./config/quiz_app.db
DB_ENABLE_FOREIGN_KEYS=true

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRY=7d
```

### Client (.env.development)
```bash
VITE_API_URL=http://localhost:5000
```

---

## 🔧 Setup Instructions

### 1. Backend Setup
```bash
cd Server
npm install @google/generative-ai
# Add GOOGLE_GEMINI_API_KEY to .env
npm start
# Server runs on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd Client
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### 3. Get Google Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API Key"
3. Create a new API key
4. Add to `Server/.env` as `GOOGLE_GEMINI_API_KEY`

---

## 📄 Component Structure

### Frontend Pages
```
Client/src/pages/
├── AIQuizGeneratorPage.tsx      # Topic/Difficulty selection
├── AIQuizPage.tsx               # Quiz display & interaction
├── AIQuizResultsPage.tsx        # Results & feedback
└── AILeaderboardPage.tsx        # Global rankings

Client/src/services/
├── aiQuizService.ts             # API calls
└── config.ts                    # API configuration

Client/src/App.tsx               # Routes configuration
```

### Backend Files
```
Server/
├── server.js                    # Main server
├── routes/quiz.js               # Quiz endpoints
├── controllers/quizController.js # Business logic
├── models/quizModel.js          # Database queries
├── services/geminiService.js    # AI integration
└── config/database.js           # Database setup
```

---

## 🎯 Key Flows

### Quiz Generation Flow
```
User Input (Topic, Difficulty, Count)
    ↓
AIQuizGeneratorPage validates input
    ↓
POST /api/quiz/generate
    ↓
quizController.generateQuiz()
    ↓
geminiService.generateQuestionsWithAI()
    ↓
Google Gemini API generates questions
    ↓
quizModel.saveAIQuizQuestions() stores in DB
    ↓
Response with quiz ID & questions (no correct answers)
    ↓
Navigate to AIQuizPage with quiz data
```

### Quiz Submission Flow
```
User submits answers on AIQuizPage
    ↓
Collect answers + time taken
    ↓
POST /api/quiz/submit
    ↓
quizController.submitQuiz()
    ↓
quizModel.calculateQuizScore() - compare with DB
    ↓
quizModel.saveQuizAttempt() - store result
    ↓
quizModel.updateLeaderboardCache() - update rankings
    ↓
Response with score & percentage
    ↓
Navigate to AIQuizResultsPage with results
    ↓
Display confetti if score >= 70%
```

### Leaderboard Flow
```
AILeaderboardPage mounts
    ↓
GET /api/quiz/leaderboard?limit=100
    ↓
quizController.getLeaderboard()
    ↓
quizModel.getGlobalLeaderboard()
    ↓
Fetch from leaderboard_cache (pre-calculated)
    ↓
Sort by percentage DESC, then time ASC
    ↓
Response with ranked users
    ↓
Display leaderboard with medals (🥇🥈🥉)
```

---

## 💡 How It Works

### 1. AI Question Generation
- **Service**: `geminiService.generateQuestionsWithAI()`
- **Prompt**: Instructs Gemini to generate exactly N questions with:
  - 4 unique options per question
  - One correct answer
  - Difficulty matching (easy/medium/hard)
  - JSON format output
- **Validation**: Checks for:
  - Correct structure (question, options[], correctAnswer)
  - 4 options per question
  - No duplicate questions
  - Correct answer in options

### 2. Score Calculation
```javascript
correctAnswers = count of user answers matching DB correctAnswer
score = correctAnswers (1 point per correct answer)
percentage = (correctAnswers / totalQuestions) * 100
```

### 3. Leaderboard Caching
- After each quiz attempt, `leaderboard_cache` is updated
- Stores best score per user (not all attempts)
- Allows O(1) leaderboard retrieval
- Updated via `updateLeaderboardCache()` function

---

## 🛡️ Security Features

### Authentication
- JWT token required for all quiz endpoints
- Token verified before processing requests
- User ID extracted from token

### Input Validation
- Topic: Required, non-empty string
- Difficulty: Must be 'easy', 'medium', or 'hard'  
- Number of questions: Integer between 1-50
- Answers: Must be array of objects with questionId & selectedAnswer

### Database Security
- Foreign key constraints enabled
- Parameterized queries to prevent SQL injection
- Error messages don't leak sensitive info

### API Security
- CORS configured for frontend domain only
- Rate limiting (optional): Can be added via middleware
- Error handling prevents info disclosure

---

## 🐛 Troubleshooting

### Issue: "GOOGLE_GEMINI_API_KEY is not set"
**Solution**: 
1. Get API key from [Google AI Studio](https://aistudio.google.com/)
2. Add to `Server/.env`:
   ```bash
   GOOGLE_GEMINI_API_KEY=your-api-key-here
   ```
3. Restart server

### Issue: Quiz generation fails with timeout
**Solution**:
- Check Gemini API quota (free tier has limits)
- Try with fewer questions (5-10)
- Verify API key is valid

### Issue: Leaderboard shows no users
**Solution**:
- Ensure users have submitted quizzes
- Check `quiz_attempts` table has records
- Verify `leaderboard_cache` is populated
- Run: `SELECT * FROM leaderboard_cache;` in SQLite

### Issue: CORS error when submitting quiz
**Solution**:
1. Check backend `server.js` CORS config
2. Verify `CLIENT_URL` matches frontend URL
3. Ensure backend is running on port 5000

---

## 📊 Performance Considerations

### Optimization strategies implemented
- **Leaderboard Caching**: Pre-calculated in `leaderboard_cache` table
- **Lazy Loading**: Questions loaded one at a time
- **Database Indexing**: Set on userId in quiz_attempts
- **Question Uniqueness**: Checks in-memory during generation

### Scalability notes
- Current implementation supports thousands of users
- For millions: Consider adding database pagination
- Leaderboard cache only stores best score per user (efficient)

---

## 🔄 Integration with Existing System

The AI Quiz feature integrates seamlessly:

✅ **Authentication**: Uses existing JWT system
✅ **User Context**: Leverages current user from AuthContext
✅ **UI Components**: Uses existing Tailwind CSS setup
✅ **Database**: Adds new tables to existing SQLite database
✅ **Routing**: Added routes in App.tsx with existing patterns

No breaking changes to existing functionality!

---

## 📚 Sample Usage

### Frontend: Initiating a quiz
```typescript
import { generateQuiz } from '@/services/aiQuizService';

const handleGenerate = async () => {
  const quiz = await generateQuiz('JavaScript', 'medium', 10);
  navigate('/ai-quiz', { state: { ...quiz } });
};
```

### Backend: Custom theme setup
```javascript
// In quizService.js - Add custom topics
const TOPIC_SUGGESTIONS = [
  'JavaScript',
  'React',
  'Python',
  'Database Design',
  'Web Development',
  // Add more topics
];
```

---

## 🚀 Next Steps / Future Enhancements

1. **Advanced Filtering**
   - Filter leaderboard by topic/difficulty
   - User-specific performance metrics

2. **Achievements System**
   - Badges for milestones
   - Streak tracking

3. **Quiz Analytics**
   - Question difficulty analysis
   - User performance by topic

4. **Offline Mode**
   - Cache questions locally
   - Sync when online

5. **Mobile Optimization**
   - Responsive quiz layout
   - Touch-friendly components

6. **Export Features**
   - Download quiz results as PDF
   - Export leaderboard

---

## 📞 Support

For issues or questions:
1. Check this documentation first
2. Review error messages in browser console
3. Check server logs: `npm start` output
4. Verify environment variables in `.env` files

---

**System Status**: ✅ Production Ready

Built with ❤️ using Google Gemini AI, Node.js, React, and SQLite
