import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, FileText, Award, TrendingUp, Target, Brain, Plus, Trash2, Save } from 'lucide-react';
import api from '../api';

function CareerDashboard() {
    const [activeTab, setActiveTab] = useState('resume');
    const [resume, setResume] = useState({ full_name: '', email: '', phone: '', summary: '', education: [], experience: [], skills: [], projects: [], certifications: [] });
    const [analysis, setAnalysis] = useState(null);
    const [interviewStats, setInterviewStats] = useState(null);
    const [hasResume, setHasResume] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [newSkill, setNewSkill] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [resumeRes, interviewRes] = await Promise.all([
                api.get('/career/resume'),
                api.get('/career/interview-tracker')
            ]);
            if (resumeRes.data.exists) {
                setResume(resumeRes.data);
                setHasResume(true);
            }
            setInterviewStats(interviewRes.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const saveResume = async () => {
        setSaving(true);
        try {
            await api.post('/career/resume/save', resume);
            setHasResume(true);
        } catch (err) { console.error(err); }
        setSaving(false);
    };

    const analyzeResume = async () => {
        setAnalyzing(true);
        try {
            const res = await api.post('/career/resume/analyze');
            setAnalysis(res.data);
        } catch (err) { console.error(err); }
        setAnalyzing(false);
    };

    const addSkill = () => {
        if (newSkill.trim()) {
            setResume(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
            setNewSkill('');
        }
    };

    const addProject = () => {
        setResume(prev => ({ ...prev, projects: [...prev.projects, { name: '', description: '', tech: '' }] }));
    };

    const updateProject = (idx, field, value) => {
        setResume(prev => {
            const p = [...prev.projects];
            p[idx] = { ...p[idx], [field]: value };
            return { ...prev, projects: p };
        });
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}><Brain size={48} color="#6366f1" /></motion.div></div>;

    const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.9rem' };

    return (
        <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Briefcase size={24} color="white" /></div>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>Career Intelligence</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Resume builder, ATS scoring & placement readiness</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                {[
                    { id: 'resume', label: 'Resume Builder', icon: FileText },
                    { id: 'analysis', label: 'ATS Analysis', icon: Target },
                    { id: 'interview', label: 'Interview Prep', icon: Award }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        padding: '0.625rem 1.25rem', borderRadius: '10px', border: activeTab === tab.id ? 'none' : '1px solid var(--border)', cursor: 'pointer',
                        background: activeTab === tab.id ? '#6366f1' : 'var(--bg-secondary)',
                        color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
                        fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}><tab.icon size={16} /> {tab.label}</button>
                ))}
            </div>

            {activeTab === 'resume' && (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Full Name</label><input value={resume.full_name} onChange={e => setResume({ ...resume, full_name: e.target.value })} style={inputStyle} /></div>
                        <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</label><input value={resume.email} onChange={e => setResume({ ...resume, email: e.target.value })} style={inputStyle} /></div>
                        <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone</label><input value={resume.phone || ''} onChange={e => setResume({ ...resume, phone: e.target.value })} style={inputStyle} /></div>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Professional Summary</label>
                        <textarea value={resume.summary || ''} onChange={e => setResume({ ...resume, summary: e.target.value })} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                    </div>

                    {/* Skills */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Skills</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            {(resume.skills || []).map((s, i) => (
                                <span key={i} style={{ padding: '0.3rem 0.75rem', background: 'rgba(99,102,241,0.15)', color: '#6366f1', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    {s} <Trash2 size={12} style={{ cursor: 'pointer' }} onClick={() => setResume(prev => ({ ...prev, skills: prev.skills.filter((_, j) => j !== i) }))} />
                                </span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} placeholder="Add skill" style={{ ...inputStyle, width: 'auto', flex: 1 }} />
                            <button onClick={addSkill} style={{ padding: '0.5rem 1rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Plus size={16} /></button>
                        </div>
                    </div>

                    {/* Projects */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Projects</label>
                        {(resume.projects || []).map((p, i) => (
                            <div key={i} style={{ background: 'var(--bg-tertiary)', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' }}>
                                <input value={p.name || ''} onChange={e => updateProject(i, 'name', e.target.value)} placeholder="Project name" style={{ ...inputStyle, marginBottom: '0.5rem' }} />
                                <input value={p.description || ''} onChange={e => updateProject(i, 'description', e.target.value)} placeholder="Description" style={{ ...inputStyle, marginBottom: '0.5rem' }} />
                                <input value={p.tech || ''} onChange={e => updateProject(i, 'tech', e.target.value)} placeholder="Tech stack" style={inputStyle} />
                            </div>
                        ))}
                        <button onClick={addProject} style={{ padding: '0.5rem 1rem', border: '1px dashed var(--border)', borderRadius: '8px', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}><Plus size={14} /> Add Project</button>
                    </div>

                    <button onClick={saveResume} disabled={saving} style={{ padding: '0.75rem 2rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}><Save size={16} style={{ verticalAlign: 'middle' }} /> {saving ? 'Saving...' : 'Save Resume'}</button>
                </div>
            )}

            {activeTab === 'analysis' && (
                <div>
                    <button onClick={analyzeResume} disabled={analyzing || !hasResume} style={{ padding: '0.75rem 2rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', marginBottom: '1.5rem' }}>
                        <Brain size={16} style={{ verticalAlign: 'middle' }} /> {analyzing ? 'Analyzing...' : 'Run ATS Analysis'}
                    </button>
                    {!hasResume && <p style={{ color: '#f59e0b' }}>Save your resume first.</p>}

                    {analysis && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ATS Score</div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#6366f1' }}>{analysis.ats_score}%</div>
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Placement Ready</div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#10b981' }}>{analysis.placement_readiness}%</div>
                                </div>
                            </div>

                            {analysis.skill_gaps?.length > 0 && (
                                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                                    <h3 style={{ marginBottom: '1rem' }}><Target size={18} style={{ verticalAlign: 'middle' }} /> Skill Gaps</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {analysis.skill_gaps.map((g, i) => <span key={i} style={{ padding: '0.35rem 0.75rem', background: '#fef2f2', color: '#ef4444', borderRadius: '6px', fontSize: '0.85rem' }}>{g}</span>)}
                                    </div>
                                </div>
                            )}

                            {analysis.ai_feedback && (
                                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem' }}>
                                    <h3 style={{ marginBottom: '1rem' }}><Brain size={18} style={{ verticalAlign: 'middle' }} /> AI Feedback</h3>
                                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, lineHeight: '1.6', color: 'var(--text-secondary)' }}>{analysis.ai_feedback}</pre>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            )}

            {activeTab === 'interview' && interviewStats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {[
                        { label: 'HR Interviews', value: interviewStats.hr_interviews.total, sub: `Avg: ${interviewStats.hr_interviews.avg_score}%`, color: '#f59e0b' },
                        { label: 'Tech Interviews', value: interviewStats.tech_interviews.total, sub: `Avg: ${interviewStats.tech_interviews.avg_score}%`, color: '#8b5cf6' },
                        { label: 'Practice Time', value: `${interviewStats.total_practice_minutes}m`, sub: 'Total practice', color: '#10b981' },
                        { label: 'Readiness', value: interviewStats.readiness_level, sub: 'Keep practicing!', color: '#6366f1' }
                    ].map((c, i) => (
                        <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem', borderLeft: `4px solid ${c.color}` }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.label}</div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', textTransform: 'capitalize' }}>{c.value}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.sub}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CareerDashboard;
