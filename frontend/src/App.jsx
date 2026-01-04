import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" />} />
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
            <Route path="progress" element={<Progress />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
