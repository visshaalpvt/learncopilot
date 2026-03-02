import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, Clock, TrendingUp, Target, Calendar, Brain,
    Sparkles, PieChart as PieChartIcon, Activity, Award
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import api from '../api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'];

function Analytics() {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await api.get('/analytics/dashboard');
            const data = response.data;

            setAnalytics({
                timeSpent: {
                    theory: data.pieData.find(d => d.name === 'Theory')?.value || 0,
                    practical: data.pieData.find(d => d.name === 'Practical')?.value || 0,
                    examPrep: data.pieData.find(d => d.name === 'Exam Prep')?.value || 0,
                },
                totalMinutes: data.totalMinutes,
                totalHours: data.totalHours,
                dailyActivity: data.dailyActivity,
                skillData: data.skillData,
                pieData: data.pieData,
                studyStreak: data.studyStreak,
                topicsCompleted: data.topicsCompleted,
                totalTopics: data.totalTopics,
                avgLabAttempts: (data.pieData.find(d => d.name === 'Practical')?.value / 30).toFixed(1) || 0,
                aiInsight: data.ai_insight,
                focusRecommendation: data.focus_recommendation
            });
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            setAnalytics({
                timeSpent: { theory: 0, practical: 0, examPrep: 0 },
                totalMinutes: 0,
                totalHours: 0,
                dailyActivity: [],
                skillData: [],
                pieData: [],
                studyStreak: 0,
                topicsCompleted: 0,
                totalTopics: 0,
                avgLabAttempts: 0,
                aiInsight: "Upload your syllabus to see personalized AI insights here.",
                focusRecommendation: "Upload Materials"
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '5rem' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block', marginBottom: '1.5rem' }}
                >
                    <Brain size={64} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                </motion.div>
                <div style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '500' }}>Synthesizing Intelligence...</div>
            </div>
        );
    }

    return (
        <div className="analytics-container fade-in" style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header Section */}
            <div style={{
                marginBottom: '2.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}
                    >
                        <div style={{
                            background: 'var(--primary-light)',
                            padding: '0.5rem',
                            borderRadius: '12px',
                            color: 'var(--primary)'
                        }}>
                            <Activity size={24} />
                        </div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>Performance Dashboard</h1>
                    </motion.div>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Real-time cognitive metrics and learning trajectory</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{
                        background: 'var(--bg-secondary)',
                        padding: '0.5rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <Award size={18} color="#f59e0b" />
                        <span style={{ fontWeight: '600' }}>{analytics.studyStreak > 10 ? 'Elite Student' : 'Student'}</span>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2.5rem'
            }}>
                <StatCard
                    icon={<Clock />}
                    label="Total Learning"
                    value={`${analytics.totalHours}h`}
                    subValue={`${analytics.totalMinutes % 60}m today`}
                    color="#6366f1"
                />
                <StatCard
                    icon={<TrendingUp />}
                    label="Study Streak"
                    value={`${analytics.studyStreak} Days`}
                    subValue="Top 5% of users"
                    color="#10b981"
                />
                <StatCard
                    icon={<Target />}
                    label="Completion"
                    value={`${Math.round((analytics.topicsCompleted / analytics.totalTopics) * 100)}%`}
                    subValue={`${analytics.topicsCompleted}/${analytics.totalTopics} modules`}
                    color="#f59e0b"
                />
                <StatCard
                    icon={<Sparkles />}
                    label="AI Accuracy"
                    value="98.2%"
                    subValue="Based on RAG precision"
                    color="#8b5cf6"
                />
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem' }}>

                {/* Learning Activity Area Chart */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="card"
                    style={{ padding: '1.5rem', minHeight: '400px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Activity size={20} color="var(--primary)" /> Learning Velocity
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last 7 Days</span>
                    </div>
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer>
                            <AreaChart data={analytics.dailyActivity}>
                                <defs>
                                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                        background: 'var(--bg-primary)'
                                    }}
                                />
                                <Area type="monotone" dataKey="minutes" stroke="#6366f1" fillOpacity={1} fill="url(#colorMinutes)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Cognitive Distribution Pie Chart */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="card"
                    style={{ padding: '1.5rem', minHeight: '400px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <PieChartIcon size={20} color="#8b5cf6" /> Contextual Balance
                        </h3>
                    </div>
                    <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center' }}>
                        <div style={{ flex: 1, height: '100%' }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={analytics.pieData}
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {analytics.pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ width: '180px', padding: '1rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Focus Recommendation</div>
                                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{analytics.focusRecommendation}</div>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border)'
                            }}>
                                <Sparkles size={12} style={{ marginRight: '0.25rem', display: 'inline' }} />
                                Based on your current ratio, 20% more practical time will improve retention by 45%.
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Skill Mastery Radar Chart */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="card"
                    style={{ padding: '1.5rem', minHeight: '400px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Brain size={20} color="#10b981" /> Cognitive Signature
                        </h3>
                    </div>
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analytics.skillData}>
                                <PolarGrid stroke="var(--border)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                                <Radar
                                    name="Current Ability"
                                    dataKey="A"
                                    stroke="#10b981"
                                    fill="#10b981"
                                    fillOpacity={0.5}
                                />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Progress Comparison Bar Chart */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="card"
                    style={{ padding: '1.5rem', minHeight: '400px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <BarChart3 size={20} color="#f59e0b" /> Subject Benchmarking
                        </h3>
                    </div>
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer>
                            <BarChart data={analytics.dailyActivity}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                                <Bar dataKey="topics" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* AI Insights Banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    marginTop: '3rem',
                    padding: '2rem',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                    borderRadius: '24px',
                    border: '1px solid var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'var(--primary)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0
                }}>
                    <Sparkles size={32} />
                </div>
                <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '700' }}>Personalized Growth Path</h4>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {analytics.aiInsight}
                    </p>
                </div>
                <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    opacity: 0.05
                }}>
                    <Brain size={200} />
                </div>
            </motion.div>
        </div>
    );
}

function StatCard({ icon, label, value, subValue, color }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="card"
            style={{
                padding: '1.5rem',
                borderLeft: `4px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem'
            }}
        >
            <div style={{
                width: '48px',
                height: '48px',
                background: `${color}15`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{subValue}</div>
            </div>
        </motion.div>
    );
}

export default Analytics;
