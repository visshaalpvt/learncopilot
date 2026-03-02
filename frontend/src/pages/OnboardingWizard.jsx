import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Target, BookOpen, Sparkles, ChevronRight, ChevronLeft, Check, Zap } from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';

const steps = [
    {
        id: 'hours',
        question: 'How many hours can you study daily?',
        options: [
            { value: 1, label: '1 hour', desc: 'Light study' },
            { value: 2, label: '2 hours', desc: 'Moderate' },
            { value: 3, label: '3 hours', desc: 'Focused' },
            { value: 5, label: '5+ hours', desc: 'Intensive' }
        ]
    },
    {
        id: 'weak',
        question: 'Which subjects do you find challenging?',
        multi: true,
        options: [
            { value: 'Mathematics', label: 'Mathematics' },
            { value: 'Programming', label: 'Programming' },
            { value: 'Data Structures', label: 'Data Structures' },
            { value: 'Physics', label: 'Physics' },
            { value: 'English', label: 'English' },
            { value: 'Electronics', label: 'Electronics' },
            { value: 'Networks', label: 'Networks' },
            { value: 'Database', label: 'Database' }
        ]
    },
    {
        id: 'style',
        question: 'How do you learn best?',
        options: [
            { value: 'visual', label: '👁️ Visual', desc: 'Diagrams & videos' },
            { value: 'reading', label: '📖 Reading', desc: 'Text & notes' },
            { value: 'kinesthetic', label: '🖐️ Hands-on', desc: 'Practice & labs' },
            { value: 'auditory', label: '🎧 Auditory', desc: 'Lectures & discussions' }
        ]
    },
    {
        id: 'confidence',
        question: 'How confident are you in your studies?',
        options: [
            { value: 'low', label: '😟 Need Help', desc: 'I struggle often' },
            { value: 'medium', label: '🙂 Getting There', desc: 'Some topics are hard' },
            { value: 'high', label: '😎 Confident', desc: 'I learn fast' }
        ]
    },
    {
        id: 'goal',
        question: 'What is your primary goal?',
        options: [
            { value: 'pass', label: '✅ Pass Exams', desc: 'Clear all subjects' },
            { value: 'good_grades', label: '⭐ Good Grades', desc: 'Score 75%+' },
            { value: 'master', label: '🏆 Master It', desc: 'Deep understanding' },
            { value: 'placement', label: '💼 Get Placed', desc: 'Job ready' }
        ]
    }
];

function OnboardingWizard() {
    const navigate = useNavigate();
    const { fetchUser } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({ hours: 2, weak: [], style: 'visual', confidence: 'medium', goal: 'pass' });
    const [result, setResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const step = steps[currentStep];

    const handleSelect = (value) => {
        if (step.multi) {
            setAnswers(prev => {
                const arr = prev.weak || [];
                return { ...prev, weak: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
            });
        } else {
            setAnswers(prev => ({ ...prev, [step.id]: value }));
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const res = await api.post('/onboarding/submit', {
                study_hours_daily: answers.hours,
                weak_subjects: answers.weak,
                learning_style: answers.style,
                confidence_level: answers.confidence,
                goal: answers.goal
            });
            setResult(res.data);
            await fetchUser();
        } catch (err) {
            console.error(err);
            setResult({
                ai_confidence_score: 55,
                ai_learning_speed: 'moderate',
                ai_weak_subject_map: {},
                ai_tutor_tone: 'encouraging',
                ai_recommended_plan: { daily_theory_minutes: 45, daily_practice_minutes: 30, daily_revision_minutes: 15 }
            });
        }
        setSubmitting(false);
    };

    if (result) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-primary)' }}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '24px', padding: '3rem', maxWidth: '600px', width: '100%', textAlign: 'center' }}
                >
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                        <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Sparkles size={36} color="white" />
                        </div>
                    </motion.div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Your AI Profile is Ready!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>LearnCopilot has analyzed your learning profile</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
                        <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Confidence Score</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#6366f1' }}>{Math.round(result.ai_confidence_score)}%</div>
                        </div>
                        <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Learning Speed</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981', textTransform: 'capitalize' }}>{result.ai_learning_speed}</div>
                        </div>
                        <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>AI Tutor Tone</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '600', textTransform: 'capitalize' }}>{result.ai_tutor_tone}</div>
                        </div>
                        <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Daily Plan</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                                {result.ai_recommended_plan?.daily_theory_minutes || 45}m theory + {result.ai_recommended_plan?.daily_practice_minutes || 30}m practice
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/app/dashboard')}
                        style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                        Start Learning <ChevronRight size={18} style={{ verticalAlign: 'middle' }} />
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    const isSelected = (value) => {
        if (step.multi) return (answers.weak || []).includes(value);
        return answers[step.id] === value;
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-primary)' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '24px', padding: '2.5rem', maxWidth: '640px', width: '100%' }}
            >
                {/* Progress bar */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '2rem' }}>
                    {steps.map((_, i) => (
                        <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= currentStep ? '#6366f1' : 'var(--bg-tertiary)', transition: 'background 0.3s' }} />
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Brain size={20} color="#6366f1" />
                    <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: '600', textTransform: 'uppercase' }}>Step {currentStep + 1} of {steps.length}</span>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>{step.question}</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: step.options.length > 4 ? '1fr 1fr' : '1fr', gap: '0.75rem', marginBottom: '2rem' }}>
                            {step.options.map(opt => (
                                <motion.button
                                    key={opt.value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSelect(opt.value)}
                                    style={{
                                        padding: '1rem 1.25rem', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                                        background: isSelected(opt.value) ? 'rgba(99,102,241,0.15)' : 'var(--bg-tertiary)',
                                        border: isSelected(opt.value) ? '2px solid #6366f1' : '2px solid transparent',
                                        color: 'var(--text-primary)', transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{opt.label}</div>
                                    {opt.desc && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{opt.desc}</div>}
                                    {isSelected(opt.value) && <Check size={16} color="#6366f1" style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }} />}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button onClick={handleBack} disabled={currentStep === 0}
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: currentStep === 0 ? 'not-allowed' : 'pointer', opacity: currentStep === 0 ? 0.4 : 1 }}>
                        <ChevronLeft size={16} style={{ verticalAlign: 'middle' }} /> Back
                    </button>

                    {currentStep === steps.length - 1 ? (
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={handleSubmit} disabled={submitting}
                            style={{ padding: '0.75rem 2rem', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                            {submitting ? 'Analyzing...' : 'Generate AI Profile'} <Zap size={16} style={{ verticalAlign: 'middle' }} />
                        </motion.button>
                    ) : (
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={handleNext}
                            style={{ padding: '0.75rem 2rem', borderRadius: '10px', background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                            Next <ChevronRight size={16} style={{ verticalAlign: 'middle' }} />
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export default OnboardingWizard;
