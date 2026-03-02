import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    getIdToken,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { auth } from './firebase';
import api from './api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const token = await getIdToken(firebaseUser);
                localStorage.setItem('token', token);
                await fetchUser();
            } else {
                localStorage.removeItem('token');
                setUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchUser = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            if (error.response?.status === 401 && auth.currentUser) {
                console.log("User not in DB, attempting to sync...");
                const syncedUser = await syncGoogleUser(auth.currentUser);
                return syncedUser;
            }
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const syncGoogleUser = async (firebaseUser) => {
        try {
            await api.post('/auth/register', {
                username: firebaseUser.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_'),
                email: firebaseUser.email,
                password: 'google-auth-no-password',
                full_name: firebaseUser.displayName || firebaseUser.email.split('@')[0]
            });
            const response = await api.get('/auth/me');
            setUser(response.data);
            return response.data;
        } catch (err) {
            console.error('Failed to sync Google user:', err);
            throw err;
        }
    };

    const login = async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await getIdToken(userCredential.user);
        localStorage.setItem('token', token);
        fetchUser().catch(console.error);
        return userCredential.user;
    };

    const loginWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            const userCredential = await signInWithPopup(auth, provider);
            const token = await getIdToken(userCredential.user);
            localStorage.setItem('token', token);
            fetchUser().catch(console.error);
            return userCredential.user;
        } catch (error) {
            console.error("Detailed Google Login Error:", error);
            throw error;
        }
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const token = await getIdToken(userCredential.user);
        localStorage.setItem('token', token);
        api.post('/auth/register', {
            username, email, password, full_name,
            role: role || 'student',
            mode: mode || 'college'
        }).then(() => fetchUser()).catch(console.error);
        return userCredential.user;
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
        try { await signOut(auth); } catch (e) { /* demo mode */ }
        localStorage.clear();
        setUser(null);
        navigate('/');
    };

    return (
        <AuthContext.Provider value={{
            user, loading, login, loginWithGoogle, register, logout, demoLogin,
            updateRole, fetchUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

