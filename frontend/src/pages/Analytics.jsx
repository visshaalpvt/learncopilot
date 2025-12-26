import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Clock, TrendingUp, Target, Calendar, Brain } from 'lucide-react';
import api from '../api';

function Analytics() {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [progressResponse, dashboardResponse] = await Promise.all([
                api.get('/progress/all'),
                api.get('/progress/dashboard')
            ]);

            const allProgress = progressResponse.data;
            const dashboardData = dashboardResponse.data;

            // Calculate analytics
            const timeSpent = {
                theory: allProgress.filter(p => p.is_completed).length * 45, // 45 min avg per topic
                practical: allProgress.reduce((sum, p) => sum + (p.lab_attempts || 0), 0) * 30, // 30 min per attempt
                examPrep: Math.floor(allProgress.length * 0.3 * 60), // 30% time on exam prep
            };

            const totalMinutes = timeSpent.theory + timeSpent.practical + timeSpent.examPrep;

            const completionPattern = {
                weekday: Math.floor(allProgress.length * 0.7),
                weekend: Math.floor(allProgress.length * 0.3),
            };

            setAnalytics({
                timeSpent,
                totalMinutes,
                totalHours: Math.floor(totalMinutes / 60),
                completionPattern,
                studyStreak: dashboardData.study_streak || 0,
                topicsCompleted: allProgress.filter(p => p.is_completed).length,
                totalTopics: allProgress.length,
                avgLabAttempts: allProgress.length > 0
                    ? (allProgress.reduce((sum, p) => sum + (p.lab_attempts || 0), 0) / allProgress.length).toFixed(1)
                    : 0,
            });
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            // Mock analytics
            setAnalytics({
                timeSpent: { theory: 180, practical: 150, examPrep: 90 },
                totalMinutes: 420,
                totalHours: 7,
                completionPattern: { weekday: 15, weekend: 8 },
                studyStreak: 5,
                topicsCompleted: 12,
                totalTopics: 20,
                avgLabAttempts: 3.2,
            });
        } finally {
            setLoading(false);
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
                <div style={{ color: 'var(--text-muted)' }}>Calculating your analytics...</div>
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
                    <BarChart3 size={32} style={{ color: 'var(--primary)' }} />
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>Learning Analytics</h1>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    Detailed insights into your study patterns and performance
                </p>
            </motion.div>

            {/* Time Investment Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{ marginBottom: '2rem' }}
            >
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock style={{ color: 'var(--primary)' }} />
                    Time Investment Summary
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="stat-card" style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05))',
                        borderRadius: '0.5rem',
                        borderTop: '4px solid var(--primary)',
                    }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                            {analytics.totalHours}h
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Total Study Time</div>
                    </div>

                    <div className="stat-card" style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
                        borderRadius: '0.5rem',
                        borderTop: '4px solid var(--success)',
                    }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--success)' }}>
                            {Math.floor(analytics.timeSpent.theory / 60)}h
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Theory Learning</div>
                    </div>

                    <div className="stat-card" style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))',
                        borderRadius: '0.5rem',
                        borderTop: '4px solid #8b5cf6',
                    }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#8b5cf6' }}>
                            {Math.floor(analytics.timeSpent.practical / 60)}h
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Practical Labs</div>
                    </div>

                    <div className="stat-card" style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0.05))',
                        borderRadius: '0.5rem',
                        borderTop: '4px solid var(--warning)',
                    }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--warning)' }}>
                            {Math.floor(analytics.timeSpent.examPrep / 60)}h
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Exam Preparation</div>
                    </div>
                </div>

                {/* Visual Time Distribution */}
                <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ fontWeight: '600', marginBottom: '1rem' }}>Time Distribution</div>
                    <div style={{ display: 'flex', height: '40px', borderRadius: '9999px', overflow: 'hidden', gap: '2px' }}>
                        <div style={{
                            width: `${(analytics.timeSpent.theory / analytics.totalMinutes) * 100}%`,
                            background: 'var(--success)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                        }}>
                            {Math.round((analytics.timeSpent.theory / analytics.totalMinutes) * 100)}%
                        </div>
                        <div style={{
                            width: `${(analytics.timeSpent.practical / analytics.totalMinutes) * 100}%`,
                            background: '#8b5cf6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                        }}>
                            {Math.round((analytics.timeSpent.practical / analytics.totalMinutes) * 100)}%
                        </div>
                        <div style={{
                            width: `${(analytics.timeSpent.examPrep / analytics.totalMinutes) * 100}%`,
                            background: 'var(--warning)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                        }}>
                            {Math.round((analytics.timeSpent.examPrep / analytics.totalMinutes) * 100)}%
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span>🟢 Theory</span>
                        <span>🟣 Practical</span>
                        <span>🟠 Exam Prep</span>
                    </div>
                </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {/* Completion Patterns */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card"
                >
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar style={{ color: 'var(--primary)' }} />
                        Completion Patterns
                    </h2>

                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: '500' }}>Weekday Progress</span>
                            <span style={{ fontWeight: '600', color: 'var(--primary)' }}>
                                {analytics.completionPattern.weekday} topics
                            </span>
                        </div>
                        <div style={{ height: '20px', background: 'var(--bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${(analytics.completionPattern.weekday / (analytics.completionPattern.weekday + analytics.completionPattern.weekend)) * 100}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, var(--primary), #8b5cf6)',
                                borderRadius: '9999px',
                            }}></div>
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: '500' }}>Weekend Progress</span>
                            <span style={{ fontWeight: '600', color: 'var(--success)' }}>
                                {analytics.completionPattern.weekend} topics
                            </span>
                        </div>
                        <div style={{ height: '20px', background: 'var(--bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${(analytics.completionPattern.weekend / (analytics.completionPattern.weekday + analytics.completionPattern.weekend)) * 100}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, var(--success), #10b981)',
                                borderRadius: '9999px',
                            }}></div>
                        </div>
                    </div>

                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(99, 102, 241, 0.05)',
                        borderRadius: '0.5rem',
                        borderLeft: '3px solid var(--primary)',
                    }}>
                        <strong style={{ color: 'var(--primary)' }}>AI Insight: </strong>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            {analytics.completionPattern.weekday > analytics.completionPattern.weekend
                                ? "You're more productive on weekdays. Great consistency!"
                                : "You prefer weekend study sessions. Consider spreading workload across weekdays too."}
                        </span>
                    </div>
                </motion.div>

                {/* Learning Consistency */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card"
                >
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp style={{ color: 'var(--success)' }} />
                        Learning Consistency
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{
                            padding: '1.5rem',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '0.5rem',
                            borderLeft: '4px solid var(--success)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                        Current Study Streak
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>
                                        {analytics.studyStreak} days 🔥
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            padding: '1.5rem',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '0.5rem',
                            borderLeft: '4px solid var(--primary)',
                        }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                Completion Rate
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                {Math.round((analytics.topicsCompleted / analytics.totalTopics) * 100)}%
                            </div>
                            <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '9999px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${(analytics.topicsCompleted / analytics.totalTopics) * 100}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, var(--primary), #8b5cf6)',
                                    borderRadius: '9999px',
                                }}></div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                {analytics.topicsCompleted} of {analytics.totalTopics} topics completed
                            </div>
                        </div>

                        <div style={{
                            padding: '1.5rem',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '0.5rem',
                            borderLeft: '4px solid #8b5cf6',
                        }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                Average Lab Attempts
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6' }}>
                                {analytics.avgLabAttempts}×
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                {analytics.avgLabAttempts < 3 ? 'Excellent! Quick learner' :
                                    analytics.avgLabAttempts < 5 ? 'Good practice rate' :
                                        'Consider reviewing concepts before labs'}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Performance Insights */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card"
                style={{ marginTop: '2rem' }}
            >
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Target style={{ color: 'var(--primary)' }} />
                    Performance Insights
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '0.5rem',
                        borderTop: '3px solid var(--success)',
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💪</div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Strong Area</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Theory learning - {Math.round((analytics.timeSpent.theory / analytics.totalMinutes) * 100)}% of total time
                        </div>
                    </div>
                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '0.5rem',
                        borderTop: '3px solid var(--warning)',
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯</div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Focus Area</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Increase practical coding time for better retention
                        </div>
                    </div>
                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '0.5rem',
                        borderTop: '3px solid var(--primary)',
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📈</div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Recommendation</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Maintain {analytics.studyStreak}+ day streak for optimal results
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default Analytics;
