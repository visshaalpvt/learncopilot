import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
    ChevronDown,
    BookOpen,
    FileText,
    Code,
    GraduationCap,
    Clock,
    Zap,
    AlertTriangle,
    RefreshCw,
    BarChart3,
    TrendingUp,
    Bot,
    Database,
    Bell,
    Settings,
    LogOut,
    User,
    Home
} from 'lucide-react';
import AIChat from './AIChat';
import './Layout.css';

function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const userMenuRef = useRef(null);

    const navGroups = [
        {
            label: 'Dashboard',
            path: '/app/dashboard',
            icon: Home,
            single: true
        },
        {
            label: 'Learn',
            icon: BookOpen,
            items: [
                { path: '/app/theory', icon: BookOpen, label: 'Theory Mode' },
                { path: '/app/practical', icon: Code, label: 'Practical Mode' },
                { path: '/app/syllabus', icon: FileText, label: 'Syllabus' },
            ]
        },
        {
            label: 'Exams',
            icon: GraduationCap,
            items: [
                { path: '/app/exam-prep', icon: GraduationCap, label: 'Exam Prep' },
                { path: '/app/tomorrow-exam', icon: Clock, label: 'Tomorrow Exam' },
                { path: '/app/adaptive-exam-ai', icon: Zap, label: 'Adaptive Exam AI' },
            ]
        },
        {
            label: 'Practice',
            icon: RefreshCw,
            items: [
                { path: '/app/question-bank', icon: Database, label: 'Question Bank' },
                { path: '/app/revision-queue', icon: RefreshCw, label: 'Revision Queue' },
                { path: '/app/weakness', icon: AlertTriangle, label: 'Weakness Analysis' },
            ]
        },
        {
            label: 'Insights',
            icon: BarChart3,
            items: [
                { path: '/app/analytics', icon: BarChart3, label: 'Analytics' },
                { path: '/app/progress', icon: TrendingUp, label: 'Progress' },
            ]
        },
        {
            label: 'AI Tools',
            icon: Bot,
            items: [
                { path: '/app/edu-agents', icon: Bot, label: 'Pro AI Agents' },
            ]
        },
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const toggleDropdown = (label) => {
        setActiveDropdown(activeDropdown === label ? null : label);
    };

    return (
        <div className="app-layout">
            {/* Top Navigation */}
            <header className="top-nav">
                <div className="nav-inner">
                    {/* Logo */}
                    <NavLink to="/app/dashboard" className="nav-brand">
                        <span className="brand-icon">🎓</span>
                        <span className="brand-text">LearnCopilot</span>
                    </NavLink>

                    {/* Primary Navigation */}
                    <nav className="nav-primary" ref={dropdownRef}>
                        {navGroups.map((group) => (
                            group.single ? (
                                <NavLink
                                    key={group.label}
                                    to={group.path}
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <group.icon size={16} />
                                    {group.label}
                                </NavLink>
                            ) : (
                                <div key={group.label} className="nav-dropdown">
                                    <button
                                        className={`nav-link ${activeDropdown === group.label ? 'active' : ''}`}
                                        onClick={() => toggleDropdown(group.label)}
                                    >
                                        <group.icon size={16} />
                                        {group.label}
                                        <ChevronDown size={14} className={`chevron ${activeDropdown === group.label ? 'open' : ''}`} />
                                    </button>
                                    {activeDropdown === group.label && (
                                        <div className="dropdown-menu">
                                            {group.items.map((item) => (
                                                <NavLink
                                                    key={item.path}
                                                    to={item.path}
                                                    className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                                                    onClick={() => setActiveDropdown(null)}
                                                >
                                                    <item.icon size={16} />
                                                    {item.label}
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        ))}
                    </nav>

                    {/* Right Side Actions */}
                    <div className="nav-actions">
                        <button className="nav-icon-btn" aria-label="Notifications">
                            <Bell size={20} />
                        </button>

                        <div className="user-menu" ref={userMenuRef}>
                            <button
                                className="user-trigger"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                            >
                                <div className="user-avatar">
                                    {user?.full_name?.[0] || user?.username?.[0] || 'U'}
                                </div>
                                <ChevronDown size={14} className={`chevron ${userMenuOpen ? 'open' : ''}`} />
                            </button>
                            {userMenuOpen && (
                                <div className="user-dropdown">
                                    <div className="user-info">
                                        <div className="user-avatar lg">
                                            {user?.full_name?.[0] || user?.username?.[0] || 'U'}
                                        </div>
                                        <div className="user-details">
                                            <span className="user-name">{user?.full_name || user?.username}</span>
                                            <span className="user-email">{user?.email}</span>
                                        </div>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <NavLink
                                        to="/app/settings"
                                        className="dropdown-item"
                                        onClick={() => setUserMenuOpen(false)}
                                    >
                                        <Settings size={16} />
                                        Settings
                                    </NavLink>
                                    <button className="dropdown-item danger" onClick={handleLogout}>
                                        <LogOut size={16} />
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <div className="content-container">
                    <Outlet />
                </div>
            </main>

            {/* AI Chat Assistant */}
            <AIChat />
        </div>
    );
}

export default Layout;
