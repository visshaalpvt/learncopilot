import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, AlertCircle, Sparkles, Brain, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import MockAI from '../services/mockAI';

function TheoryMode() {
    const location = useLocation();
    const [selectedTopic, setSelectedTopic] = useState(location.state?.topic || null);
    const [theoryContent, setTheoryContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [aiExplanation, setAiExplanation] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [availableTopics] = useState([
        { id: 'topic_0', name: 'Data Structures' },
        { id: 'topic_1', name: 'Algorithms' },
        { id: 'topic_2', name: 'Object Oriented Programming' },
        { id: 'topic_3', name: 'Database Management Systems' },
        { id: 'topic_4', name: 'Computer Networks' },
    ]);

    useEffect(() => {
        if (selectedTopic) {
            fetchTheoryContent(selectedTopic);
        }
    }, [selectedTopic]);

    const fetchTheoryContent = async (topic) => {
        setLoading(true);
        setAiExplanation('');
        setIsAiTyping(true);

        try {
            const response = await api.post('/theory/get-content', {
                topic_id: topic.id,
                topic_name: topic.name,
            });
            setTheoryContent(response.data);
            setAiExplanation(response.data.ai_explanation || '');
        } catch (error) {
            console.error('Failed to fetch theory content:', error);
            setAiExplanation('Sorry, I encountered an error while retrieving the grounded context. Please try again or check your knowledge base.');
        } finally {
            setLoading(false);
            setIsAiTyping(false);
        }
    };

    const handleMarkComplete = async () => {
        try {
            await api.post('/progress/update', {
                topic_id: selectedTopic.id,
                topic_name: selectedTopic.name,
                is_completed: true,
            });
            alert('🎉 Topic marked as completed!');
        } catch (error) {
            console.error('Failed to update progress:', error);
        }
    };

    const handleMarkConfused = async () => {
        try {
            await api.post('/progress/update', {
                topic_id: selectedTopic.id,
                topic_name: selectedTopic.name,
                is_confused: true,
            });
            alert('📚 Topic marked as needs review. The AI will help you understand it better!');
        } catch (error) {
            console.error('Failed to update progress:', error);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '1.5rem', height: 'calc(100vh - 4rem)' }}>
            {/* Left Sidebar - Topics List */}
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                style={{
                    width: '280px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    overflowY: 'auto',
                }}
            >
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={20} style={{ color: 'var(--primary)' }} />
                    Topics
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {availableTopics.map((topic, index) => (
                        <motion.div
                            key={topic.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setSelectedTopic(topic)}
                            whileHover={{ x: 5 }}
                            style={{
                                padding: '0.75rem',
                                background: selectedTopic?.id === topic.id ? 'var(--primary)' : 'var(--bg-tertiary)',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                color: selectedTopic?.id === topic.id ? 'white' : 'var(--text-primary)',
                                fontWeight: selectedTopic?.id === topic.id ? '500' : '400',
                            }}
                        >
                            {topic.name}
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Center Panel - Topic Explanation */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{
                    flex: 1,
                    background: 'var(--bg-secondary)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    overflowY: 'auto',
                }}
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{ display: 'inline-block', marginBottom: '1rem' }}
                        >
                            <Brain size={48} style={{ color: 'var(--primary)' }} />
                        </motion.div>
                        <div>AI is preparing your personalized content...</div>
                    </div>
                ) : theoryContent ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>
                            {theoryContent.topic_name}
                        </h1>

                        {/* AI Explanation Banner */}
                        {aiExplanation && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    padding: '1.25rem',
                                    marginBottom: '1.5rem',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    padding: '0.5rem 0.75rem',
                                    background: 'var(--bg-tertiary)',
                                    fontSize: '0.7rem',
                                    fontWeight: '600',
                                    color: 'var(--text-muted)',
                                    borderBottomLeftRadius: '8px',
                                    borderLeft: '1px solid var(--border)',
                                    borderBottom: '1px solid var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem'
                                }}>
                                    <CheckCircle size={12} color="#10B981" /> Grounded in Documents
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        background: 'var(--primary)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white'
                                    }}>
                                        <Sparkles size={16} />
                                    </div>
                                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>AI Tutor Insights</span>
                                    {isAiTyping && <Loader2 size={14} className="spin" style={{ color: 'var(--primary)' }} />}
                                </div>
                                <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: '0.9375rem' }}>
                                    {aiExplanation}
                                </p>

                                {theoryContent?.citations && theoryContent.citations.length > 0 && (
                                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <BookOpen size={12} /> SOURCES USED:
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {theoryContent.citations.slice(0, 3).map((cite, i) => (
                                                <div key={i} style={{
                                                    fontSize: '0.7rem',
                                                    padding: '0.25rem 0.625rem',
                                                    background: 'var(--bg-tertiary)',
                                                    borderRadius: '4px',
                                                    color: 'var(--text-secondary)',
                                                    border: '1px solid var(--border)'
                                                }}>
                                                    {cite.filename} (p. {cite.page || '1'})
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Definition */}
                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                                📖 Definition
                            </h3>
                            <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>{theoryContent.definition}</p>
                        </section>

                        {/* Example */}
                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--success)' }}>
                                💡 Example
                            </h3>
                            <div
                                style={{
                                    padding: '1rem',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '0.5rem',
                                    borderLeft: '4px solid var(--success)',
                                }}
                            >
                                <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                                    {theoryContent.example}
                                </p>
                            </div>
                        </section>

                        {/* Common Mistakes */}
                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--warning)' }}>
                                ⚠️ Common Mistakes
                            </h3>
                            <ul style={{ paddingLeft: '1.5rem' }}>
                                {theoryContent.common_mistakes.map((mistake, index) => (
                                    <motion.li
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        style={{ marginBottom: '0.5rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}
                                    >
                                        {mistake}
                                    </motion.li>
                                ))}
                            </ul>
                        </section>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn btn-success"
                                onClick={handleMarkComplete}
                            >
                                <CheckCircle size={18} />
                                Mark as Completed
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn btn-secondary"
                                onClick={handleMarkConfused}
                            >
                                <AlertCircle size={18} />
                                I'm Confused
                            </motion.button>
                        </div>
                    </motion.div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <BookOpen size={64} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        </motion.div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Select a Topic</h3>
                        <p>Choose a topic from the left sidebar to start learning with AI-powered explanations</p>
                    </div>
                )}
            </motion.div>

            {/* Right Panel - Exam Answers */}
            <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                style={{
                    width: '320px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    overflowY: 'auto',
                }}
            >
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📝 Exam Answers
                </h2>

                {theoryContent ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* 2 Mark */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            style={{
                                padding: '1rem',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '0.5rem',
                                borderLeft: '4px solid var(--primary)',
                            }}
                        >
                            <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--primary)' }}>2 Marks</div>
                            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                                {theoryContent.exam_answers['2_mark']}
                            </p>
                        </motion.div>

                        {/* 5 Mark */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{
                                padding: '1rem',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '0.5rem',
                                borderLeft: '4px solid var(--success)',
                            }}
                        >
                            <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--success)' }}>5 Marks</div>
                            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                                {theoryContent.exam_answers['5_mark']}
                            </p>
                        </motion.div>

                        {/* 10 Mark */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                padding: '1rem',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '0.5rem',
                                borderLeft: '4px solid var(--warning)',
                            }}
                        >
                            <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--warning)' }}>10 Marks</div>
                            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                                {theoryContent.exam_answers['10_mark']}
                            </p>
                        </motion.div>

                        {/* Interview Relevance */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            style={{
                                padding: '1rem',
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(249, 115, 22, 0.1))',
                                borderRadius: '0.5rem',
                                borderLeft: '4px solid var(--danger)',
                            }}
                        >
                            <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--danger)' }}>
                                🎯 Interview Relevance
                            </div>
                            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                                {theoryContent.exam_answers.interview_relevance}
                            </p>
                        </motion.div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        <p>Exam answers will appear here when you select a topic</p>
                    </div>
                )}
            </motion.div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}

export default TheoryMode;
