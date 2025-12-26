# Personalized Learning Copilot

A full-stack intelligent learning platform for college students built with React (Vite) and FastAPI.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ (available as `py` command)
- Node.js 16+ and npm

### Installation

1. **Backend Setup**
```powershell
cd backend
py -m pip install -r requirements.txt
```

2. **Frontend Setup**
```powershell
cd frontend
npm install
```

### Running the Application

**Option 1: Use the startup script (Recommended)**
```powershell
./start.ps1
```

**Option 2: Manual start**

Terminal 1 (Backend):
```powershell
cd backend
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Terminal 2 (Frontend):
```powershell
cd frontend
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📋 Features

### ✅ Authentication
- JWT-based login and registration
- Token stored in localStorage
- Protected routes
- Auto-redirect on token expiration

### ✅ Dashboard
- Overall progress percentage
- Topics completed count
- Labs attempted count
- Recent activity feed
- Quick navigation to learning modes

### ✅ Syllabus Management
- Upload syllabus via text paste
- Intelligent parsing into Units → Topics
- Expandable unit view
- Quick action buttons (Learn/Practice) per topic

### ✅ Theory Mode (3-Panel Layout)
- **Left Panel**: Topic list navigation
- **Center Panel**: 
  - Topic definition
  - Real-world examples
  - Common mistakes to avoid
  - Mark as completed/confused buttons
- **Right Panel**: Exam answers
  - 2-mark answers
  - 5-mark answers
  - 10-mark answers
  - Interview relevance tips

### ✅ Practical Mode
- Code editor with syntax highlighting
- Language selector (Python/C)
- Intelligent error detection using rule-based logic
- Detailed error explanations
- Hints and suggested fixes
- Lab viva questions
- Example code loader

### ✅ Exam Preparation
- Important topics with frequency ratings
- Frequently asked questions
- "Exam Tomorrow" checklist
- Priority-based study guide

### ✅ Progress Tracking
- Overall completion percentage
- Topic-wise progress with status badges
- Labs attempted tracking
- Weak areas identification
- Last activity timestamps

### ✅ Settings
- User profile display
- Account preferences
- Logout functionality

## 🏗️ Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database
- **SQLite**: Lightweight database
- **JWT**: Authentication
- **Pydantic**: Data validation
- **Uvicorn**: ASGI server

### Frontend
- **React 19**: UI library
- **Vite**: Build tool and dev server
- **React Router**: Navigation
- **Framer Motion**: Smooth animations
- **Axios**: HTTP client
- **Lucide React**: Icon library

### Styling
- **Custom CSS**: Professional dark theme SaaS design
- **Inter Font**: Modern typography
- **CSS Variables**: Consistent theming
- **Responsive Layout**: Grid and flexbox

## 📁 Project Structure

```
smvec/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── syllabus.py      # Syllabus management
│   │   │   ├── theory.py        # Theory mode content
│   │   │   ├── practical.py     # Code analysis
│   │   │   └── progress.py      # Progress tracking
│   │   ├── main.py              # FastAPI app
│   │   ├── database.py          # Database config
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── auth.py              # JWT utilities
│   │   ├── dependencies.py      # Auth dependencies
│   │   └── mock_data.json       # Intelligence database
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
│   │   ├── App.jsx              # Routes & auth provider
│   │   ├── main.jsx             # Entry point
│   │   ├── AuthContext.jsx      # Auth state management
│   │   ├── api.js               # Axios instance
│   │   └── index.css            # Global styles
│   ├── package.json
│   └── .env
│
└── start.ps1                     # Startup script
```

## 🧠 Intelligence System (No AI APIs)

The system uses **rule-based logic** and **mock data** to provide intelligent responses:

### Topic Content Generation
- Predefined content for common topics (Data Structures, Algorithms, OOP, DBMS, Networking)
- Fallback template for unknown topics
- Partial matching for topic name variations

### Code Error Detection
**Python:**
- Missing colons (syntax errors)
- Indentation issues
- Division by zero
- Index out of range
- Name/Type errors

**C:**
- Missing semicolons
- Uninitialized pointers (segmentation fault)
- Array bounds checking
- Division by zero

### Syllabus Parsing
- Regex-based unit detection
- Automatic topic extraction
- Structured JSON output
- Fallback for unstructured input

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Token expiration (30 days default)
- Protected API endpoints
- CORS configuration
- Input validation with Pydantic

## 🌐 Deployment

### Backend (Render)
1. Create new Web Service on Render
2. Connect your repository
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
5. Add environment variables from `.env`

### Frontend (Vercel)
1. Import project to Vercel
2. Framework Preset: Vite
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add environment variable: `VITE_API_URL=<your-backend-url>`

## 📝 Environment Variables

### Backend (.env)
```env
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
DATABASE_URL=sqlite:///./learning_copilot.db
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

## 🎨 Design Features

- **Dark Theme**: Modern, easy on the eyes
- **Smooth Animations**: Framer Motion for professional feel
- **Responsive**: Works on all screen sizes
- **Glassmorphism**: Subtle depth and layering
- **Gradient Accents**: Visual hierarchy
- **Hover Effects**: Interactive feedback
- **Progress Bars**: Visual progress tracking
- **Status Badges**: Color-coded indicators

## 🔑 Default Test Credentials

After starting the app, register a new account. The first registered user will have full access.

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get token
- `GET /auth/me` - Get current user

### Syllabus
- `POST /syllabus/upload` - Upload and parse syllabus
- `GET /syllabus/list` - Get user's syllabi
- `GET /syllabus/{id}` - Get specific syllabus

### Theory
- `POST /theory/get-content` - Get topic theory content
- `GET /theory/topics` - List available topics

### Practical
- `POST /practical/analyze` - Analyze code for errors
- `GET /practical/languages` - Get supported languages

### Progress
- `POST /progress/update` - Update topic progress
- `GET /progress/dashboard` - Get dashboard stats
- `GET /progress/all` - Get all progress records
- `GET /progress/weak-areas` - Get weak topics
- `GET /progress/topic/{id}` - Get specific topic progress

## 🐛 Troubleshooting

**Backend won't start:**
- Check Python version: `py --version` (should be 3.8+)
- Reinstall dependencies: `py -m pip install -r requirements.txt`
- Check if port 8000 is free

**Frontend won't start:**
- Check Node version: `node --version` (should be 16+)
- Delete `node_modules` and run `npm install` again
- Check if port 5173 is free

**Database errors:**
- Delete `learning_copilot.db` file
- Restart backend (database will be recreated)

**CORS errors:**
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that backend is running

## ✨ Key Highlights

✅ **No AI APIs Used** - Fully functional without external AI
✅ **Mock Intelligence** - Rule-based system feels smart
✅ **All Pages Working** - No placeholders or broken flows
✅ **Production Ready** - Clean, maintainable code
✅ **Deployment Ready** - Configured for Vercel + Render
✅ **Professional UI** - Modern SaaS design
✅ **Complete Features** - Every requirement implemented

## 🎯 Future Enhancements (Optional)

- Add more programming languages for practical mode
- Expand mock data database with more topics
- Add collaborative study features
- Implement spaced repetition algorithm
- Add flashcard system
- Export progress reports
- Add dark/light theme toggle
- Implement study streaks and gamification

---

Built with ❤️ for college students
