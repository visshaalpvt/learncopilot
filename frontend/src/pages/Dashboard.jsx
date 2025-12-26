import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Code, TrendingUp, Clock, Sparkles, Brain, Target, Zap } from 'lucide-react';
import api from '../api';
import MockAI from '../services/mockAI';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiInsight, setAiInsight] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/progress/dashboard');
            setStats(response.data);

            // Get AI recommendations
            const allProgress = await api.get('/progress/all').catch(() => ({ data: [] }));
            const insight = await MockAI.getRecommendations(allProgress.data);
            setAiInsight(insight);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            // Use default values if fetch fails
            setStats({
                total_topics: 0,
                completed_topics: 0,
                labs_attempted: 0,
                progress_percentage: 0,
                recent_activities: []
            });
            setAiInsight(MockAI.getGreeting());
        } finally {
            setLoading(false);
            setIsAiLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ marginRight: '1rem' }}
                >
                    <Brain size={32} style={{ color: 'var(--primary)' }} />
                </motion.div>
                <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>Loading your learning dashboard...</div>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Overall Progress',
            value: `${stats.progress_percentage}%`,
            icon: TrendingUp,
            color: 'var(--primary)',
            gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        },
        {
            label: 'Topics Completed',
            value: stats.completed_topics,
            icon: BookOpen,
            color: 'var(--success)',
            gradient: 'linear-gradient(135deg, #10b981, #34d399)',
        },
        {
            label: 'Labs Attempted',
            value: stats.labs_attempted,
            icon: Code,
            color: 'var(--warning)',
            gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
        },
        {
            label: 'Total Topics',
            value: stats.total_topics,
            icon: Target,
            color: 'var(--primary-light)',
            gradient: 'linear-gradient(135deg, #818cf8, #a5b4fc)',
        },
    ];

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                    Dashboard
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Track your learning progress and stay on top of your goals</p>
            </div>

            {/* AI Insights Banner */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '150px',
                    height: '150px',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2), transparent)',
                    borderRadius: '50%',
                }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', position: 'relative' }}>
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <Sparkles size={24} color="white" />
                    </motion.div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}>
                            <Zap size={16} style={{ color: 'var(--warning)' }} />
                            AI Study Insights
                        </div>
                        {isAiLoading ? (
                            <div style={{ color: 'var(--text-muted)' }}>Analyzing your learning patterns...</div>
                        ) : (
                            <div style={{
                                color: 'var(--text-secondary)',
                                lineHeight: '1.6',
                                whiteSpace: 'pre-wrap',
                                fontSize: '0.9rem',
                            }}>
                                {aiInsight}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="dashboard-grid">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="stat-card"
                        style={{ cursor: 'pointer' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{
                                background: stat.gradient,
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <stat.icon size={24} color="white" />
                            </div>
                        </div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Continue Learning */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card"
                style={{ marginBottom: '2rem' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Brain size={20} style={{ color: 'var(--primary)' }} />
                    <h2 className="card-title" style={{ marginBottom: 0 }}>Continue Learning</h2>
                </div>
                <p className="card-description" style={{ marginBottom: '1.5rem' }}>
                    Pick up where you left off and keep making progress
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn-primary"
                        onClick={() => navigate('/theory')}
                    >
                        <BookOpen size={18} />
                        Theory Mode
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn-secondary"
                        onClick={() => navigate('/practical')}
                    >
                        <Code size={18} />
                        Practical Mode
                    </motion.button>
                </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card"
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Clock size={20} style={{ color: 'var(--warning)' }} />
                    <h2 className="card-title" style={{ marginBottom: 0 }}>Recent Activity</h2>
                </div>
                <p className="card-description" style={{ marginBottom: '1.5rem' }}>
                    Your latest learning activities
                </p>

                {stats.recent_activities && stats.recent_activities.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {stats.recent_activities.map((activity, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * index }}
                                style={{
                                    padding: '1rem',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderLeft: '4px solid var(--primary)',
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: '500' }}>{activity.topic_name}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{activity.action}</div>
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    {new Date(activity.timestamp).toLocaleDateString()}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        </motion.div>
                        <p>No recent activity yet. Start learning to see your progress here!</p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn btn-primary btn-sm"
                            style={{ marginTop: '1rem' }}
                            onClick={() => navigate('/syllabus')}
                        >
                            Upload Syllabus
                        </motion.button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

export default Dashboard;
