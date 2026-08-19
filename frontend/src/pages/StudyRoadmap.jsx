import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    ChevronRight,
    Target,
    Clock,
    CheckCircle2,
    Circle,
    Sparkles,
    BarChart3,
    ArrowRight,
    Brain,
    Rocket,
    RefreshCw,
    Download,
    FileText,
    Activity,
    ListChecks
} from 'lucide-react';
import api from '../api';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts';

function StudyRoadmap() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState(null);
    const [planId, setPlanId] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [config, setConfig] = useState({
        total_weeks: 4,
        hours_per_day: 2,
        goal: 'Deep understanding'
    });
    const [generating, setGenerating] = useState(false);
    const [optimizing, setOptimizing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [aiInsight, setAiInsight] = useState("Your cognitive roadmap is ready. I've optimized the sequence for maximum retention.");

    useEffect(() => {
        fetchInitialData();
        fetchAiInsights();
    }, []);

    const fetchAiInsights = async () => {
        try {
            const res = await api.get('/recommendations/smart-insights');
            if (res.data.insights && res.data.insights.length > 0) {
                setAiInsight(res.data.insights[0]);
            }
        } catch (e) {
            console.error("Failed to fetch insights", e);
        }
    };

    const fetchInitialData = async () => {
        try {
            const [subjectsRes, planRes] = await Promise.all([
                api.get('/rag/subjects'),
                api.get('/study-plan/current')
            ]);
            setSubjects(subjectsRes.data.subjects || []);
            if (planRes.data.exists) {
                // Backend returns topics_schedule which contains the parsed JSON
                setPlan(planRes.data.topics_schedule);
                setPlanId(planRes.data.id);
            }
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!window.confirm('Wipe current roadmap and generate a new one?')) return;

        try {
            if (planId) {
                await api.delete(`/study-plan/${planId}`);
            }
            setPlan(null);
            setPlanId(null);
        } catch (error) {
            console.error('Failed to reset roadmap:', error);
            // Still clear local state
            setPlan(null);
            setPlanId(null);
        }
    };

    const handleGenerate = async () => {
        if (!selectedSubject) {
            alert('Please select a subject first');
            return;
        }
        setGenerating(true);
        try {
            const response = await api.post('/study-plan/generate', {
                subject: selectedSubject,
                ...config
            });
            setPlan(response.data);
        } catch (error) {
            console.error('Generation failed:', error);
            alert('Failed to generate roadmap. Ensure you have uploaded a syllabus for this subject.');
        } finally {
            setGenerating(false);
        }
    };

    const handleOptimize = async () => {
        setOptimizing(true);
        try {
            const response = await api.post('/study-plan/optimize');
            setPlan(response.data);
            if (response.data.agent_insight) {
                setAiInsight(response.data.agent_insight);
            }
        } catch (error) {
            console.error('Failed to optimize plan:', error);
            alert('Could not optimize plan. Please try again later.');
        } finally {
            setOptimizing(false);
        }
    };

    const handleDownloadReport = async () => {
        setExporting(true);
        try {
            const response = await api.get('/analytics/report', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'My_Study_Report.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to download report:', error);
            alert('Failed to generate PDF report.');
        } finally {
            setExporting(false);
        }
    };

    // Radar Data Preparation
    const radarData = plan?.weekly_plan?.flatMap(w => (w.topics_meta || []).map(t => ({
        subject: (t.name || '').length > 15 ? (t.name || '').substring(0, 12) + '...' : (t.name || ''),
        A: t.mastery || 0,
        fullMark: 100
    }))) || [];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                        <Brain size={48} color="var(--primary)" />
                    </motion.div>
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Synopsizing Knowledge Graph...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ paddingBottom: '3rem' }}>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '0.5rem', background: 'linear-gradient(90deg, var(--primary), #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Study Roadmap
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    AI-powered journey personalized to your goals and pace.
                </p>
            </div>

            {!plan && !generating ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                    style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem' }}
                >
                    <Rocket size={64} color="var(--primary)" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
                    <h2 style={{ marginBottom: '1rem' }}>No Active Roadmap</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Ready to start your personalized learning journey? Tell our AI agent your constraints and we'll build the perfect plan.
                    </p>

                    <div style={{ textAlign: 'left', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div className="form-group">
                            <label className="form-label">Subject</label>
                            <select
                                className="form-select"
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Duration (Weeks)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={config.total_weeks}
                                    onChange={(e) => setConfig({ ...config, total_weeks: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Hours / Day</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={config.hours_per_day}
                                    onChange={(e) => setConfig({ ...config, hours_per_day: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Learning Goal</label>
                            <select
                                className="form-select"
                                value={config.goal}
                                onChange={(e) => setConfig({ ...config, goal: e.target.value })}
                            >
                                <option value="Deep understanding">Deep Mastery (Recommended)</option>
                                <option value="Exam cram">Exam Preparation</option>
                                <option value="Quick overview">Concept Overview</option>
                            </select>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '1rem', height: '3rem' }}
                            onClick={handleGenerate}
                        >
                            Generate Roadmap <Sparkles size={18} />
                        </button>
                    </div>
                </motion.div>
            ) : generating ? (
                <div style={{ textAlign: 'center', padding: '5rem' }}>
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Brain size={80} color="var(--primary)" style={{ opacity: 0.5 }} />
                    </motion.div>
                    <h2 style={{ marginTop: '2rem' }}>AI Agent Planning...</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Analyzing curriculum complexity and applying time constraints.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
                    {/* Timeline View */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>{plan.exam_name || 'Study Plan'}</h2>
                            <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.5rem 1rem' }}>
                                Progress: {radarData.length > 0 ? Math.round(radarData.filter(d => d.A >= 80).length / radarData.length * 100) : 0}%
                            </span>
                        </div>

                        {(plan.weekly_plan || []).map((week, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="card"
                                style={{
                                    borderLeft: `6px solid ${idx === 0 ? 'var(--primary)' : 'var(--border)'}`,
                                    position: 'relative',
                                    padding: '1.5rem 2rem'
                                }}
                            >
                                <div style={{ position: 'absolute', left: '-13px', top: '24px', background: 'var(--bg-primary)', border: `3px solid ${idx === 0 ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '50%', width: '20px', height: '20px' }}></div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: 'var(--primary)' }}>Week {week.week}</h3>
                                        <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', fontSize: '1.1rem' }}>{week.focus}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <Clock size={16} /> {Math.round(12.5)} hrs est.
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {(week.topics_meta || []).map((topic, tIdx) => (
                                        <div
                                            key={tIdx}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.75rem 1rem',
                                                background: 'var(--bg-secondary)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                opacity: topic.completed ? 0.7 : 1
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                                                {topic.completed ? (
                                                    <CheckCircle2 size={20} color="var(--success)" />
                                                ) : (
                                                    <Circle size={20} color="var(--border)" />
                                                )}
                                                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: (topic.mastery || 0) >= 80 ? 'var(--success)' : (topic.mastery || 0) > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                                                    {topic.mastery || 0}% Mastery
                                                </div>
                                                <button
                                                    onClick={() => navigate('/app/theory', { state: { subject: selectedSubject || 'Core Subject', topic: { id: `topic_${tIdx}`, name: topic.name } } })}
                                                    style={{
                                                        padding: '0.25rem 0.6rem',
                                                        fontSize: '0.75rem',
                                                        borderRadius: '6px',
                                                        border: 'none',
                                                        background: 'var(--primary)',
                                                        color: 'white',
                                                        cursor: 'pointer',
                                                        fontWeight: 600,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}
                                                >
                                                    <Sparkles size={12} /> Learn
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Sidebar: Tracing & Insights */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'sticky', top: '90px' }}>
                        {/* Radar Chart */}
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Brain size={20} color="var(--primary)" /> Knowledge Map
                            </h3>
                            <div style={{ height: '300px' }}>
                                {radarData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                            <PolarGrid stroke="var(--border)" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar
                                                name="Mastery"
                                                dataKey="A"
                                                stroke="var(--primary)"
                                                fill="var(--primary)"
                                                fillOpacity={0.5}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                        No mastery data yet
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Agent Insight */}
                        <div className="card" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary-light)', padding: '1.5rem' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>
                                <Sparkles size={18} /> AI Recommendations
                            </h4>
                            <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                                {aiInsight}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%', fontSize: '0.9rem' }}
                                    onClick={handleOptimize}
                                    disabled={optimizing}
                                >
                                    <RefreshCw size={16} className={optimizing ? "spin" : ""} />
                                    {optimizing ? 'Analyzing...' : 'Optimize My Plan'}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    style={{ width: '100%', fontSize: '0.9rem', background: 'white' }}
                                    onClick={handleDownloadReport}
                                    disabled={exporting}
                                >
                                    <FileText size={16} />
                                    {exporting ? 'Exporting...' : 'Download Detailed Report'}
                                </button>
                            </div>
                        </div>

                        <button
                            className="btn btn-secondary"
                            style={{ width: '100%' }}
                            onClick={handleReset}
                        >
                            Reset Roadmap
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudyRoadmap;
