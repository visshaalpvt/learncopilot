# 🚀 Learning Copilot - Deployment Guide

## ✅ Pre-Deployment Checklist

### Backend Fixes Applied
- [x] Fixed bcrypt version (4.0.1) - prevents password hashing errors
- [x] Fixed CORS configuration - allows frontend communication
- [x] JWT authentication working - secure login/register
- [x] All API endpoints tested and working
- [x] Database (SQLite) functioning correctly
- [x] Progress tracking confirmed working

### Frontend Verified
- [x] All routes working - no blank pages
- [x] Authentication flow complete
- [x] Theory Mode buttons functional
- [x] Progress updates in real-time
- [x] Mock AI service integrated
- [x] Responsive design implemented

---

## 📦 Deployment Steps

### 1. Backend Deployment (Render)

#### A. Prepare Backend
```bash
cd backend
```

#### B. Create `render.yaml` (if using Blueprint)
```yaml
services:
  - type: web
    name: learning-copilot-api
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: SECRET_KEY
        generateValue: true
      - key: ALGORITHM
        value: HS256
      - key: ACCESS_TOKEN_EXPIRE_MINUTES
        value: 43200
```

#### C. Manual Render Setup
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** learning-copilot-api
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   - `SECRET_KEY` (generate random string)
   - `ALGORITHM` = `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES` = `43200`
6. Deploy!

#### D. Note Your Backend URL
```
Example: https://learning-copilot-api.onrender.com
```

---

### 2. Frontend Deployment (Vercel)

#### A. Update CORS in Backend
Before deploying frontend, update `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-vercel-app.vercel.app",  # Add your Vercel URL
        "http://localhost:5173"  # Keep for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

#### B. Create `.env` in Frontend
```env
VITE_API_URL=https://learning-copilot-api.onrender.com
```

#### C. Update `frontend/src/api.js`
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    // ... rest of config
});
```

#### D. Deploy to Vercel
```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

Or use Vercel Dashboard:
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add Environment Variable:
   - `VITE_API_URL` = `https://learning-copilot-api.onrender.com`
6. Deploy!

---

## 🔐 Security Notes

### Production Environment Variables

**Backend `.env`:**
```env
SECRET_KEY=<generate-strong-random-key-min-32-chars>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
```

Generate secret key:
```python
import secrets
print(secrets.token_urlsafe(32))
```

### CORS Security
After deployment, update CORS to ONLY allow your production frontend:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-actual-vercel-url.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🧪 Post-Deployment Testing

### Test Authentication
1. Visit your deployed frontend
2. Register a new account
3. Verify auto-redirect to dashboard
4. Logout and login again

### Test Theory Mode
1. Navigate to Theory Mode
2. Select a topic
3. Click "Mark as Completed"
4. Click "I'm Confused"
5. Check Dashboard - verify progress updated
6. Check Progress page - verify badges shown

### Test All Pages
- [ ] Dashboard loads with stats
- [ ] Syllabus page accessible
- [ ] Theory Mode working
- [ ] Practical Mode code editor functional
- [ ] Exam Prep displays content
- [ ] Progress page shows data
- [ ] Settings displays user info
- [ ] AI Chat button appears and works

---

## 📊 Database Migration (Production)

If you need to migrate to PostgreSQL on Render:

### 1. Add PostgreSQL Database on Render
1. Create new PostgreSQL database
2. Note connection URL

### 2. Update Backend Dependencies
Add to `requirements.txt`:
```
psycopg2-binary==2.9.9
```

### 3. Update Database URL
In `backend/app/database.py`:
```python
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./learning_copilot.db"
)

# Fix for Render PostgreSQL URL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
```

### 4. Add Environment Variable on Render
```
DATABASE_URL=<your-postgresql-connection-url>
```

---

## 🐛 Troubleshooting

### CORS Errors
- Ensure backend CORS includes your exact Vercel URL
- Check for trailing slashes
- Verify `allow_credentials=True`

### Authentication Issues
- Verify SECRET_KEY is set in backend environment
- Check JWT token expiry time
- Ensure API_URL is correct in frontend

### Database Issues
- SQLite works for small scale
- Migrate to PostgreSQL for production
- Ensure database tables created on startup

### Button Not Working
- Clear browser cache and localStorage
- Check API endpoints in Network tab
- Verify backend logs for errors

---

## 📈 Performance Optimization

### Frontend
```bash
cd frontend
npm run build
```
Optimizations already in place:
- Code splitting
- Minification
- Tree shaking
- Lazy loading

### Backend
Add to Render:
- Instance Size: Free tier OK for demo
- Auto-deploy: Enable for main branch
- Health Check Path: `/health`

---

## ✨ Features Summary

### Currently Working
✅ User Registration & Login  
✅ JWT Authentication  
✅ Protected Routes  
✅ Dashboard with AI Insights  
✅ Theory Mode with Interactive Buttons  
✅ Practical Mode with Code Analysis  
✅ Exam Preparation  
✅ Progress Tracking  
✅ Weakness Analysis  
✅ Mock AI Service (No External APIs)  
✅ Global AI Chat  
✅ Responsive Design  

### Ready for Production
✅ No broken routes  
✅ No empty pages  
✅ All features functional  
✅ Error handling in place  
✅ Clean, professional UI  
✅ Mobile responsive  

---

## 🎯 Final Checklist

Before going live:

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set
- [ ] CORS configured for production
- [ ] All pages tested
- [ ] Authentication working
- [ ] Progress tracking verified
- [ ] Mobile responsive checked
- [ ] No console errorsCheck
- [ ] No broken links

---

## 🚀 You're Ready to Deploy!

Your Learning Copilot application is production-ready with:
- Secure authentication
- Full feature set
- AI-powered experience (without AI APIs!)
- Beautiful, responsive UI
- Complete progress tracking
- Working button interactions

**Happy Deploying! 🎉**
