import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Code, TrendingUp, Target, ArrowRight, Sparkles } from 'lucide-react';
import api from '../api';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/progress/dashboard');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            setStats({
                total_topics: 0,
                completed_topics: 0,
                labs_attempted: 0,
                progress_percentage: 0,
                recent_activities: []
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '50vh',
                color: 'var(--text-muted)'
            }}>
                Loading...
            </div>
        );
    }

    const statCards = [
        {
            label: 'Overall Progress',
            value: `${stats.progress_percentage}%`,
            icon: TrendingUp,
        },
        {
            label: 'Topics Completed',
            value: stats.completed_topics,
            icon: BookOpen,
        },
        {
            label: 'Labs Attempted',
            value: stats.labs_attempted,
            icon: Code,
        },
        {
            label: 'Total Topics',
            value: stats.total_topics,
            icon: Target,
        },
    ];

    const quickActions = [
        {
            title: 'Theory Mode',
            description: 'Study concepts and theory',
            icon: BookOpen,
            path: '/app/theory',
            color: '#6366F1'
        },
        {
            title: 'Practical Mode',
            description: 'Practice with hands-on labs',
            icon: Code,
            path: '/app/practical',
            color: '#10B981'
        },
        {
            title: 'Exam Prep',
            description: 'Prepare for your exams',
            icon: Target,
            path: '/app/exam-prep',
            color: '#F59E0B'
        },
    ];

    return (
        <div className="fade-in">
            {/* Page Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.25rem'
                }}>
                    Dashboard
                </h1>
                <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.9375rem'
                }}>
                    Track your learning progress and continue where you left off.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="dashboard-grid">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="stat-card"
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '0.75rem'
                        }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                background: 'var(--primary-light)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <stat.icon size={18} style={{ color: 'var(--primary)' }} />
                            </div>
                        </div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '1rem'
                }}>
                    Quick Actions
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem'
                }}>
                    {quickActions.map((action, index) => (
                        <motion.div
                            key={action.title}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                            onClick={() => navigate(action.path)}
                            style={{
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                            whileHover={{
                                borderColor: action.color,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                            }}
                        >
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: `${action.color}15`,
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '0.875rem'
                            }}>
                                <action.icon size={20} style={{ color: action.color }} />
                            </div>
                            <h3 style={{
                                fontSize: '0.9375rem',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                marginBottom: '0.25rem'
                            }}>
                                {action.title}
                            </h3>
                            <p style={{
                                fontSize: '0.8125rem',
                                color: 'var(--text-muted)',
                                marginBottom: '0.75rem'
                            }}>
                                {action.description}
                            </p>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.8125rem',
                                fontWeight: '500',
                                color: action.color
                            }}>
                                Start now <ArrowRight size={14} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* AI Tip - Minimal */}
            {stats.total_topics === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    style={{
                        background: 'var(--primary-light)',
                        border: '1px solid #C7D2FE',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}
                >
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'var(--primary)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Sparkles size={20} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{
                            fontSize: '0.9375rem',
                            fontWeight: '500',
                            color: 'var(--text-primary)',
                            marginBottom: '0.25rem'
                        }}>
                            Get started by uploading your syllabus
                        </p>
                        <p style={{
                            fontSize: '0.8125rem',
                            color: 'var(--text-secondary)'
                        }}>
                            Our AI will create a personalized learning path for you.
                        </p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/app/syllabus')}
                    >
                        Upload Syllabus
                    </button>
                </motion.div>
            )}
        </div>
    );
}

export default Dashboard;
