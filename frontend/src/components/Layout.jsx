import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
    ChevronDown, BookOpen, Brain, Target, Zap, TrendingUp,
    Bell, Settings, LogOut, Home, Upload, Mic, Briefcase,
    Users, Shield, ClipboardList, BarChart3, MessageSquare,
    FileText, Award, Gamepad2, Calendar, Map, Bot, Sparkles
} from 'lucide-react';
import AIChat from './AIChat';
import './Layout.css';

function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const userMenuRef = useRef(null);

    const role = user?.role || 'student';
    const mode = user?.mode || 'college';

    // Student Navigation - streamlined, premium, uncluttered
    const studentNav = [
        { section: 'CORE STUDY' },
        { label: 'Dashboard', path: '/app/dashboard', icon: Home },
        { label: 'Upload Syllabus', path: '/app/syllabus', icon: Upload },
        { label: 'AI Theory Tutor', path: '/app/theory', icon: Brain },
        { label: 'Study Roadmap', path: '/app/study-roadmap', icon: Map },
        { section: 'PRACTICE & LABS' },
        { label: 'Adaptive Quiz & Prep', path: '/app/adaptive-exam-ai', icon: Zap },
        { label: 'Practical Code Lab', path: '/app/practical', icon: Gamepad2 },
        { label: 'Question Bank', path: '/app/question-bank', icon: FileText },
        { section: 'AI INTELLIGENCE' },
        { label: 'AI Agents Hub', path: '/app/edu-agents', icon: Bot },
        { label: 'Communication Lab', path: '/app/communication-lab', icon: Mic },
        ...(mode === 'college' ? [
            { label: 'Career Hub', path: '/app/career', icon: Briefcase },
        ] : []),
        { section: 'ANALYTICS' },
        { label: 'Mastery & Progress', path: '/app/progress', icon: Award },
        { section: '' },
        { label: 'Settings', path: '/app/settings', icon: Settings },
    ];

    const teacherNav = [
        { section: 'DASHBOARD' },
        { label: 'Overview', path: '/app/teacher', icon: Home },
        { section: 'MANAGE' },
        { label: 'Create Test', path: '/app/teacher', icon: ClipboardList },
        { label: 'Assignments', path: '/app/teacher', icon: FileText },
        { label: 'Student List', path: '/app/teacher', icon: Users },
        { section: 'AI TOOLS' },
        { label: 'Lesson Plan AI', path: '/app/teacher', icon: Sparkles },
        { label: 'Class Analytics', path: '/app/analytics', icon: BarChart3 },
        { section: '' },
        { label: 'Settings', path: '/app/settings', icon: Settings },
    ];

    const parentNav = [
        { section: 'DASHBOARD' },
        { label: 'Child Progress', path: '/app/parent', icon: Home },
        { section: 'MONITOR' },
        { label: 'Growth Dashboard', path: '/app/parent', icon: TrendingUp },
        { label: 'Alerts', path: '/app/parent', icon: Bell },
        { label: 'Messages', path: '/app/parent', icon: MessageSquare },
        { section: '' },
        { label: 'Settings', path: '/app/settings', icon: Settings },
    ];

    const adminNav = [
        { section: 'DASHBOARD' },
        { label: 'Platform Stats', path: '/app/admin', icon: Home },
        { section: 'MANAGE' },
        { label: 'Users', path: '/app/admin', icon: Users },
        { label: 'Courses', path: '/app/admin', icon: BookOpen },
        { section: 'ANALYTICS' },
        { label: 'Engagement', path: '/app/admin', icon: BarChart3 },
        { label: 'Security', path: '/app/admin', icon: Shield },
        { section: '' },
        { label: 'Settings', path: '/app/settings', icon: Settings },
    ];

    const navItems = role === 'teacher' ? teacherNav
        : role === 'parent' ? parentNav
            : role === 'admin' ? adminNav
                : studentNav;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Poll notifications
    useEffect(() => {
        const fetchCount = async () => {
            try {
                const { default: api } = await import('../api');
                const r = await api.get('/notifications/unread-count');
                setUnreadCount(r.data.count);
            } catch (e) { /* ignore */ }
        };
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const roleConfig = {
        student: { emoji: '🎓', label: 'Student', color: '#6366f1' },
        teacher: { emoji: '👨‍🏫', label: 'Teacher', color: '#10b981' },
        parent: { emoji: '👪', label: 'Parent', color: '#f59e0b' },
        admin: { emoji: '🛡️', label: 'Admin', color: '#ef4444' }
    }[role] || { emoji: '🎓', label: 'Student', color: '#6366f1' };

    return (
        <div className="app-layout">
            {/* Left Sidebar */}
            <aside className="sidebar">
                {/* Brand */}
                <NavLink to="/app/dashboard" className="sidebar-brand">
                    <span className="brand-icon">🎓</span>
                    <span className="brand-text">LearnCopilot</span>
                    <span className="brand-badge">AI</span>
                </NavLink>

                {/* Role Badge */}
                <div className="sidebar-role">
                    <span className="role-dot" style={{ background: roleConfig.color }}></span>
                    {roleConfig.emoji} {roleConfig.label} {mode === 'college' ? '• College' : mode === 'school' ? '• School' : ''}
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navItems.map((item, idx) => {
                        if (item.section !== undefined) {
                            if (!item.section) return <div key={idx} style={{ marginTop: 'auto' }} />;
                            return (
                                <div key={idx} className="nav-section-label">{item.section}</div>
                            );
                        }
                        return (
                            <NavLink
                                key={item.path + item.label}
                                to={item.path}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                end={item.path === '/app/dashboard' || item.path === '/app/teacher' || item.path === '/app/parent' || item.path === '/app/admin'}
                            >
                                <item.icon size={17} />
                                {item.label}
                                {item.label === 'Alerts' && unreadCount > 0 && (
                                    <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className="sidebar-footer" ref={userMenuRef}>
                    <div className="user-menu">
                        <div className="sidebar-user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                            <div className="user-avatar">
                                {user?.full_name?.[0] || user?.username?.[0] || 'U'}
                            </div>
                            <div className="sidebar-user-info">
                                <span className="sidebar-user-name">{user?.full_name || user?.username || 'User'}</span>
                                <span className="sidebar-user-email">{user?.email || ''}</span>
                            </div>
                            <ChevronDown size={14} style={{ color: '#64748b', transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'none' }} />
                        </div>

                        {userMenuOpen && (
                            <div className="user-dropdown">
                                <NavLink to="/app/settings" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                    <Settings size={15} /> Settings
                                </NavLink>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item danger" onClick={handleLogout}>
                                    <LogOut size={15} /> Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <div className="content-container">
                    <Outlet />
                </div>
            </main>

            {/* AI Chat */}
            <AIChat />
        </div>
    );
}

export default Layout;
