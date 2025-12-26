import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, CheckCircle, BookOpen, Brain, Sparkles, Target } from 'lucide-react';
import api from '../api';
import MockAI from '../services/mockAI';

function Progress() {
    const [progressData, setProgressData] = useState([]);
    const [weakAreas, setWeakAreas] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiRecommendations, setAiRecommendations] = useState('');

    useEffect(() => {
        fetchProgressData();
    }, []);

    const fetchProgressData = async () => {
        try {
            const [progressRes, weakRes, statsRes] = await Promise.all([
                api.get('/progress/all'),
                api.get('/progress/weak-areas'),
                api.get('/progress/dashboard'),
            ]);

            setProgressData(progressRes.data);
            setWeakAreas(weakRes.data);
            setStats(statsRes.data);

            // Get AI recommendations
            const recommendations = await MockAI.getRecommendations(progressRes.data);
            setAiRecommendations(recommendations);
        } catch (error) {
            console.error('Failed to fetch progress:', error);
            // Set defaults
            setProgressData([]);
            setWeakAreas([]);
            setStats({
                total_topics: 0,
                completed_topics: 0,
                progress_percentage: 0,
            });
            setAiRecommendations(MockAI.getGreeting());
        } finally {
            setLoading(false);
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
                <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>Analyzing your progress...</div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Target size={32} style={{ color: 'var(--success)' }} />
                    </motion.div>
                    Progress Tracker
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Monitor your learning journey with AI-powered insights</p>
            </div>

            {/* AI Recommendations */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                        <Sparkles size={24} style={{ color: 'var(--primary)' }} />
                    </motion.div>
                    <h3 style={{ margin: 0, color: 'var(--primary)' }}>AI Study Recommendations</h3>
                </div>
                <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {aiRecommendations}
                </p>
            </motion.div>

            {/* Overall Progress */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{ marginBottom: '2rem' }}
            >
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
                    Overall Progress
                </h2>

                <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: '500' }}>Completion Rate</span>
                        <span style={{ fontWeight: '600', color: 'var(--primary)' }}>
                            {stats?.completed_topics || 0} / {stats?.total_topics || 0} topics
                        </span>
                    </div>
                    <div className="progress-bar">
                        <motion.div
                            className="progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${stats?.progress_percentage || 0}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </div>
                    <div style={{ marginTop: '0.5rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {stats?.progress_percentage || 0}% Complete
                    </div>
                </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {/* Topic Completion */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card"
                >
                    <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                        Topic Completion
                    </h2>
                    <p className="card-description" style={{ marginBottom: '1.5rem' }}>
                        Your progress across all topics
                    </p>

                    {progressData.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                            {progressData.map((topic, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    style={{
                                        padding: '0.75rem',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '0.5rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderLeft: `4px solid ${topic.is_completed ? 'var(--success)' : topic.is_confused ? 'var(--danger)' : 'var(--warning)'}`,
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: '500' }}>{topic.topic_name}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            Labs: {topic.labs_attempted} • Last activity: {new Date(topic.last_activity).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div>
                                        {topic.is_completed ? (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                style={{
                                                    padding: '0.25rem 0.75rem',
                                                    background: 'rgba(16, 185, 129, 0.2)',
                                                    color: 'var(--success)',
                                                    borderRadius: '999px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500',
                                                }}
                                            >
                                                ✅ Completed
                                            </motion.span>
                                        ) : topic.is_confused ? (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                style={{
                                                    padding: '0.25rem 0.75rem',
                                                    background: 'rgba(239, 68, 68, 0.2)',
                                                    color: 'var(--danger)',
                                                    borderRadius: '999px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500',
                                                }}
                                            >
                                                ❓ Needs Review
                                            </motion.span>
                                        ) : (
                                            <span
                                                style={{
                                                    padding: '0.25rem 0.75rem',
                                                    background: 'rgba(245, 158, 11, 0.2)',
                                                    color: 'var(--warning)',
                                                    borderRadius: '999px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500',
                                                }}
                                            >
                                                🔄 In Progress
                                            </span>
                                        )}
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
                                <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                            </motion.div>
                            <p>No topics tracked yet. Start learning to see your progress!</p>
                        </div>
                    )}
                </motion.div>

                {/* Weak Areas */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card"
                >
                    <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={20} style={{ color: 'var(--danger)' }} />
                        Areas Needing Attention
                    </h2>
                    <p className="card-description" style={{ marginBottom: '1.5rem' }}>
                        Topics AI recommends you review
                    </p>

                    {weakAreas.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {weakAreas.map((area, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ x: -5 }}
                                    style={{
                                        padding: '1rem',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '0.5rem',
                                        borderLeft: '4px solid var(--danger)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{area.topic_name}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{area.reason}</div>
                                    {area.labs_attempted > 0 && (
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                            Attempted {area.labs_attempted} lab{area.labs_attempted !== 1 ? 's' : ''}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <CheckCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: 'var(--success)' }} />
                            </motion.div>
                            <p style={{ color: 'var(--success)' }}>Great job! No weak areas detected. 🎉</p>
                            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                Keep up the good work and continue learning!
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

export default Progress;
