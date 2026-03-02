import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Play, Square, Clock, BarChart3, MessageSquare, Brain, Award, ChevronRight } from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';

const SESSION_TYPES = {
    school: [
        { id: 'self_intro', label: 'Self Introduction', desc: 'Practice 60s self-intro', icon: '🎤', color: '#6366f1' },
        { id: 'reading', label: 'Reading Practice', desc: 'Read aloud fluently', icon: '📖', color: '#10b981' }
    ],
    college: [
        { id: 'self_intro', label: 'Self Introduction', desc: 'Practice 60s self-intro', icon: '🎤', color: '#6366f1' },
        { id: 'hr_interview', label: 'HR Interview', desc: 'Realistic HR simulation', icon: '💼', color: '#f59e0b' },
        { id: 'tech_interview', label: 'Tech Interview', desc: 'Technical Q&A', icon: '💻', color: '#8b5cf6' },
        { id: 'presentation', label: 'Presentation', desc: '3-min presentation', icon: '📊', color: '#ec4899' },
        { id: 'debate', label: 'Debate Mode', desc: 'Argue a position', icon: '⚖️', color: '#14b8a6' }
    ]
};

function CommunicationLab() {
    const { user } = useAuth();
    const mode = user?.mode || 'college';
    const [view, setView] = useState('menu');
    const [session, setSession] = useState(null);
    const [timer, setTimer] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const timerRef = useRef(null);

    useEffect(() => {
        api.get('/communication-lab/history').then(r => setHistory(r.data)).catch(() => { });
        return () => clearInterval(timerRef.current);
    }, []);

    const startSession = async (type) => {
        try {
            const res = await api.post('/communication-lab/start', { session_type: type, mode });
            setSession(res.data);
            setView('active');
            setTimer(res.data.timer_seconds || 120);
            setTranscript('');
            setResult(null);
            setChatMessages(res.data.first_question ? [{ role: 'ai', text: res.data.first_question }] : []);
            startTimer(res.data.timer_seconds || 120);
        } catch (err) { console.error(err); }
    };

    const startTimer = (seconds) => {
        let t = seconds;
        timerRef.current = setInterval(() => {
            t -= 1;
            setTimer(t);
            if (t <= 0) clearInterval(timerRef.current);
        }, 1000);
    };

    const toggleRecording = () => {
        if (isRecording) {
            setIsRecording(false);
        } else {
            setIsRecording(true);
            // Simulated speech recognition feedback
            setTimeout(() => setTranscript(prev => prev + ' [Speaking captured via microphone]'), 2000);
        }
    };

    const submitSession = async () => {
        clearInterval(timerRef.current);
        setIsRecording(false);
        const text = transcript || 'Sample speech demonstrating communication skills with clarity and confidence.';
        try {
            const res = await api.post('/communication-lab/evaluate', {
                session_id: session.session_id,
                transcript: text,
                duration_seconds: (session.timer_seconds || 120) - timer
            });
            setResult(res.data);
            setView('result');
            api.get('/communication-lab/history').then(r => setHistory(r.data)).catch(() => { });
        } catch (err) { console.error(err); }
    };

    const sendChat = async () => {
        if (!chatInput.trim()) return;
        const msg = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
        try {
            const res = await api.post('/communication-lab/conversation', {
                session_type: session?.session_type || 'hr_interview',
                user_message: msg
            });
            setChatMessages(prev => [...prev, { role: 'ai', text: res.data.response }]);
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'ai', text: 'Could not get response. Try again.' }]);
        }
    };

    const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const types = SESSION_TYPES[mode] || SESSION_TYPES.college;

    // Menu view
    if (view === 'menu') return (
        <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mic size={24} color="white" /></div>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>Communication AI Lab</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Practice speaking, interviews, and presentations with AI</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {types.map(t => (
                    <motion.div key={t.id} whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }} onClick={() => startSession(t.id)}
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', cursor: 'pointer', borderTop: `4px solid ${t.color}` }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{t.icon}</div>
                        <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{t.label}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>{t.desc}</div>
                        <div style={{ color: t.color, fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Start <ChevronRight size={16} /></div>
                    </motion.div>
                ))}
            </div>

            {history.length > 0 && (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}><Clock size={18} style={{ verticalAlign: 'middle' }} /> Past Sessions</h3>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {history.slice(0, 5).map(h => (
                            <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '0.85rem' }}>
                                <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{h.session_type.replace(/_/g, ' ')}</span>
                                <span>Score: <strong style={{ color: '#6366f1' }}>{h.scores?.overall || 0}%</strong></span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    // Active session
    if (view === 'active') return (
        <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '3rem', fontWeight: '700', color: timer < 10 ? '#ef4444' : '#6366f1', fontFamily: 'monospace' }}>{fmt(timer)}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{session?.instruction}</div>
                </div>

                {session?.passage && (
                    <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', lineHeight: '1.8', fontSize: '1.05rem' }}>{session.passage}</div>
                )}

                {session?.tips && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', justifyContent: 'center' }}>
                        {session.tips.map((tip, i) => <span key={i} style={{ padding: '0.3rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '0.8rem' }}>{tip}</span>)}
                    </div>
                )}

                {/* Chat for interviews */}
                {['hr_interview', 'tech_interview', 'debate'].includes(session?.session_type) && (
                    <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                        {chatMessages.map((m, i) => (
                            <div key={i} style={{ marginBottom: '0.75rem', textAlign: m.role === 'user' ? 'right' : 'left' }}>
                                <span style={{ padding: '0.5rem 0.75rem', borderRadius: '10px', display: 'inline-block', maxWidth: '80%', background: m.role === 'user' ? '#6366f1' : 'var(--bg-secondary)', color: m.role === 'user' ? 'white' : 'var(--text-primary)', fontSize: '0.9rem' }}>{m.text}</span>
                            </div>
                        ))}
                    </div>
                )}

                <textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Type your response here (or use microphone)..."
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', minHeight: '100px', marginBottom: '1rem', resize: 'vertical', fontSize: '0.95rem' }} />

                {['hr_interview', 'tech_interview', 'debate'].includes(session?.session_type) && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Reply to interviewer..."
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
                        <button onClick={sendChat} style={{ padding: '0.75rem 1rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><MessageSquare size={18} /></button>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={toggleRecording}
                        style={{ padding: '1rem', borderRadius: '50%', width: '60px', height: '60px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isRecording ? '#ef4444' : '#6366f1', color: 'white' }}>
                        {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={submitSession}
                        style={{ padding: '0.75rem 2rem', borderRadius: '12px', border: 'none', cursor: 'pointer', background: '#10b981', color: 'white', fontWeight: '600', fontSize: '1rem' }}>
                        <Square size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Finish & Evaluate
                    </motion.button>
                </div>
            </div>
        </div>
    );

    // Result view
    if (view === 'result' && result) return (
        <div className="fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2.5rem', textAlign: 'center' }}>
                <Award size={48} color="#f59e0b" style={{ marginBottom: '1rem' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Session Complete!</h2>
                <div style={{ fontSize: '3rem', fontWeight: '700', color: '#6366f1', marginBottom: '1.5rem' }}>{result.scores?.overall || 0}%</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
                    {['fluency', 'confidence', 'grammar', 'content'].map(key => (
                        <div key={key} style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{result.scores?.[key] || 0}%</div>
                            <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', marginTop: '0.5rem' }}>
                                <div style={{ height: '100%', width: `${result.scores?.[key] || 0}%`, background: '#6366f1', borderRadius: '2px' }} />
                            </div>
                        </div>
                    ))}
                </div>

                {result.feedback && (
                    <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '1rem', textAlign: 'left', marginBottom: '1.5rem' }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>AI Feedback</h4>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0, fontSize: '0.9rem' }}>{result.feedback}</p>
                    </div>
                )}

                <button onClick={() => setView('menu')} style={{ padding: '0.75rem 2rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Back to Lab</button>
            </motion.div>
        </div>
    );

    return null;
}

export default CommunicationLab;
