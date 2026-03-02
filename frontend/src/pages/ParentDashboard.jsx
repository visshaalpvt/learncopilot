import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, AlertTriangle, Calendar, Bell, Brain, BookOpen, BarChart3 } from 'lucide-react';
import api from '../api';

function ParentDashboard() {
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [childDashboard, setChildDashboard] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [linkEmail, setLinkEmail] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [childrenRes, msgRes] = await Promise.all([
                api.get('/parent/children'),
                api.get('/parent/messages')
            ]);
            setChildren(childrenRes.data);
            setMessages(msgRes.data);
            if (childrenRes.data.length > 0) {
                setSelectedChild(childrenRes.data[0]);
                const dash = await api.get(`/parent/child/${childrenRes.data[0].id}/dashboard`);
                setChildDashboard(dash.data);
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const linkChild = async () => {
        if (!linkEmail) return;
        try {
            await api.post(`/parent/link-child?student_email=${linkEmail}`);
            setLinkEmail('');
            fetchData();
        } catch (err) { console.error(err); }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                <Brain size={48} color="#6366f1" />
            </motion.div>
        </div>
    );

    const d = childDashboard;

    return (
        <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={24} color="white" />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>Parent Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Monitor your child's learning progress</p>
                </div>
            </div>

            {/* Link child */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input value={linkEmail} onChange={e => setLinkEmail(e.target.value)} placeholder="Enter child's email to link"
                    style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', minWidth: '200px' }} />
                <button onClick={linkChild} style={{ padding: '0.65rem 1.25rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Link Child</button>
            </div>

            {children.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p>No children linked. Enter your child's email above.</p>
                </div>
            ) : d && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {[
                            { label: 'Progress', value: `${d.progress?.progress_pct || 0}%`, color: '#10b981' },
                            { label: 'Completed', value: `${d.progress?.completed || 0}/${d.progress?.total_topics || 0}`, color: '#6366f1' },
                            { label: 'Streak', value: `${d.student?.study_streak || 0} days`, color: '#f59e0b' },
                            { label: 'Confidence', value: `${Math.round(d.ai_profile?.confidence_score || 0)}%`, color: '#8b5cf6' }
                        ].map((c, i) => (
                            <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem', borderLeft: `4px solid ${c.color}` }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.label}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{c.value}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '1.5rem', marginBottom: '2rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}><Brain size={20} color="#6366f1" /> AI Summary</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>{d.ai_summary}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}><AlertTriangle size={18} color="#f59e0b" style={{ verticalAlign: 'middle' }} /> Needs Attention</h3>
                            {(d.progress?.weak_subjects || []).map((s, i) => (
                                <div key={i} style={{ padding: '0.5rem', background: '#fef2f2', borderRadius: '8px', color: '#ef4444', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{s}</div>
                            ))}
                            {!(d.progress?.weak_subjects?.length) && <p style={{ color: 'var(--text-muted)' }}>No weak subjects!</p>}
                        </div>
                        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}><Bell size={18} color="#6366f1" style={{ verticalAlign: 'middle' }} /> Messages</h3>
                            {messages.slice(0, 5).map(m => (
                                <div key={m.id} style={{ padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                    <strong>{m.title}</strong><br /><span style={{ color: 'var(--text-muted)' }}>{m.message}</span>
                                </div>
                            ))}
                            {!messages.length && <p style={{ color: 'var(--text-muted)' }}>No messages</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ParentDashboard;
