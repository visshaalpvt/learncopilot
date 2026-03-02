import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, BarChart3, Settings, Trash2, UserCheck, Brain, Activity } from 'lucide-react';
import api from '../api';

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('stats');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [engagement, setEngagement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState('');

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [s, u, e] = await Promise.all([
                api.get('/admin/platform-stats'),
                api.get('/admin/users'),
                api.get('/admin/engagement-metrics')
            ]);
            setStats(s.data);
            setUsers(u.data);
            setEngagement(e.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const updateRole = async (userId, newRole) => {
        try {
            await api.post(`/admin/users/${userId}/role?new_role=${newRole}`);
            fetchAll();
        } catch (err) { console.error(err); }
    };

    const deleteUser = async (userId) => {
        if (!confirm('Delete this user?')) return;
        try { await api.delete(`/admin/users/${userId}`); fetchAll(); }
        catch (err) { console.error(err); }
    };

    const filteredUsers = roleFilter ? users.filter(u => u.role === roleFilter) : users;

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                <Brain size={48} color="#6366f1" />
            </motion.div>
        </div>
    );

    return (
        <div className="fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={24} color="white" />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>Admin Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Platform management & analytics</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                {[
                    { id: 'stats', label: 'Platform Stats', icon: BarChart3 },
                    { id: 'users', label: 'User Management', icon: Users },
                    { id: 'engagement', label: 'Engagement', icon: Activity }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        padding: '0.625rem 1.25rem', borderRadius: '10px', border: activeTab === tab.id ? 'none' : '1px solid var(--border)', cursor: 'pointer',
                        background: activeTab === tab.id ? '#6366f1' : 'var(--bg-secondary)',
                        color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
                        fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'stats' && stats && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {[
                            { label: 'Total Users', value: stats.users.total, color: '#6366f1' },
                            { label: 'Students', value: stats.users.students, color: '#10b981' },
                            { label: 'Teachers', value: stats.users.teachers, color: '#f59e0b' },
                            { label: 'Parents', value: stats.users.parents, color: '#ec4899' },
                            { label: 'Syllabi Uploaded', value: stats.content.syllabi, color: '#8b5cf6' },
                            { label: 'Tests Created', value: stats.content.tests, color: '#3b82f6' },
                            { label: 'Onboarding Rate', value: `${stats.engagement.onboarding_rate}%`, color: '#14b8a6' },
                            { label: 'Topics Completed', value: stats.engagement.completed_topics, color: '#f97316' }
                        ].map((c, i) => (
                            <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem', borderLeft: `4px solid ${c.color}` }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.label}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{c.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {['', 'student', 'teacher', 'parent', 'admin'].map(r => (
                            <button key={r} onClick={() => setRoleFilter(r)} style={{
                                padding: '0.4rem 0.75rem', borderRadius: '6px', border: roleFilter === r ? 'none' : '1px solid var(--border)', fontSize: '0.8rem',
                                background: roleFilter === r ? '#6366f1' : 'var(--bg-secondary)', color: roleFilter === r ? 'white' : 'var(--text-primary)', cursor: 'pointer'
                            }}>{r || 'All'}</button>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {filteredUsers.map(u => (
                            <div key={u.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div>
                                    <span style={{ fontWeight: '600' }}>{u.full_name || u.username}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{u.email}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <select value={u.role} onChange={e => updateRole(u.id, e.target.value)} style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="parent">Parent</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <button onClick={() => deleteUser(u.id)} style={{ padding: '0.3rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'engagement' && engagement && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {[
                        { label: 'Active Students', value: engagement.active_students, sub: `${engagement.activity_rate}% activity rate` },
                        { label: 'Avg Study Streak', value: `${engagement.avg_study_streak} days`, sub: 'Across all students' },
                        { label: 'Avg XP Points', value: Math.round(engagement.avg_xp_points), sub: 'Per student' },
                        { label: 'Communication Sessions', value: engagement.communication_sessions, sub: 'Total practice sessions' }
                    ].map((c, i) => (
                        <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{c.label}</div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>{c.value}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.sub}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
