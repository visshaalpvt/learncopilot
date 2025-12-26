import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Clock, CheckCircle, Brain, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function RevisionQueue() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [revisionTopics, setRevisionTopics] = useState([]);

    useEffect(() => {
        fetchRevisionData();
    }, []);

    const fetchRevisionData = async () => {
        try {
            const response = await api.get('/progress/all');
            const allProgress = response.data;

            // Calculate days since last accessed
            const now = new Date();
            const topics = allProgress.map(p => {
                const lastAccessed = new Date(p.last_accessed || p.created_at);
                const daysSince = Math.floor((now - lastAccessed) / (1000 * 60 * 60 * 24));

                return {
                    ...p,
                    daysSince,
                    needsRevision: daysSince > 7 || !p.is_completed,
                    priority: daysSince > 14 ? 'high' :
                        daysSince > 7 ? 'medium' : 'low',
                };
            });

            // Filter and sort topics needing revision
            const revisionNeeded = topics
                .filter(t => t.needsRevision)
                .sort((a, b) => b.daysSince - a.daysSince);

            setRevisionTopics(revisionNeeded);
        } catch (error) {
            console.error('Failed to fetch revision data:', error);
            // Mock data as fallback
            setRevisionTopics([
                { topic_name: 'Data Structures', daysSince: 15, priority: 'high', is_completed: true, needsRevision: true },
                { topic_name: 'Algorithms', daysSince: 10, priority: 'medium', is_completed: true, needsRevision: true },
                { topic_name: 'Database Systems', daysSince: 8, priority: 'medium', is_completed: false, needsRevision: true },
                { topic_name: 'Networking', daysSince: 5, priority: 'low', is_completed: false, needsRevision: true },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'var(--danger)';
            case 'medium': return 'var(--warning)';
            case 'low': return 'var(--primary)';
            default: return 'var(--text-muted)';
        }
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            high: { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--danger)' },
            medium: { bg: 'rgba(249, 115, 22, 0.1)', text: 'var(--warning)' },
            low: { bg: 'rgba(99, 102, 241, 0.1)', text: 'var(--primary)' },
        };
        const style = colors[priority] || colors.low;

        return (
            <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: '600',
                background: style.bg,
                color: style.text,
            }}>
                {priority.toUpperCase()} PRIORITY
            </span>
        );
    };

    const handleRevise = (topic) => {
        navigate('/theory', { state: { topic: { id: topic.topic_id, name: topic.topic_name } } });
    };

    const markAsRevised = async (topic) => {
        try {
            await api.post('/progress/update', {
                topic_id: topic.topic_id,
                topic_name: topic.topic_name,
                last_accessed: new Date().toISOString(),
            });
            // Refresh data
            fetchRevisionData();
        } catch (error) {
            console.error('Failed to update revision:', error);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block', marginBottom: '1rem' }}
                >
                    <Brain size={48} style={{ color: 'var(--primary)' }} />
                </motion.div>
                <div style={{ color: 'var(--text-muted)' }}>Loading revision queue...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '0.5rem' }}>
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{ marginBottom: '2rem' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <RefreshCw size={32} style={{ color: 'var(--primary)' }} />
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>Revision Queue</h1>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    Topics that need to be revised for better retention
                </p>
            </motion.div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                >
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                        {revisionTopics.length}
                    </div>
                    <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Topics to Revise</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card"
                >
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--danger)' }}>
                        {revisionTopics.filter(t => t.priority === 'high').length}
                    </div>
                    <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>High Priority</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card"
                >
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--warning)' }}>
                        {revisionTopics.filter(t => t.priority === 'medium').length}
                    </div>
                    <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Medium Priority</div>
                </motion.div>
            </div>

            {/* Revision Topics */}
            {revisionTopics.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                >
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar style={{ color: 'var(--primary)' }} />
                        Quick Revision Checklist
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {revisionTopics.map((topic, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                style={{
                                    padding: '1.5rem',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '0.5rem',
                                    borderLeft: `5px solid ${getPriorityColor(topic.priority)}`,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '1rem',
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                                            {topic.topic_name}
                                        </h3>
                                        {getPriorityBadge(topic.priority)}
                                    </div>

                                    <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                        <span>
                                            <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                            Last reviewed: {topic.daysSince} days ago
                                        </span>
                                        <span>
                                            {topic.is_completed ? '✅ Completed' : '⏳ In Progress'}
                                        </span>
                                    </div>

                                    {/* Revision Tip */}
                                    <div style={{
                                        marginTop: '0.75rem',
                                        padding: '0.75rem',
                                        background: 'rgba(99, 102, 241, 0.05)',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.9rem',
                                        borderLeft: '3px solid var(--primary)',
                                    }}>
                                        <strong style={{ color: 'var(--primary)' }}>Revision Tip: </strong>
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            {topic.daysSince > 14
                                                ? 'Critical! Review core concepts and practice examples immediately.'
                                                : topic.daysSince > 7
                                                    ? 'Refresh key points and solve 2-3 practice questions.'
                                                    : 'Quick review of definitions and formulas recommended.'}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleRevise(topic)}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        Revise Now
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => markAsRevised(topic)}
                                        style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}
                                    >
                                        <CheckCircle size={16} /> Mark Revised
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card"
                    style={{ textAlign: 'center', padding: '3rem' }}
                >
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✨</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--success)' }}>
                        All Topics Up to Date!
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Great job! Keep maintaining regular revision schedule.
                    </p>
                </motion.div>
            )}

            {/* Revision Strategy */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card"
                style={{ marginTop: '2rem' }}
            >
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Brain style={{ color: 'var(--primary)' }} />
                    Spaced Repetition Strategy
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '0.5rem',
                        borderTop: '3px solid var(--primary)',
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📅</div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Day 1-3</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Review new topics daily for initial retention
                        </div>
                    </div>
                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '0.5rem',
                        borderTop: '3px solid var(--success)',
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📅</div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Day 7</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            First major revision after one week
                        </div>
                    </div>
                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '0.5rem',
                        borderTop: '3px solid var(--warning)',
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📅</div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Day 14+</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Regular bi-weekly reviews for long-term memory
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default RevisionQueue;
