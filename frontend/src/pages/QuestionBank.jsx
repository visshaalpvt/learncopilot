import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    Settings,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    Database,
    TrendingUp,
    Shield,
    Bot
} from 'lucide-react';
import api from '../api';

const QuestionBank = () => {
    const [config, setConfig] = useState({
        course_name: 'Data Structures',
        num_questions: 20,
        include_bloom: true,
        include_outcomes: true
    });

    const [courses, setCourses] = useState([]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('report'); // 'report' or 'questions'

    useEffect(() => {
        // Fetch available courses
        const fetchCourses = async () => {
            try {
                const res = await api.get('/question-bank/get-courses');
                setCourses(res.data.courses);
            } catch (err) {
                console.error("Failed to fetch courses", err);
                // Fallback
                setCourses(["Data Structures", "Algorithms", "Database", "Operating Systems"]);
            }
        };
        fetchCourses();
    }, []);

    const handleGenerate = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await api.post('/question-bank/generate', config);
            // Simulate agent delay for effect
            setTimeout(() => {
                setResult(res.data);
                setLoading(false);
            }, 2000);
        } catch (err) {
            console.error(err);
            setLoading(false);
            alert("Failed to generate question bank. Ensure backend is running.");
        }
    };

    return (
        <div className="fade-in">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem' }}>
                    <Database size={32} color="var(--primary)" />
                    Question Bank Generator & Auditor
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Dual-agent system: <b>Generator Agent</b> creates aligned content, <b>Auditor Agent</b> ensures quality and compliance.
                </p>
            </header>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>

                {/* Configuration Panel */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Configuration</h2>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Target Course</label>
                        <select
                            className="form-select"
                            value={config.course_name}
                            onChange={e => setConfig({ ...config, course_name: e.target.value })}
                        >
                            {courses.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Number of Questions</label>
                        <input
                            type="number"
                            className="form-input"
                            value={config.num_questions}
                            min="5" max="50"
                            onChange={e => setConfig({ ...config, num_questions: parseInt(e.target.value) })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={config.include_bloom}
                                onChange={e => setConfig({ ...config, include_bloom: e.target.checked })}
                            />
                            <span>Map to Bloom's Taxonomy</span>
                        </label>
                    </div>

                    <div className="form-group">
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={config.include_outcomes}
                                onChange={e => setConfig({ ...config, include_outcomes: e.target.checked })}
                            />
                            <span>Map to Course Outcomes (COs)</span>
                        </label>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        onClick={handleGenerate}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="spin" size={18} />
                                Agents Working...
                            </>
                        ) : (
                            <>
                                <Bot size={18} />
                                Generate & Audit
                            </>
                        )}
                    </button>

                    {loading && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                Agent Status:
                            </div>
                            <div className="agent-status-msg" style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>
                                ➤ Generator Agent creating initial draft...
                            </div>
                            <div className="agent-status-msg" style={{ animationDelay: '1s', color: 'var(--warning)' }}>
                                ➤ Auditor Agent reviewing against constraints...
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Panel */}
                <div className="card" style={{ minHeight: '500px' }}>
                    {!result ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                            <Database size={64} style={{ marginBottom: '1rem' }} />
                            <h3>Ready to Generate</h3>
                            <p>Configure parameters and start the dual-agent workflow.</p>
                        </div>
                    ) : (
                        <div className="fade-in">
                            {/* Agent Status Bar */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                    <div className="flex items-center gap-2" style={{ color: 'var(--success)', fontWeight: '600', marginBottom: '0.25rem' }}>
                                        <CheckCircle size={18} /> Generator Agent
                                    </div>
                                    <div style={{ fontSize: '0.85rem' }}>{result.generator_status}</div>
                                </div>
                                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                                    <div className="flex items-center gap-2" style={{ color: 'var(--primary)', fontWeight: '600', marginBottom: '0.25rem' }}>
                                        <Shield size={18} /> Auditor Agent
                                    </div>
                                    <div style={{ fontSize: '0.85rem' }}>{result.auditor_status}</div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem' }}>
                                <button
                                    onClick={() => setActiveTab('report')}
                                    style={{
                                        padding: '0.75rem 0',
                                        background: 'none',
                                        border: 'none',
                                        color: activeTab === 'report' ? 'var(--primary)' : 'var(--text-muted)',
                                        borderBottom: activeTab === 'report' ? '2px solid var(--primary)' : '2px solid transparent',
                                        fontWeight: activeTab === 'report' ? '600' : '400',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Audit Report
                                </button>
                                <button
                                    onClick={() => setActiveTab('questions')}
                                    style={{
                                        padding: '0.75rem 0',
                                        background: 'none',
                                        border: 'none',
                                        color: activeTab === 'questions' ? 'var(--primary)' : 'var(--text-muted)',
                                        borderBottom: activeTab === 'questions' ? '2px solid var(--primary)' : '2px solid transparent',
                                        fontWeight: activeTab === 'questions' ? '600' : '400',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Gen. Questions ({result.questions.length})
                                </button>
                            </div>

                            {activeTab === 'report' ? (
                                <div className="report-view">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                        <h3 style={{ margin: 0 }}>Quality Score</h3>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: result.audit_report.score >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                                            {result.audit_report.score}/100
                                        </div>
                                    </div>

                                    <h4 style={{ marginBottom: '1rem' }}>Bloom's Taxonomy Coverage</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                        {Object.entries(result.audit_report.bloom_coverage).map(([level, pct]) => (
                                            <div key={level} style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{level}</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{pct}%</div>
                                            </div>
                                        ))}
                                    </div>

                                    {result.audit_report.issues.length > 0 ? (
                                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '0.5rem' }}>
                                            <h4 style={{ color: 'var(--danger)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <AlertTriangle size={18} /> Auditor Flagged Issues
                                            </h4>
                                            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                {result.audit_report.issues.map((issue, i) => (
                                                    <li key={i}>{issue}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                                            <CheckCircle size={20} />
                                            No issues detected. Balanced question bank.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="questions-view" style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {result.questions.map((q) => (
                                        <motion.div
                                            key={q.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                background: 'var(--bg-tertiary)',
                                                padding: '1rem',
                                                borderRadius: '0.5rem',
                                                marginBottom: '1rem',
                                                borderLeft: `4px solid ${q.difficulty === 'Easy' ? 'var(--success)' :
                                                        q.difficulty === 'Medium' ? 'var(--warning)' : 'var(--danger)'
                                                    }`
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                        {q.type}
                                                    </span>
                                                    <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                        {q.bloom_level}
                                                    </span>
                                                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                        {q.course_outcome}
                                                    </span>
                                                </div>
                                                <div style={{ fontWeight: 'bold' }}>{q.marks} Marks</div>
                                            </div>
                                            <p style={{ fontSize: '1rem', fontWeight: '500' }}>{q.id}. {q.question}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestionBank;
