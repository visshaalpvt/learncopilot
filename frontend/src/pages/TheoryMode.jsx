import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, AlertCircle, Sparkles, Brain, Loader2, Upload, FileText, Database, Shield, Zap, Download, Target } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

function TheoryMode() {
    const location = useLocation();
    const navigate = useNavigate();
    const passedSubject = location.state?.subject || null;

    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(passedSubject);
    const [selectedTopic, setSelectedTopic] = useState(location.state?.topic || null);
    const [theoryContent, setTheoryContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [topicsLoading, setTopicsLoading] = useState(false);
    const [subjectsLoading, setSubjectsLoading] = useState(true);
    const [aiExplanation, setAiExplanation] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [availableTopics, setAvailableTopics] = useState([]);
    const [preAssessmentActive, setPreAssessmentActive] = useState(false);
    const [assessmentQuestions, setAssessmentQuestions] = useState([]);
    const [assessmentAnswers, setAssessmentAnswers] = useState({});
    const [assessmentLoading, setAssessmentLoading] = useState(false);
    const [capabilityScore, setCapabilityScore] = useState(null);

    // Load available subjects on mount
    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        setSubjectsLoading(true);
        try {
            const response = await api.get('/rag/subjects');
            const subjectList = response.data.subjects || [];
            setSubjects(subjectList);

            // If we have subjects but none selected, auto-select first
            if (subjectList.length > 0 && !selectedSubject) {
                setSelectedSubject(subjectList[0]);
            }
        } catch (error) {
            console.error('Failed to load subjects:', error);
        } finally {
            setSubjectsLoading(false);
        }
    };

    // Discover curriculum when subject changes
    useEffect(() => {
        if (selectedSubject) {
            discoverCurriculum(selectedSubject);
        }
    }, [selectedSubject]);

    const discoverCurriculum = async (subject) => {
        setTopicsLoading(true);
        setAvailableTopics([]);
        setSelectedTopic(null);
        setTheoryContent(null);

        try {
            const response = await api.get(`/rag/curriculum/${encodeURIComponent(subject)}`);
            if (response.data.topics && response.data.topics.length > 0) {
                setAvailableTopics(response.data.topics);
                // Auto-select first topic
                setSelectedTopic(response.data.topics[0]);
            }
        } catch (error) {
            console.error('Failed to discover curriculum:', error);
        } finally {
            setTopicsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedTopic) {
            setPreAssessmentActive(false);
            fetchTheoryContent(selectedTopic, 75);
        }
    }, [selectedTopic]);

    const startAssessment = async (topic) => {
        setAssessmentLoading(true);
        setPreAssessmentActive(true);
        setAssessmentAnswers({});
        setCapabilityScore(null);

        try {
            const response = await api.post('/theory/pre-assessment', {
                topic_id: topic.id,
                topic_name: topic.name,
                subject: selectedSubject
            });
            setAssessmentQuestions(response.data.questions || []);
        } catch (error) {
            console.error('Failed to load pre-assessment:', error);
            setPreAssessmentActive(false);
            fetchTheoryContent(topic, 75);
        } finally {
            setAssessmentLoading(false);
        }
    };

    const handleAssessmentSubmit = () => {
        let correctCount = 0;
        assessmentQuestions.forEach((q, idx) => {
            if (assessmentAnswers[idx] === q.answer_index) {
                correctCount++;
            }
        });
        const score = assessmentQuestions.length > 0 ? Math.round((correctCount / assessmentQuestions.length) * 100) : 75;
        setCapabilityScore(score);
        setPreAssessmentActive(false);
        fetchTheoryContent(selectedTopic, score);
    };

    const fetchTheoryContent = async (topic, score = 50) => {
        setLoading(true);
        setAiExplanation('');
        setIsAiTyping(true);

        try {
            const response = await api.post('/theory/get-content', {
                topic_id: topic.id,
                topic_name: topic.name,
                subject: selectedSubject,
                capability_score: score
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

    // Show upload prompt if no subjects indexed
    if (!subjectsLoading && subjects.length === 0) {
        return (
            <div className="fade-in" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 10rem)',
                textAlign: 'center',
                padding: '2rem'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'var(--bg-secondary)',
                        border: '2px dashed var(--border)',
                        borderRadius: '16px',
                        padding: '3rem',
                        maxWidth: '500px'
                    }}
                >
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'var(--primary-light)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem'
                    }}>
                        <Upload size={40} style={{ color: 'var(--primary)' }} />
                    </div>

                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        marginBottom: '0.75rem'
                    }}>
                        No Materials Indexed Yet
                    </h2>

                    <p style={{
                        color: 'var(--text-secondary)',
                        marginBottom: '1.5rem',
                        lineHeight: '1.6'
                    }}>
                        Upload your syllabus, PDFs, or lecture notes first.
                        The AI will read your documents and create a structured curriculum for learning.
                    </p>

                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/app/syllabus')}
                        style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}
                    >
                        <FileText size={18} />
                        Upload Materials
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <>
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
                        Curriculum
                    </h2>

                    {/* Subject Selector */}
                    {subjects.length > 1 && (
                        <select
                            value={selectedSubject || ''}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                marginBottom: '1rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                fontSize: '0.875rem'
                            }}
                        >
                            {subjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    )}

                    {selectedSubject && (
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--primary)',
                            background: 'var(--primary-light)',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            marginBottom: '1rem',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                        }}>
                            Focus: {selectedSubject}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {topicsLoading || subjectsLoading ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <Loader2 size={24} className="spin" style={{ color: 'var(--primary)', margin: '0 auto' }} />
                                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                                    Discovering curriculum from your documents...
                                </p>
                            </div>
                        ) : availableTopics.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Database size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                                <p style={{ fontSize: '0.8rem' }}>
                                    No topics extracted yet. The PDF may need more structured content.
                                </p>
                            </div>
                        ) : (
                            availableTopics.map((topic, index) => (
                                <motion.div
                                    key={topic.id || index}
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
                            ))
                        )}
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
                    {assessmentLoading ? (
                        <div style={{ textAlign: 'center', padding: '5rem' }}>
                            <Loader2 size={48} className="spin" color="var(--primary)" style={{ margin: '0 auto' }} />
                            <h2 style={{ marginTop: '1.5rem' }}>Gauging Your Capability...</h2>
                            <p style={{ color: 'var(--text-muted)' }}>AI Agent is generating diagnostic questions for this topic.</p>
                        </div>
                    ) : preAssessmentActive ? (
                        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ width: '50px', height: '50px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                    <Brain size={28} />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0 }}>Diagnostic Assessment</h2>
                                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>Answer these 3 quick questions so the AI can adapt the explanation to your level.</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {assessmentQuestions.map((q, qIdx) => (
                                    <div key={qIdx} className="card" style={{ padding: '1.5rem', border: '1px solid var(--border)' }}>
                                        <h4 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>{qIdx + 1}. {q.question}</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            {q.options.map((opt, oIdx) => (
                                                <button
                                                    key={oIdx}
                                                    onClick={() => setAssessmentAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                                                    style={{
                                                        padding: '0.75rem 1rem',
                                                        borderRadius: '8px',
                                                        border: assessmentAnswers[qIdx] === oIdx ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                        background: assessmentAnswers[qIdx] === oIdx ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                                                        textAlign: 'left',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        color: 'var(--text-primary)',
                                                        fontWeight: assessmentAnswers[qIdx] === oIdx ? '600' : '400'
                                                    }}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={handleAssessmentSubmit}
                                disabled={Object.keys(assessmentAnswers).length < assessmentQuestions.length}
                                style={{ marginTop: '2.5rem', width: '100%', height: '50px', fontSize: '1.1rem' }}
                            >
                                <Target size={20} /> Start Personalized Learning
                            </button>
                        </div>
                    ) : loading ? (
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
                    ) : (
                        <div style={{ flex: 1, display: 'flex', gap: '1.5rem', overflow: 'hidden' }}>
                            {/* Center Content Area */}
                            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {/* AI Agent Banner */}
                                {aiExplanation && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(30, 64, 175, 0.1))',
                                            border: '1px solid var(--primary-light)',
                                            borderRadius: '12px',
                                            padding: '1.25rem',
                                            marginBottom: '2rem',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.5rem' }}>
                                            <Sparkles size={18} /> AI Agent Synthesis
                                        </div>
                                        <div style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>
                                            {aiExplanation}
                                        </div>
                                        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Shield size={12} /> Grounded in your uploaded study materials • {capabilityScore > 70 ? 'Advanced' : capabilityScore > 30 ? 'Standard' : 'Foundational'} Depth
                                        </div>
                                    </motion.div>
                                )}

                                {theoryContent ? (
                                    <motion.div
                                        key={theoryContent.topic_id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h1 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                                                    {theoryContent.topic_name}
                                                </h1>

                                                {theoryContent.citations?.length > 0 && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        {theoryContent.citations.slice(0, 3).map((cite, i) => (
                                                            <div key={i} className="badge" style={{ fontSize: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', padding: '0.25rem 0.75rem', borderRadius: '6px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                <FileText size={12} /> {cite.source_name || 'Document'} {cite.page_label ? `(${cite.page_label})` : ''}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => {
                                                    const blob = new Blob([theoryContent.ai_explanation], { type: 'text/plain' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `${theoryContent.topic_name}_Notes.txt`;
                                                    a.click();
                                                }}
                                            >
                                                <Download size={18} /> Export Notes
                                            </button>
                                        </div>

                                        {/* Definition */}
                                        <section style={{ marginBottom: '2.5rem' }}>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                                                <BookOpen size={20} /> Professional Definition
                                            </h3>
                                            <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', lineHeight: '1.8', color: 'var(--text-primary)', borderLeft: '4px solid var(--primary)' }}>
                                                {theoryContent.definition}
                                            </div>
                                        </section>

                                        {/* Example */}
                                        <section style={{ marginBottom: '2.5rem' }}>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                                                <Sparkles size={20} /> Real-world Application
                                            </h3>
                                            <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', lineHeight: '1.8', color: 'var(--text-primary)', borderLeft: '4px solid var(--success)' }}>
                                                {theoryContent.example}
                                            </div>
                                        </section>

                                        {/* Common Mistakes */}
                                        {theoryContent.common_mistakes?.length > 0 && (
                                            <section style={{ marginBottom: '2.5rem' }}>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)' }}>
                                                    <Target size={20} /> Common Pitfalls
                                                </h3>
                                                <div style={{ display: 'grid', gap: '1rem' }}>
                                                    {theoryContent.common_mistakes.map((text, idx) => (
                                                        <div key={idx} style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                                            • {text}
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        {/* Action Footer */}
                                        <div style={{ display: 'flex', gap: '1rem', padding: '2rem 0', borderTop: '1px solid var(--border)', marginTop: '2rem' }}>
                                            <button className="btn btn-primary" onClick={() => handleMarkComplete()} style={{ flex: 1 }}>
                                                <CheckCircle size={18} /> Mastered This Topic
                                            </button>
                                            <button className="btn btn-secondary" onClick={() => handleMarkConfused()} style={{ flex: 1 }}>
                                                <AlertCircle size={18} /> Still Confused
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                                        <BookOpen size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                                        <h2>Select a Topic to Begin</h2>
                                        <p>Our AI Agent will analyze your study materials specifically for this topic.</p>
                                    </div>
                                )}
                            </div>

                            {/* Right Sidebar - Exam Prep */}
                            <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', height: '100%', overflowY: 'auto' }}>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                        <FileText size={20} color="var(--primary)" /> Exam Readiness
                                    </h3>

                                    {theoryContent?.exam_answers ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                            <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase' }}>2 Mark Concept</span>
                                                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>{theoryContent.exam_answers['2_mark']}</p>
                                            </div>
                                            <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase' }}>5 Mark Detailed</span>
                                                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>{theoryContent.exam_answers['5_mark']}</p>
                                            </div>
                                            <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase' }}>10 Mark Mastery</span>
                                                <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', lineHeight: 1.5 }}>{theoryContent.exam_answers['10_mark']?.substring(0, 300)}...</p>
                                            </div>

                                            {theoryContent.interview_relevance && (
                                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(30, 64, 175, 0.1))', borderRadius: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                        <Zap size={16} /> Placement Insight
                                                    </div>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{theoryContent.interview_relevance}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', paddingTop: '3rem', opacity: 0.5 }}>
                                            <Target size={40} style={{ margin: '0 auto 1rem' }} />
                                            <p>Select a topic to view structured exam answers</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </>
    );
}

export default TheoryMode;
