import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, LogOut, Moon, Sun, Brain, Volume2, Bell, Shield } from 'lucide-react';
import { useAuth } from '../AuthContext';

function Settings() {
    const { user, logout } = useAuth();
    const [settings, setSettings] = useState({
        theme: 'dark',
        language: 'Python',
        aiAssistant: true,
        notifications: true,
        soundEffects: false,
    });

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Settings</h1>
                <p style={{ color: 'var(--text-muted)' }}>Manage your account and preferences</p>
            </div>

            <div style={{ maxWidth: '700px' }}>
                {/* User Profile */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                    style={{ marginBottom: '1.5rem' }}
                >
                    <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={20} style={{ color: 'var(--primary)' }} />
                        User Profile
                    </h2>
                    <p className="card-description" style={{ marginBottom: '1.5rem' }}>
                        Your account information
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                fontWeight: '700',
                                color: 'white',
                            }}
                        >
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </motion.div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{user?.username || 'User'}</div>
                            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Mail size={14} />
                                {user?.email || 'email@example.com'}
                            </div>
                            {user?.full_name && (
                                <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    {user.full_name}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{
                        padding: '1rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                    }}>
                        <Shield size={20} style={{ color: 'var(--success)' }} />
                        <div>
                            <div style={{ fontWeight: '500', color: 'var(--success)' }}>Account Verified</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                Your account is in good standing
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* AI Assistant Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card"
                    style={{ marginBottom: '1.5rem' }}
                >
                    <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Brain size={20} style={{ color: 'var(--primary)' }} />
                        AI Assistant
                    </h2>
                    <p className="card-description" style={{ marginBottom: '1.5rem' }}>
                        Configure your AI learning companion
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div
                            style={{
                                padding: '1rem',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: '500' }}>AI Chat Assistant</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    Show floating AI chat button on all pages
                                </div>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => updateSetting('aiAssistant', !settings.aiAssistant)}
                                style={{
                                    width: '50px',
                                    height: '28px',
                                    borderRadius: '14px',
                                    background: settings.aiAssistant ? 'var(--primary)' : 'var(--bg-secondary)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <motion.div
                                    animate={{ x: settings.aiAssistant ? 22 : 2 }}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: 'white',
                                        position: 'absolute',
                                        top: '2px',
                                    }}
                                />
                            </motion.button>
                        </div>

                        <div
                            style={{
                                padding: '1rem',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: '500' }}>AI Voice (Coming Soon)</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    Enable text-to-speech for AI responses
                                </div>
                            </div>
                            <div style={{
                                padding: '0.25rem 0.75rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                            }}>
                                Coming Soon
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Preferences */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="card"
                    style={{ marginBottom: '1.5rem' }}
                >
                    <h2 className="card-title">Preferences</h2>
                    <p className="card-description" style={{ marginBottom: '1.5rem' }}>
                        Customize your learning experience
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div
                            style={{
                                padding: '1rem',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Moon size={18} style={{ color: 'var(--primary)' }} />
                                <div>
                                    <div style={{ fontWeight: '500' }}>Theme</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        Dark Mode (Default)
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: '1rem',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: '500' }}>Default Language</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    For practical mode code editor
                                </div>
                            </div>
                            <select
                                value={settings.language}
                                onChange={(e) => updateSetting('language', e.target.value)}
                                className="form-select"
                                style={{ width: 'auto' }}
                            >
                                <option>Python</option>
                                <option>C</option>
                            </select>
                        </div>

                        <div
                            style={{
                                padding: '1rem',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Bell size={18} style={{ color: 'var(--warning)' }} />
                                <div>
                                    <div style={{ fontWeight: '500' }}>Study Reminders</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        Get daily learning notifications
                                    </div>
                                </div>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => updateSetting('notifications', !settings.notifications)}
                                style={{
                                    width: '50px',
                                    height: '28px',
                                    borderRadius: '14px',
                                    background: settings.notifications ? 'var(--success)' : 'var(--bg-secondary)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <motion.div
                                    animate={{ x: settings.notifications ? 22 : 2 }}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: 'white',
                                        position: 'absolute',
                                        top: '2px',
                                    }}
                                />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Account Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card"
                >
                    <h2 className="card-title">Account Actions</h2>
                    <p className="card-description" style={{ marginBottom: '1.5rem' }}>
                        Manage your session
                    </p>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn btn-danger"
                        onClick={logout}
                        style={{ width: '100%' }}
                    >
                        <LogOut size={18} />
                        Logout
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
}

export default Settings;
