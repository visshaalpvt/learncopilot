import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    Target,
    BookOpen,
    Zap,
    TrendingUp,
    Brain,
    FileText,
    CheckCircle,
    Clock,
    ArrowRight,
    Sparkles,
    Database,
    Calendar,
    BarChart3,
    AlertCircle,
    Play,
    ChevronRight
} from 'lucide-react';
import api from '../api';

function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/progress/dashboard');
            setStats(response.data);

            // Determine active step based on progress
            if (response.data.total_topics === 0) {
                setActiveStep(0); // Need to upload materials
            } else if (response.data.completed_topics === 0) {
                setActiveStep(1); // Need to start learning
            } else {
                setActiveStep(2); // In progress
            }
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
            setStats({
                total_topics: 0,
                completed_topics: 0,
                progress_percentage: 0,
                mastery_score: 0
            });
            setActiveStep(0);
        } finally {
            setLoading(false);
        }
    };

    // The 5 Core Capabilities
    const coreCapabilities = [
        {
            id: 'rag',
            title: 'Retrieval-Augmented Learning',
            subtitle: 'RAG System',
            description: 'Every answer comes from YOUR uploaded materials with citations. No hallucinations.',
            icon: Database,
            color: '#6366F1',
            gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            features: ['PDF/PPT ingestion', 'Vector embeddings', 'Cited answers', 'No guessing'],
            path: '/app/syllabus',
            action: 'Upload Materials'
        },
        {
            id: 'planner',
            title: 'Personalized Study Planner',
            subtitle: 'Agentic Planning',
            description: 'AI creates a week-by-week roadmap based on your syllabus, time, and goals.',
            icon: Target,
            color: '#10B981',
            gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            features: ['Week-by-week plan', 'Theory vs Practice ratio', 'Revision slots', 'Auto-adjusts'],
            path: '/app/study-roadmap',
            action: 'View Roadmap'
        },
        {
            id: 'quiz',
            title: 'Adaptive Quiz Generator',
            subtitle: 'Knowledge Assessment',
            description: 'Quizzes adapt to your mastery. Low score = easier questions. High score = exam-level.',
            icon: Zap,
            color: '#F59E0B',
            gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            features: ['MCQs & Numericals', 'Difficulty adapts', 'Explanations with citations', 'Exam-level prep'],
            path: '/app/adaptive-exam-ai',
            action: 'Start Quiz'
        },
        {
            id: 'mastery',
            title: 'Mastery Tracking',
            subtitle: 'Knowledge Tracing',
            description: 'Track accuracy, attempts, and time per topic. Automatically reschedules weak areas.',
            icon: TrendingUp,
            color: '#EC4899',
            gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
            features: ['Per-topic mastery', 'Accuracy tracking', 'Spaced revision', 'Weak area detection'],
            path: '/app/progress',
            action: 'View Mastery'
        },
        {
            id: 'memory',
            title: 'Memory & Reflection',
            subtitle: 'Agent Memory',
            description: 'AI remembers your progress, mistakes, and what worked. Improves next week\'s plan.',
            icon: Brain,
            color: '#8B5CF6',
            gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
            features: ['Progress memory', 'Past mistakes log', 'Weekly reflection', 'Auto-improvement'],
            path: '/app/theory',
            action: 'Continue Learning'
        }
    ];

    // Learning workflow steps
    const workflowSteps = [
        {
            step: 1,
            title: 'Upload Materials',
            description: 'PDFs, slides, notes, past exams',
            icon: Upload,
            path: '/app/syllabus',
            completed: stats?.total_topics > 0
        },
        {
            step: 2,
            title: 'Generate Study Plan',
            description: 'Week-by-week personalized roadmap',
            icon: Calendar,
            path: '/app/study-roadmap',
            completed: false
        },
        {
            step: 3,
            title: 'Learn with RAG',
            description: 'AI explains from your documents',
            icon: BookOpen,
            path: '/app/theory',
            completed: stats?.completed_topics > 0
        },
        {
            step: 4,
            title: 'Take Adaptive Quiz',
            description: 'Test your understanding',
            icon: Zap,
            path: '/app/adaptive-exam-ai',
            completed: false
        },
        {
            step: 5,
            title: 'Track Mastery',
            description: 'Review progress & weak areas',
            icon: BarChart3,
            path: '/app/progress',
            completed: stats?.progress_percentage > 50
        },
    ];

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 8rem)',
                gap: '1rem'
            }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                    <Brain size={48} style={{ color: 'var(--primary)' }} />
                </motion.div>
                <p style={{ color: 'var(--text-muted)' }}>Initializing Learning Copilot...</p>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                    borderRadius: '16px',
                    padding: '2rem',
                    marginBottom: '2rem',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-10%',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
                    borderRadius: '50%'
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: 'var(--primary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            AI Learning Copilot
                        </span>
                    </div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem'
                    }}>
                        Master Your Courses with AI
                    </h1>
                    <p style={{
                        fontSize: '1rem',
                        color: 'var(--text-secondary)',
                        maxWidth: '600px',
                        lineHeight: '1.6'
                    }}>
                        Upload your syllabus, PDFs, and notes. Get a personalized study roadmap,
                        RAG-powered answers with citations, adaptive quizzes, and mastery tracking.
                    </p>

                    {/* Quick Stats */}
                    <div style={{
                        display: 'flex',
                        gap: '2rem',
                        marginTop: '1.5rem',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'var(--primary)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FileText size={20} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    {stats?.total_topics || 0}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Topics Indexed</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: '#10B981',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <CheckCircle size={20} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    {stats?.completed_topics || 0}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: '#F59E0B',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <TrendingUp size={20} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    {stats?.progress_percentage || 0}%
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mastery</div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Learning Workflow - Step by Step */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <Play size={20} style={{ color: 'var(--primary)' }} />
                    Your Learning Journey
                </h2>

                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    overflowX: 'auto',
                    paddingBottom: '0.5rem'
                }}>
                    {workflowSteps.map((step, index) => (
                        <motion.div
                            key={step.step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => navigate(step.path)}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                flex: '1',
                                minWidth: '200px',
                                background: step.completed
                                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))'
                                    : 'var(--bg-secondary)',
                                border: step.completed
                                    ? '1px solid rgba(16, 185, 129, 0.3)'
                                    : '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: '0.75rem',
                                right: '0.75rem',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: step.completed ? '#10B981' : 'var(--bg-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: step.completed ? 'white' : 'var(--text-muted)'
                            }}>
                                {step.completed ? <CheckCircle size={14} /> : step.step}
                            </div>

                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: step.completed
                                    ? 'rgba(16, 185, 129, 0.2)'
                                    : 'var(--primary-light)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '0.75rem'
                            }}>
                                <step.icon size={20} style={{
                                    color: step.completed ? '#10B981' : 'var(--primary)'
                                }} />
                            </div>

                            <h3 style={{
                                fontSize: '0.9375rem',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                marginBottom: '0.25rem'
                            }}>
                                {step.title}
                            </h3>
                            <p style={{
                                fontSize: '0.8125rem',
                                color: 'var(--text-muted)',
                                lineHeight: '1.4'
                            }}>
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* 5 Core Capabilities */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <Brain size={20} style={{ color: 'var(--primary)' }} />
                    5 Core AI Capabilities
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1rem'
                }}>
                    {coreCapabilities.map((capability, index) => (
                        <motion.div
                            key={capability.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onClick={() => navigate(capability.path)}
                        >
                            {/* Gradient accent */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '3px',
                                background: capability.gradient
                            }} />

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    background: `${capability.color}15`,
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <capability.icon size={24} style={{ color: capability.color }} />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: '0.7rem',
                                        fontWeight: '600',
                                        color: capability.color,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {capability.subtitle}
                                    </div>
                                    <h3 style={{
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: 'var(--text-primary)',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {capability.title}
                                    </h3>
                                    <p style={{
                                        fontSize: '0.8125rem',
                                        color: 'var(--text-secondary)',
                                        lineHeight: '1.5',
                                        marginBottom: '1rem'
                                    }}>
                                        {capability.description}
                                    </p>

                                    {/* Feature tags */}
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '0.375rem',
                                        marginBottom: '1rem'
                                    }}>
                                        {capability.features.map((feature, i) => (
                                            <span
                                                key={i}
                                                style={{
                                                    fontSize: '0.6875rem',
                                                    padding: '0.25rem 0.5rem',
                                                    background: 'var(--bg-tertiary)',
                                                    borderRadius: '4px',
                                                    color: 'var(--text-muted)'
                                                }}
                                            >
                                                {feature}
                                            </span>
                                        ))}
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.8125rem',
                                        fontWeight: '500',
                                        color: capability.color
                                    }}>
                                        {capability.action}
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Privacy & Ethics Notice */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}
            >
                <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <CheckCircle size={20} style={{ color: '#10B981' }} />
                </div>
                <div>
                    <h4 style={{
                        fontSize: '0.9375rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem'
                    }}>
                        Privacy & Ethics Compliant
                    </h4>
                    <p style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)'
                    }}>
                        ✅ All answers cite sources • ✅ No data stored without consent • ✅ No hallucinations • ✅ Minimal PII
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

export default Dashboard;
