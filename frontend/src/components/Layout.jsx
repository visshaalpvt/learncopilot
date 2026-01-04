import { NavLink, Outlet } from 'react-router-dom';
import { Home, BookOpen, FileText, Code, GraduationCap, TrendingUp, Settings, AlertTriangle, RefreshCw, BarChart3, Clock, Zap, Bot } from 'lucide-react';
import AIChat from './AIChat';

function Layout() {
    const navItems = [
        { path: '/dashboard', icon: Home, label: 'Dashboard' },
        { path: '/syllabus', icon: FileText, label: 'Syllabus' },
        { path: '/theory', icon: BookOpen, label: 'Theory Mode' },
        { path: '/practical', icon: Code, label: 'Practical Mode' },
        { path: '/exam-prep', icon: GraduationCap, label: 'Exam Prep' },
        { path: '/tomorrow-exam', icon: Clock, label: 'Tomorrow Exam Mode' },
        { path: '/adaptive-exam-ai', icon: Zap, label: 'Adaptive Exam AI' },
        { path: '/weakness', icon: AlertTriangle, label: 'Weakness Analysis' },
        { path: '/revision-queue', icon: RefreshCw, label: 'Revision Queue' },
        { path: '/edu-agents', icon: Bot, label: 'Pro AI Agents' },
        { path: '/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/progress', icon: TrendingUp, label: 'Progress' },
        { path: '/settings', icon: Settings, label: 'Settings' },
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

