# 🎓 LearnCopilot - Personalized Learning Platform

<div align="center">

![LearnCopilot](https://img.shields.io/badge/LearnCopilot-v1.0.0-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**An intelligent, AI-powered learning platform for college students**  
*Built without any external AI APIs using rule-based intelligence*

[🚀 Live Demo](#deployment) • [📖 Documentation](#features) • [⚡ Quick Start](#quick-start)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Security](#-security)
- [Future Enhancements](#-future-enhancements)

---

## 🌟 Overview

**LearnCopilot** is a unified, personalized learning platform designed to help college students master their courses efficiently. It intelligently separates "Theory Mode" for conceptual understanding and "Practical Mode" for hands-on labs, with features like "Tomorrow's Exam Focus" and adaptive assessments.

### Key Differentiators

| Feature | Description |
|---------|-------------|
| 🧠 **No External AI APIs** | 100% functional using rule-based logic and mock data |
| 📚 **Dual Learning Modes** | Separate Theory & Practical environments |
| 📝 **Exam-Centric** | "Tomorrow's Exam Focus" for last-minute preparation |
| 📊 **Smart Progress Tracking** | Real-time weakness analysis and recommendations |
| 🎨 **Modern UI/UX** | Clean SaaS-style interface with animations |

---

## 🎯 Problem Statement

In the current educational landscape, students often struggle to:
- Bridge the gap between theoretical concepts and practical application
- Identify their weak areas before exams
- Get personalized learning recommendations
- Track their progress effectively across multiple topics

Traditional learning management systems lack personalization and fail to adapt to a student's impending deadlines, such as exams.

---

## 💡 Solution

LearnCopilot provides:

1. **Mode-Specific Learning** - Distinct environments for Theory and Practical work
2. **Exam-Centric Optimization** - Specialized "Tomorrow's Exam Focus" mode
3. **Intelligent Recommendations** - Rule-based AI that suggests what to study next
4. **Weakness Identification** - Automatic tracking of confused topics
5. **Scalable Architecture** - Works with or without AI layers

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           LEARNCOPILOT ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                     React + Vite (Frontend)                          │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │ │
│  │  │  Login   │ │Dashboard │ │  Theory  │ │Practical │ │ Exam Prep │  │ │
│  │  │ Register │ │          │ │   Mode   │ │   Mode   │ │           │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └───────────┘  │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────────┐│ │
│  │  │ Syllabus │ │ Progress │ │ Settings │ │       Global AI Chat     ││ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────────────┘│ │
│  │                                                                      │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐│ │
│  │  │               MockAI Service (Rule-Based Intelligence)          ││ │
│  │  │  • explainTopic()  • analyzeCode()  • getRecommendations()      ││ │
│  │  └─────────────────────────────────────────────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                    │                                      │
│                            Axios HTTP Client                              │
│                          (JWT Token in Headers)                           │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY LAYER                               │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    FastAPI Application                               │ │
│  │  ┌───────────────────────────────────────────────────────────────┐  │ │
│  │  │                    CORS Middleware                             │  │ │
│  │  │         (Allows cross-origin requests from frontend)           │  │ │
│  │  └───────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         API Routers                                  │ │
│  │                                                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │ │
│  │  │   /auth      │  │  /syllabus   │  │       /theory            │   │ │
│  │  │  • register  │  │  • upload    │  │  • get-content           │   │ │
│  │  │  • login     │  │  • list      │  │  • topics                │   │ │
│  │  │  • me        │  │  • get/{id}  │  │                          │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │ │
│  │                                                                      │ │
│  │  ┌──────────────┐  ┌──────────────────────────────────────────────┐ │ │
│  │  │  /practical  │  │              /progress                       │ │ │
│  │  │  • analyze   │  │  • update (Mark Complete/Confused)           │ │ │
│  │  │  • languages │  │  • dashboard (Stats)                         │ │ │
│  │  └──────────────┘  │  • all (All Records)  • weak-areas           │ │ │
│  │                    └──────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                    │                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    Authentication Layer                              │ │
│  │  ┌───────────────────┐  ┌────────────────────────────────────────┐  │ │
│  │  │   JWT Handler     │  │          Password Hashing              │  │ │
│  │  │  • Token Creation │  │  • bcrypt (v4.0.1)                     │  │ │
│  │  │  • Token Verify   │  │  • Salt + Hash                         │  │ │
│  │  │  • Token Decode   │  │  • Secure Comparison                   │  │ │
│  │  └───────────────────┘  └────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                      SQLAlchemy ORM                                  │ │
│  │  ┌───────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Database Models                             │  │ │
│  │  │  ┌─────────┐  ┌──────────┐  ┌──────────┐                      │  │ │
│  │  │  │  User   │  │ Syllabus │  │ Progress │                      │  │ │
│  │  │  │─────────│  │──────────│  │──────────│                      │  │ │
│  │  │  │ id      │  │ id       │  │ id       │                      │  │ │
│  │  │  │username │  │ user_id  │  │ user_id  │                      │  │ │
│  │  │  │ email   │  │course_nm │  │topic_id  │                      │  │ │
│  │  │  │password │  │ content  │  │completed │                      │  │ │
│  │  │  │full_name│  │ parsed   │  │confused  │                      │  │ │
│  │  │  └─────────┘  └──────────┘  └──────────┘                      │  │ │
│  │  └───────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                    │                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │        SQLite (Development) / PostgreSQL (Production)                │ │
│  │                    learning_copilot.db                               │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                      KNOWLEDGE BASE (Mock AI Data)                        │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                     mock_data.json                                   │ │
│  │  • Topic Definitions      • Real-world Examples                      │ │
│  │  • Common Mistakes        • Exam Answers (2/5/10 marks)              │ │
│  │  • Interview Questions    • Code Error Patterns                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION FLOW                           │
└────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐         ┌─────────┐         ┌─────────┐
    │  User   │────────▶│ Browser │────────▶│ React   │
    └─────────┘         └─────────┘         │   App   │
                                            └────┬────┘
                                                 │
                        ┌────────────────────────┼────────────────────────┐
                        │                        │                        │
                        ▼                        ▼                        ▼
                 ┌────────────┐          ┌────────────┐          ┌────────────┐
                 │   Login/   │          │   Study    │          │  Track     │
                 │  Register  │          │  Content   │          │ Progress   │
                 └─────┬──────┘          └─────┬──────┘          └─────┬──────┘
                       │                       │                       │
                       ▼                       ▼                       ▼
              ┌─────────────────────────────────────────────────────────────┐
              │                     FastAPI Backend                          │
              │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
              │  │ JWT Auth     │  │ Content Gen  │  │ Progress Track   │   │
              │  │ • Verify     │  │ • Mock AI    │  │ • Complete/      │   │
              │  │ • Generate   │  │ • Templates  │  │   Confused       │   │
              │  └──────────────┘  └──────────────┘  └──────────────────┘   │
              └─────────────────────────┬───────────────────────────────────┘
                                        │
                                        ▼
                              ┌───────────────────┐
                              │     Database      │
                              │   (SQLite/PSQL)   │
                              └───────────────────┘
```

---

## 🛠 Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI Library |
| Vite | 5+ | Build Tool & Dev Server |
| React Router | 6 | Client-side Routing |
| Framer Motion | 11 | Smooth Animations |
| Axios | 1.6+ | HTTP Client |
| Lucide React | 0.300+ | Icon Library |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.100+ | Web Framework |
| Python | 3.11+ | Programming Language |
| SQLAlchemy | 2.0+ | ORM |
| SQLite/PostgreSQL | - | Database |
| Uvicorn | 0.24+ | ASGI Server |
| python-jose | 3.3+ | JWT Handling |
| bcrypt | 4.0.1 | Password Hashing |
| Pydantic | 2.0+ | Data Validation |

### Styling & Design
- **Custom CSS** with CSS Variables
- **Inter Font** from Google Fonts
- **Glassmorphism** effects
- **Dark Theme** SaaS-style design
- **Responsive Layout** with Grid & Flexbox

---

## ✨ Features

### 🔐 Authentication System
- **JWT-based login and registration**
- Token stored in localStorage
- Protected routes with automatic redirect
- Secure password hashing with bcrypt
- Auto-logout on token expiration

### 📊 Dashboard
| Feature | Description |
|---------|-------------|
| Overall Progress % | Calculated from completed topics |
| Exam Readiness % | Based on completion and lab confidence |
| Learning Health Score | Composite metric |
| Smart Next Action | AI suggests what to study next |
| Weakness Radar | Shows topics needing focus |
| Revision Queue | Topics not reviewed recently |
| Study Streak | Consecutive days of learning |
| AI Study Insights | Personalized recommendations |

### 📚 Syllabus Management
- Upload syllabus via text paste
- Intelligent parsing into Units → Topics
- Expandable unit view
- Quick action buttons (Learn/Practice) per topic

### 📖 Theory Mode (3-Panel Layout)
| Panel | Content |
|-------|---------|
| **Left** | Topic list navigation |
| **Center** | Definition, examples, common mistakes |
| **Right** | Exam answers (2/5/10 marks) |

**Interactive Features:**
- ✅ **Mark as Completed** → Updates progress to 100%
- ⚠️ **I'm Confused** → Flags topic for review
- 🤖 AI explanations with typing effect

### 💻 Practical Mode
- Code editor with syntax highlighting
- Language selector (Python/C)
- Rule-based error detection
- Detailed error explanations
- Hints and suggested fixes
- Lab viva questions

**Error Detection Patterns:**
- Missing colons (Python)
- Indentation issues
- Division by zero
- Index out of range
- Segmentation faults (C)

### 📝 Exam Preparation
- Important topics with frequency ratings
- Frequently asked questions
- High-weight units identification

**Tomorrow Exam Mode:**
- Most probable questions
- Fast revision notes
- Must-remember definitions
- "Do not skip" list
- AI exam guidance

### 📈 Progress Tracking
- Overall completion percentage
- Topic-wise progress with status badges
- Weak areas identification
- Labs attempted tracking
- Last activity timestamps

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** v16+ and npm
- **Python** 3.10+
- **Git**

### Installation

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/learncopilot.git
cd learncopilot
```

#### 2️⃣ Backend Setup
```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate
# OR Mac/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
✅ Backend running at: `http://localhost:8000`  
📖 API Docs at: `http://localhost:8000/docs`

#### 3️⃣ Frontend Setup
```powershell
# Open new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
✅ Frontend running at: `http://localhost:5173`

#### 4️⃣ Using Start Script (Windows)
```powershell
# From project root
./start.ps1
```

### Environment Variables

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:8000
```

**Backend (`backend/.env`):**
```env
SECRET_KEY=your_super_secret_key_here_min_32_chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
DATABASE_URL=sqlite:///./learning_copilot.db
FRONTEND_URL=http://localhost:5173
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and get JWT token |
| GET | `/auth/me` | Get current user profile |

### Syllabus
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/syllabus/upload` | Upload and parse syllabus |
| GET | `/syllabus/list` | Get user's syllabi |
| GET | `/syllabus/{id}` | Get specific syllabus |

### Theory
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/theory/get-content` | Get topic theory content |
| GET | `/theory/topics` | List available topics |

### Practical
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/practical/analyze` | Analyze code for errors |
| GET | `/practical/languages` | Get supported languages |

### Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/progress/update` | Update topic progress |
| GET | `/progress/dashboard` | Get dashboard stats |
| GET | `/progress/all` | Get all progress records |
| GET | `/progress/weak-areas` | Get weak topics |
| GET | `/progress/topic/{id}` | Get specific topic progress |

---

## ☁️ Deployment

### Backend (Render)

1. **Create Web Service** on [render.com](https://render.com)
2. **Connect GitHub repository**
3. **Configure:**
   - Name: `learning-copilot-api`
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Add Environment Variables:**
   - `SECRET_KEY` (generate random 32+ char string)
   - `ALGORITHM` = `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES` = `43200`
5. **Deploy!**

### Frontend (Vercel)

1. **Import project** to [vercel.com](https://vercel.com)
2. **Configure:**
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Add Environment Variable:**
   - `VITE_API_URL` = Your Render backend URL
4. **Update Backend CORS** with your Vercel URL
5. **Deploy!**

### Post-Deployment Checklist
- [ ] Backend deployed and health check passing
- [ ] Frontend deployed and loading
- [ ] CORS configured for production
- [ ] Registration/Login working
- [ ] Theory Mode buttons functional
- [ ] Progress tracking verified

---

## 🧪 Testing

### Testing Checklist

#### Authentication
- [ ] Register new account
- [ ] Auto-redirect to Dashboard
- [ ] Login with credentials
- [ ] Logout functionality

#### Theory Mode
- [ ] Topic selection works
- [ ] Content loads with AI explanation
- [ ] "Mark as Completed" updates progress
- [ ] "I'm Confused" flags for review

#### Dashboard
- [ ] Stats load correctly
- [ ] Progress percentage accurate
- [ ] AI insights displayed

#### All Pages
- [ ] No broken routes
- [ ] No empty pages
- [ ] All buttons clickable

### API Testing
```bash
# Test registration
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123","full_name":"Test User"}'

# Test login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=test123"
```

---

## 🔒 Security

### Implemented Security Features

| Feature | Implementation |
|---------|----------------|
| **Password Hashing** | bcrypt with salt |
| **Authentication** | JWT tokens (30-day expiry) |
| **Protected Routes** | Frontend route guards |
| **CORS Policy** | Strict allow-origins |
| **Input Validation** | Pydantic schemas |
| **SQL Injection Prevention** | SQLAlchemy ORM |

### Security Best Practices
- Never expose SECRET_KEY
- Use HTTPS in production
- Restrict CORS to your domain only
- Regularly rotate JWT secrets
- Keep dependencies updated

---

## 🔮 Future Enhancements

| Feature | Description |
|---------|-------------|
| 🤖 **AI Integration** | Connect to LLMs (Gemini/OpenAI) for dynamic content |
| 👥 **Collaborative Study** | WebSockets for multiplayer quiz battles |
| 🎙️ **Voice Learning** | Audio summaries for auditory learners |
| 📱 **Mobile App** | React Native port |
| 🎮 **Gamification** | XP points, badges, leaderboards |
| 📇 **Flashcards** | Spaced repetition with SM-2 algorithm |
| ⏱️ **Pomodoro Timer** | Built-in focus sessions |
| 📊 **Advanced Analytics** | Learning pattern analysis |

---

## 📁 Project Structure

```
learncopilot/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── syllabus.py      # Syllabus management
│   │   │   ├── theory.py        # Theory mode content
│   │   │   ├── practical.py     # Code analysis
│   │   │   └── progress.py      # Progress tracking
│   │   ├── main.py              # FastAPI app + CORS
│   │   ├── database.py          # Database config
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── auth.py              # JWT utilities
│   │   ├── dependencies.py      # Auth dependencies
│   │   └── mock_data.json       # Knowledge base
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Syllabus.jsx
│   │   │   ├── TheoryMode.jsx
│   │   │   ├── PracticalMode.jsx
│   │   │   ├── ExamPrep.jsx
│   │   │   ├── Progress.jsx
│   │   │   └── Settings.jsx
│   │   ├── components/
│   │   │   └── Layout.jsx       # Sidebar + main content
│   │   ├── services/
│   │   │   └── mockAI.js        # Rule-based AI
│   │   ├── App.jsx              # Routes & auth provider
│   │   ├── main.jsx             # Entry point
│   │   ├── AuthContext.jsx      # Auth state management
│   │   ├── api.js               # Axios instance
│   │   └── index.css            # Global styles
│   ├── package.json
│   └── .env
│
├── screenshots/                  # Application screenshots
├── start.ps1                     # Windows startup script
└── README.md                     # This file
```

---

## 🤖 Mock AI System

The application provides an **AI-powered experience without using external AI APIs**:

### How It Works

1. **Rule-Based Logic**
   - Pattern matching for topic recognition
   - Keyword extraction from code
   - Error detection with regex
   - Predefined knowledge base

2. **Intelligent Heuristics**
   - Progress-based recommendations
   - Time-based revision suggestions
   - Weakness identification algorithms
   - Exam probability calculations

3. **Realistic Simulation**
   - Typing effects (character-by-character)
   - Processing delays (500-2000ms)
   - Context-aware responses
   - Natural language templates

### MockAI Functions
```javascript
explainTopic(topic)        // Contextual explanation
analyzeCode(code, lang)    // Error detection & fixes
getExamGuidance()          // Study plan
getRecommendations(prog)   // Personalized tips
chat(message)              // Conversational responses
```

---

## 🐛 Troubleshooting

### Backend Issues

**Backend won't start:**
```powershell
# Check Python version
python --version  # Should be 3.10+

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check port availability
netstat -an | findstr "8000"
```

**bcrypt errors:**
```powershell
pip install bcrypt==4.0.1 --force-reinstall
```

### Frontend Issues

**Frontend won't start:**
```powershell
# Check Node version
node --version  # Should be 16+

# Clear cache and reinstall
rm -rf node_modules
npm install
```

### Common Fixes

| Issue | Solution |
|-------|----------|
| CORS errors | Ensure `FRONTEND_URL` in backend matches frontend URL |
| 401 Unauthorized | Clear localStorage and login again |
| Database errors | Delete `learning_copilot.db` and restart backend |
| Blank pages | Check browser console for errors |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Contributors

| Role | Description |
|------|-------------|
| **Developer** | Full-stack implementation |
| **Designer** | UI/UX design |
| **Tester** | Quality assurance |

---

## 🙏 Acknowledgments

- **FastAPI** for the excellent Python web framework
- **React** team for the powerful UI library
- **Vite** for the blazing-fast build tool
- **Render & Vercel** for easy deployment

---

<div align="center">

**Built with ❤️ for College Students**

[⬆ Back to Top](#-learncopilot---personalized-learning-platform)

</div>
