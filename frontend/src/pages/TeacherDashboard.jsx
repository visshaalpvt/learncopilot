import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, BookOpen, FileText, TrendingUp, BarChart3, Brain,
    Plus, Calendar, CheckCircle, AlertTriangle, ClipboardList,
    UserCheck, Sparkles, Send
} from 'lucide-react';
import api from '../api';

function TeacherDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [students, setStudents] = useState([]);
    const [tests, setTests] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateTest, setShowCreateTest] = useState(false);
    const [showCreateAssignment, setShowCreateAssignment] = useState(false);
    const [newTest, setNewTest] = useState({ title: '', subject: '', description: '', duration_minutes: 60, total_marks: 100, questions: [] });
    const [newAssignment, setNewAssignment] = useState({ title: '', subject: '', description: '', deadline: '', max_marks: 100 });
    const [lessonPlan, setLessonPlan] = useState(null);
    const [lpSubject, setLpSubject] = useState('');
    const [lpTopic, setLpTopic] = useState('');
    const [generatingLP, setGeneratingLP] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [statsRes, studentsRes, testsRes, assignmentsRes] = await Promise.all([
                api.get('/teacher/class-analytics'),
                api.get('/teacher/students'),
                api.get('/teacher/tests'),
                api.get('/teacher/assignments')
            ]);
            setStats(statsRes.data);
            setStudents(studentsRes.data);
            setTests(testsRes.data);
            setAssignments(assignmentsRes.data);
        } catch (err) {
            console.error(err);
            setStats({ total_students: 0, avg_completion: 0, weak_students: 0, total_tests: 0, total_assignments: 0, total_topics: 0 });
        }
        setLoading(false);
    };

    const createTest = async () => {
        try {
            const sampleQuestions = [
                { question: 'Sample question 1?', options: ['A', 'B', 'C', 'D'], correct: 0, marks: 5 },
                { question: 'Sample question 2?', options: ['A', 'B', 'C', 'D'], correct: 1, marks: 5 }
            ];
            await api.post('/teacher/tests/create', { ...newTest, questions: sampleQuestions });
            setShowCreateTest(false);
            setNewTest({ title: '', subject: '', description: '', duration_minutes: 60, total_marks: 100, questions: [] });
            fetchAll();
        } catch (err) { console.error(err); }
    };

    const publishTest = async (testId) => {
        try { await api.post(`/teacher/tests/${testId}/publish`); fetchAll(); }
        catch (err) { console.error(err); }
    };

    const createAssignment = async () => {
        try {
            await api.post('/teacher/assignments/create', newAssignment);
            setShowCreateAssignment(false);
            setNewAssignment({ title: '', subject: '', description: '', deadline: '', max_marks: 100 });
            fetchAll();
        } catch (err) { console.error(err); }
    };

    const generateLessonPlan = async () => {
        if (!lpSubject || !lpTopic) return;
        setGeneratingLP(true);
        try {
            const res = await api.post(`/teacher/generate-lesson-plan?subject=${lpSubject}&topic=${lpTopic}`);
            setLessonPlan(res.data.lesson_plan);
        } catch (err) { setLessonPlan('Failed to generate. Try again.'); }
        setGeneratingLP(false);
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'tests', label: 'Tests', icon: ClipboardList },
        { id: 'assignments', label: 'Assignments', icon: FileText },
        { id: 'lesson', label: 'AI Lesson Plan', icon: Sparkles }
    ];

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}><Brain size={48} color="#6366f1" /></motion.div></div>;

    return (
        <div className="fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserCheck size={24} color="white" /></div>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>Teacher Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>Manage classes, tests, and track student performance</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        padding: '0.625rem 1.25rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        background: activeTab === tab.id ? '#6366f1' : 'var(--bg-secondary)',
                        color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
                        fontWeight: '600', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap',
                        ...(activeTab !== tab.id && { border: '1px solid var(--border)' })
                    }}>
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview */}
            {activeTab === 'overview' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {[
                            { label: 'Total Students', value: stats?.total_students || 0, icon: Users, color: '#6366f1' },
                            { label: 'Avg Completion', value: `${stats?.avg_completion || 0}%`, icon: TrendingUp, color: '#10b981' },
                            { label: 'Weak Students', value: stats?.weak_students || 0, icon: AlertTriangle, color: '#f59e0b' },
                            { label: 'Tests Created', value: stats?.total_tests || 0, icon: ClipboardList, color: '#8b5cf6' },
                            { label: 'Assignments', value: stats?.total_assignments || 0, icon: FileText, color: '#ec4899' }
                        ].map((card, i) => (
                            <motion.div key={i} whileHover={{ y: -3 }} style={{
                                background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem',
                                borderLeft: `4px solid ${card.color}`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '40px', height: '40px', background: `${card.color}15`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <card.icon size={20} color={card.color} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{card.label}</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{card.value}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Students */}
            {activeTab === 'students' && (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {students.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No students found</div>
                    ) : students.map(s => (
                        <motion.div key={s.id} whileHover={{ y: -2 }} style={{
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: s.is_weak ? '#fef2f2' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: s.is_weak ? '#ef4444' : '#10b981', fontSize: '0.875rem' }}>
                                    {(s.full_name || s.username || 'U')[0].toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600' }}>{s.full_name || s.username}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.email}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                                <div><span style={{ color: 'var(--text-muted)' }}>Progress: </span><strong>{s.progress_pct}%</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>XP: </span><strong>{s.xp_points}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Streak: </span><strong>{s.study_streak}d</strong></div>
                                {s.is_weak && <span style={{ background: '#fef2f2', color: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>Needs Help</span>}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Tests */}
            {activeTab === 'tests' && (
                <div>
                    <button onClick={() => setShowCreateTest(!showCreateTest)} style={{
                        padding: '0.75rem 1.5rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem'
                    }}><Plus size={18} /> Create Test</button>

                    {showCreateTest && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <input placeholder="Test Title" value={newTest.title} onChange={e => setNewTest({ ...newTest, title: e.target.value })} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
                                <input placeholder="Subject" value={newTest.subject} onChange={e => setNewTest({ ...newTest, subject: e.target.value })} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
                            </div>
                            <textarea placeholder="Description" value={newTest.description} onChange={e => setNewTest({ ...newTest, description: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', minHeight: '80px', marginBottom: '1rem', resize: 'vertical' }} />
                            <button onClick={createTest} style={{ padding: '0.75rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}><CheckCircle size={16} style={{ verticalAlign: 'middle' }} /> Save Test</button>
                        </motion.div>
                    )}

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {tests.map(t => (
                            <div key={t.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontWeight: '600' }}>{t.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.subject} • {t.question_count} questions • {t.duration_minutes}min</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', background: t.is_published ? '#ecfdf5' : '#fef3c7', color: t.is_published ? '#10b981' : '#f59e0b' }}>{t.is_published ? 'Published' : 'Draft'}</span>
                                    {!t.is_published && <button onClick={() => publishTest(t.id)} style={{ padding: '0.4rem 0.75rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}><Send size={14} /> Publish</button>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Assignments */}
            {activeTab === 'assignments' && (
                <div>
                    <button onClick={() => setShowCreateAssignment(!showCreateAssignment)} style={{
                        padding: '0.75rem 1.5rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem'
                    }}><Plus size={18} /> Create Assignment</button>

                    {showCreateAssignment && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <input placeholder="Title" value={newAssignment.title} onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
                                <input placeholder="Subject" value={newAssignment.subject} onChange={e => setNewAssignment({ ...newAssignment, subject: e.target.value })} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
                            </div>
                            <textarea placeholder="Description" value={newAssignment.description} onChange={e => setNewAssignment({ ...newAssignment, description: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', minHeight: '80px', marginBottom: '1rem', resize: 'vertical' }} />
                            <input type="datetime-local" value={newAssignment.deadline} onChange={e => setNewAssignment({ ...newAssignment, deadline: e.target.value })} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', marginBottom: '1rem' }} />
                            <button onClick={createAssignment} style={{ padding: '0.75rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}><CheckCircle size={16} style={{ verticalAlign: 'middle' }} /> Save Assignment</button>
                        </motion.div>
                    )}

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {assignments.map(a => (
                            <div key={a.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem' }}>
                                <div style={{ fontWeight: '600' }}>{a.title}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.subject} • Due: {a.deadline ? new Date(a.deadline).toLocaleDateString() : 'N/A'} • {a.submissions} submissions</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Lesson Plan */}
            {activeTab === 'lesson' && (
                <div>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><Sparkles size={20} color="#6366f1" /> AI Lesson Plan Generator</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Subject</label>
                                <input value={lpSubject} onChange={e => setLpSubject(e.target.value)} placeholder="e.g., Computer Science" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Topic</label>
                                <input value={lpTopic} onChange={e => setLpTopic(e.target.value)} placeholder="e.g., Binary Trees" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
                            </div>
                            <button onClick={generateLessonPlan} disabled={generatingLP} style={{ padding: '0.75rem 1.5rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', height: 'fit-content' }}>
                                {generatingLP ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </div>
                    {lessonPlan && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem' }}>
                            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'var(--text-primary)', lineHeight: '1.7', margin: 0 }}>{lessonPlan}</pre>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}

export default TeacherDashboard;
