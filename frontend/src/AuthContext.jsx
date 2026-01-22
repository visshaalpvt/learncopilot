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
            // Case where user is in Firebase but not in our DB (e.g. first time Google login)
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
        await fetchUser();
        return userCredential.user;
    };

    const loginWithGoogle = async () => {
        try {
            console.log("Starting Google login...");
            const provider = new GoogleAuthProvider();
            // Optional: force account selection
            provider.setCustomParameters({ prompt: 'select_account' });

            const userCredential = await signInWithPopup(auth, provider);
            console.log("Google login successful, getting token...");

            const token = await getIdToken(userCredential.user);
            localStorage.setItem('token', token);

            await fetchUser();
            return userCredential.user;
        } catch (error) {
            console.error("Detailed Google Login Error:", error);
            // Re-throw to be caught by the component
            throw error;
        }
    };

    const register = async (userData) => {
        const { email, password, username, full_name } = userData;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const token = await getIdToken(userCredential.user);
        localStorage.setItem('token', token);

        // After Firebase registration, sync with our backend
        await api.post('/auth/register', {
            username,
            email,
            password, // Hashed on backend
            full_name
        });

        await fetchUser();
        return userCredential.user;
    };

    const logout = async () => {
        await signOut(auth);
        localStorage.removeItem('token');
        setUser(null);
        navigate('/');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
