import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { motion } from 'framer-motion';

function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle, demoLogin } = useAuth();
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
            let errorMessage = 'Login failed. Please check your credentials.';
            if (err.code === 'auth/user-not-found') errorMessage = 'No user found with this email.';
            if (err.code === 'auth/wrong-password') errorMessage = 'Wrong password.';
            if (err.code === 'auth/invalid-email') errorMessage = 'Invalid email address.';

            setError(err.response?.data?.detail || errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            await loginWithGoogle();
            navigate('/app/dashboard');
        } catch (err) {
            console.error('Google login error:', err);
            setError(err.message || 'Google sign-in failed.');
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

                <button
                    onClick={handleGoogleLogin}
                    className="btn"
                    style={{
                        width: '100%',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        background: 'white',
                        color: '#1f2937',
                        border: '1px solid #e5e7eb',
                        fontWeight: '600',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    disabled={loading}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

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
                        or
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
