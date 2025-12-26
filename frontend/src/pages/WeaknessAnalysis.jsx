import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, Target, Brain, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function WeaknessAnalysis() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [weakAreas, setWeakAreas] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        fetchWeaknessData();
    }, []);

    const fetchWeaknessData = async () => {
        try {
            const [weakResponse, progressResponse] = await Promise.all([
                api.get('/progress/weak-areas'),
                api.get('/progress/all')
            ]);

            const allProgress = progressResponse.data;

            // Identify weak areas
            const weak = allProgress.filter(p =>
                p.is_confused ||
                p.lab_attempts > 5 ||
                !p.is_completed
            ).map(p => ({
                ...p,
                severity: p.is_confused && !p.is_completed ? 'critical' :
                    p.is_confused ? 'high' :
                        p.lab_attempts > 5 ? 'high' :
                            'medium',
                reason: p.is_confused ? 'Marked as confusing' :
                    p.lab_attempts > 5 ? `Multiple attempts (${p.lab_attempts})` :
                        'Not completed yet'
            }));

            setWeakAreas(weak);

            // Calculate analytics
            setAnalytics({
                totalWeak: weak.length,
                critical: weak.filter(w => w.severity === 'critical').length,
                high: weak.filter(w => w.severity === 'high').length,
                medium: weak.filter(w => w.severity === 'medium').length,
            });

        } catch (error) {
            console.error('Failed to fetch weakness data:', error);
            // Mock data as fallback
            const mockWeak = [
                { topic_name: 'Data Structures', severity: 'critical', reason: 'Marked as confusing', is_confused: true, is_completed: false, lab_attempts: 3 },
                { topic_name: 'Algorithms', severity: 'high', reason: 'Multiple attempts (8)', is_confused: false, is_completed: false, lab_attempts: 8 },
                { topic_name: 'Database Normalization', severity: 'high', reason: 'Marked as confusing', is_confused: true, is_completed: true, lab_attempts: 2 },
                { topic_name: 'OOP Concepts', severity: 'medium', reason: 'Not completed yet', is_confused: false, is_completed: false, lab_attempts: 1 },
            ];
            setWeakAreas(mockWeak);
            setAnalytics({
                totalWeak: 4,
                critical: 1,
                high: 2,
                medium: 1,
            });
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'var(--danger)';
            case 'high': return 'var(--warning)';
            case 'medium': return '#f59e0b';
            default: return 'var(--text-muted)';
        }
    };

    const getSeverityBadge = (severity) => {
        const colors = {
            critical: { bg: 'rgba(239, 68, 68, 0.1)', border: 'var(--danger)', text: 'var(--danger)' },
            high: { bg: 'rgba(249, 115, 22, 0.1)', border: 'var(--warning)', text: 'var(--warning)' },
            medium: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#f59e0b' },
        };
        const style = colors[severity] || colors.medium;

        return (
            <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: '600',
                background: style.bg,
                border: `1px solid ${style.border}`,
                color: style.text,
            }}>
                {severity.toUpperCase()}
            </span>
        );
    };

    const handleReview = (topic) => {
        navigate('/theory', { state: { topic: { id: topic.topic_id, name: topic.topic_name } } });
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
                <div style={{ color: 'var(--text-muted)' }}>Analyzing your weak areas...</div>
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
                    <AlertTriangle size={32} style={{ color: 'var(--warning)' }} />
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>Weakness Analysis</h1>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    Identify and overcome your learning challenges
                </p>
            </motion.div>

            {/* Analytics Cards */}
            {analytics && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card"
                        style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))' }}
                    >
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--danger)' }}>
                            {analytics.totalWeak}
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Total Weak Areas</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card"
                        style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))' }}
                    >
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--danger)' }}>
                            {analytics.critical}
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Critical Priority</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card"
                        style={{ background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0.05))' }}
                    >
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--warning)' }}>
                            {analytics.high}
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>High Priority</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="card"
                        style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))' }}
                    >
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#f59e0b' }}>
                            {analytics.medium}
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Medium Priority</div>
                    </motion.div>
                </div>
            )}

            {/* Weak Areas List */}
            {weakAreas.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                >
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Target style={{ color: 'var(--danger)' }} />
                        Areas Requiring Attention
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {weakAreas.map((area, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                style={{
                                    padding: '1.5rem',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '0.5rem',
                                    borderLeft: `5px solid ${getSeverityColor(area.severity)}`,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '1rem',
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                                            {area.topic_name}
                                        </h3>
                                        {getSeverityBadge(area.severity)}
                                    </div>

                                    <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                        <span>
                                            <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                            {area.reason}
                                        </span>
                                        {area.lab_attempts > 0 && (
                                            <span>
                                                📝 {area.lab_attempts} lab attempts
                                            </span>
                                        )}
                                        <span>
                                            {area.is_completed ? '✅ Completed' : '⏳ In Progress'}
                                        </span>
                                    </div>

                                    {/* AI Recommendation */}
                                    <div style={{
                                        marginTop: '0.75rem',
                                        padding: '0.75rem',
                                        background: 'rgba(99, 102, 241, 0.05)',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.9rem',
                                        borderLeft: '3px solid var(--primary)',
                                    }}>
                                        <strong style={{ color: 'var(--primary)' }}>AI Suggestion: </strong>
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            {area.severity === 'critical'
                                                ? 'Immediate revision needed. Review theory and practice examples.'
                                                : area.severity === 'high'
                                                    ? 'Schedule focused study session. Break down into smaller concepts.'
                                                    : 'Regular practice recommended. Try more examples.'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleReview(area)}
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    Review Now
                                </button>
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
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--success)' }}>
                        No Weak Areas Detected!
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        You're doing great! Keep up the excellent work.
                    </p>
                </motion.div>
            )}

            {/* Improvement Tips */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card"
                style={{ marginTop: '2rem' }}
            >
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Brain style={{ color: 'var(--primary)' }} />
                    Smart Improvement Tips
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '0.5rem',
                        borderTop: '3px solid var(--primary)',
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📚</div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Review Regularly</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Revisit weak topics every 2-3 days for better retention
                        </div>
                    </div>
                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '0.5rem',
                        borderTop: '3px solid var(--success)',
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💻</div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Practice More</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Use Practical Mode to reinforce concepts through coding
                        </div>
                    </div>
                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '0.5rem',
                        borderTop: '3px solid var(--warning)',
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯</div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Focus Priority</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Tackle critical topics first before moving to medium priority
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default WeaknessAnalysis;
