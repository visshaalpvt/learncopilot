import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { motion } from 'framer-motion';

function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, demoLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(formData.email, formData.password);
            navigate('/app/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="auth-card"
            >
                <div className="auth-header">
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Sign in to your account</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            padding: '1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid var(--danger)',
                            borderRadius: '0.5rem',
                            marginBottom: '1.5rem',
                            color: 'var(--danger)',
                        }}
                    >
                        {error}
                    </motion.div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {[
                        { role: 'student', label: '🎓 Student Demo', bg: 'linear-gradient(135deg, #4f46e5, #8b5cf6)' },
                        { role: 'teacher', label: '👨‍🏫 Teacher Demo', bg: 'linear-gradient(135deg, #059669, #10b981)' },
                        { role: 'parent', label: '👪 Parent Demo', bg: 'linear-gradient(135deg, #d97706, #f59e0b)' },
                        { role: 'admin', label: '🛡️ Admin Demo', bg: 'linear-gradient(135deg, #dc2626, #ef4444)' }
                    ].map(d => (
                        <button key={d.role} onClick={async () => { setLoading(true); const u = await demoLogin(d.role); const dest = d.role === 'student' && !u.onboarding_completed ? '/onboarding' : d.role === 'teacher' ? '/app/teacher' : d.role === 'parent' ? '/app/parent' : d.role === 'admin' ? '/app/admin' : '/app/dashboard'; navigate(dest); }}
                            className="btn" disabled={loading}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: d.bg, color: 'white', border: 'none', fontWeight: '600', fontSize: '0.85rem', padding: '0.65rem' }}>
                            {d.label}
                        </button>
                    ))}
                </div>

                <div style={{ position: 'relative', marginBottom: '1.5rem', textAlign: 'center' }}>
                    <hr style={{ border: '0', borderTop: '1px solid #e5e7eb' }} />
                    <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--card-bg)', padding: '0 10px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        or sign in with email
                    </span>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', fontWeight: '600' }} disabled={loading}>
                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'white' }}></div>
                                Authenticating...
                            </div>
                        ) : 'Sign In'}
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>
                        Register here
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

export default Login;
