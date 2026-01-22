import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Syllabus from './pages/Syllabus';
import TheoryMode from './pages/TheoryMode';
import PracticalMode from './pages/PracticalMode';
import ExamPrep from './pages/ExamPrep';
import TomorrowExam from './pages/TomorrowExam';
import AdaptiveExamAI from './pages/AdaptiveExamAI';
import WeaknessAnalysis from './pages/WeaknessAnalysis';
import RevisionQueue from './pages/RevisionQueue';
import Analytics from './pages/Analytics';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import EduAgents from './pages/EduAgents';
import QuestionBank from './pages/QuestionBank';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected Routes */}
          <Route
            path="/app"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="syllabus" element={<Syllabus />} />
            <Route path="theory" element={<TheoryMode />} />
            <Route path="practical" element={<PracticalMode />} />
            <Route path="exam-prep" element={<ExamPrep />} />
            <Route path="tomorrow-exam" element={<TomorrowExam />} />
            <Route path="adaptive-exam-ai" element={<AdaptiveExamAI />} />
            <Route path="weakness" element={<WeaknessAnalysis />} />
            <Route path="revision-queue" element={<RevisionQueue />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="edu-agents" element={<EduAgents />} />
            <Route path="question-bank" element={<QuestionBank />} />
            <Route path="progress" element={<Progress />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Legacy routes redirect to new /app paths */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" />} />
          <Route path="/syllabus" element={<Navigate to="/app/syllabus" />} />
          <Route path="/theory" element={<Navigate to="/app/theory" />} />
          <Route path="/practical" element={<Navigate to="/app/practical" />} />
          <Route path="/exam-prep" element={<Navigate to="/app/exam-prep" />} />
          <Route path="/tomorrow-exam" element={<Navigate to="/app/tomorrow-exam" />} />
          <Route path="/adaptive-exam-ai" element={<Navigate to="/app/adaptive-exam-ai" />} />
          <Route path="/weakness" element={<Navigate to="/app/weakness" />} />
          <Route path="/revision-queue" element={<Navigate to="/app/revision-queue" />} />
          <Route path="/analytics" element={<Navigate to="/app/analytics" />} />
          <Route path="/edu-agents" element={<Navigate to="/app/edu-agents" />} />
          <Route path="/question-bank" element={<Navigate to="/app/question-bank" />} />
          <Route path="/progress" element={<Navigate to="/app/progress" />} />
          <Route path="/settings" element={<Navigate to="/app/settings" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

