import { NavLink, Outlet } from 'react-router-dom';
import { Home, BookOpen, FileText, Code, GraduationCap, TrendingUp, Settings, AlertTriangle, RefreshCw, BarChart3, Clock, Zap, Bot, Database } from 'lucide-react';
import AIChat from './AIChat';

function Layout() {
    const navItems = [
        { path: '/app/dashboard', icon: Home, label: 'Dashboard' },
        { path: '/app/syllabus', icon: FileText, label: 'Syllabus' },
        { path: '/app/theory', icon: BookOpen, label: 'Theory Mode' },
        { path: '/app/practical', icon: Code, label: 'Practical Mode' },
        { path: '/app/exam-prep', icon: GraduationCap, label: 'Exam Prep' },
        { path: '/app/tomorrow-exam', icon: Clock, label: 'Tomorrow Exam Mode' },
        { path: '/app/adaptive-exam-ai', icon: Zap, label: 'Adaptive Exam AI' },
        { path: '/app/weakness', icon: AlertTriangle, label: 'Weakness Analysis' },
        { path: '/app/revision-queue', icon: RefreshCw, label: 'Revision Queue' },
        { path: '/app/edu-agents', icon: Bot, label: 'Pro AI Agents' },
        { path: '/app/question-bank', icon: Database, label: 'Question Bank AI' },
        { path: '/app/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/app/progress', icon: TrendingUp, label: 'Progress' },
        { path: '/app/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="app-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <div className="logo">📚 Learning Copilot</div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>

            {/* AI Chat Assistant */}
            <AIChat />
        </div>
    );
}

export default Layout;

