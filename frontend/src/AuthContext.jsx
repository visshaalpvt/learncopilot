import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser().catch(() => {
                localStorage.removeItem('token');
                setUser(null);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { access_token, user: userData } = response.data;
        localStorage.setItem('token', access_token);
        setUser(userData);
        return userData;
    };

    const demoLogin = async (role = 'student') => {
        setLoading(true);
        localStorage.setItem('token', 'demo-token');
        try {
            // First sync with backend to create demo user in DB
            await api.post('/auth/register', {
                username: 'Scholar_Path_Demo',
                email: 'demo@learncopilot.ai',
                password: 'demo',
                full_name: 'Demo Student',
                role: role,
                mode: 'college'
            });
        } catch (e) { /* user may already exist */ }
        try {
            // Update role if needed
            await api.post('/auth/update-role', { role, mode: 'college' });
        } catch (e) { /* ignore */ }
        try {
            const res = await api.get('/auth/me');
            const u = { ...res.data, is_demo: true };
            setUser(u);
            setLoading(false);
            return u;
        } catch (e) {
            // Fallback mock user if backend is down
            const mockUser = {
                id: 'demo_user',
                username: 'Scholar_Path_Demo',
                email: 'demo@learncopilot.ai',
                full_name: 'Demo Student',
                role: role,
                mode: 'college',
                onboarding_completed: role !== 'student',
                is_demo: true
            };
            setUser(mockUser);
            setLoading(false);
            return mockUser;
        }
    };

    const register = async (userData) => {
        const { email, password, username, full_name, role, mode } = userData;
        const response = await api.post('/auth/register', {
            username, email, password, full_name,
            role: role || 'student',
            mode: mode || 'college'
        });
        const { access_token, user: newUser } = response.data;
        localStorage.setItem('token', access_token);
        setUser(newUser);
        return newUser;
    };

    const updateRole = async (role, mode) => {
        try {
            const response = await api.post('/auth/update-role', { role, mode });
            setUser(response.data);
            return response.data;
        } catch (error) {
            console.error('Failed to update role:', error);
            if (user?.is_demo) {
                const updated = { ...user, role: role || user.role, mode: mode || user.mode };
                setUser(updated);
                return updated;
            }
            throw error;
        }
    };

    const logout = async () => {
        localStorage.clear();
        setUser(null);
        navigate('/');
    };

    return (
        <AuthContext.Provider value={{
            user, loading, login, register, logout, demoLogin,
            updateRole, fetchUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
