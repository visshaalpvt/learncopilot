import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Target, AlertTriangle, TrendingUp, Clock, CheckCircle, XCircle, Zap, Activity, Award } from 'lucide-react';
import api from '../api';
import MockAI from '../services/mockAI';

function AdaptiveExamAI() {
    const [loading, setLoading] = useState(true);
    const [knowledgeGraph, setKnowledgeGraph] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [quizActive, setQuizActive] = useState(false);
    const [questionHistory, setQuestionHistory] = useState([]);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [confidenceLevel, setConfidenceLevel] = useState(3);
    const [questionStartTime, setQuestionStartTime] = useState(null);
    const [riskAlerts, setRiskAlerts] = useState([]);
    const [mistakePatterns, setMistakePatterns] = useState(null);
    const [predictedWeakTopics, setPredictedWeakTopics] = useState([]);
    const [answerChanges, setAnswerChanges] = useState(0);

    useEffect(() => {
        initializeAdaptiveEngine();
    }, []);

    const initializeAdaptiveEngine = async () => {
        try {
            // Fetch user progress
            const response = await api.get('/progress/all');
            const allProgress = response.data;

            // Build Knowledge Graph
            const graph = allProgress.map(p => ({
                topic: p.topic_name,
                strengthScore: p.is_completed ? 80 : p.is_confused ? 25 : 50,
                weaknessScore: p.is_confused ? 75 : p.is_completed ? 20 : 50,
                attempts: p.lab_attempts || 0,
                status: p.is_completed ? 'strong' : p.is_confused ? 'weak' : 'learning',
            }));

            setKnowledgeGraph(graph);

            // Predict weak topics
            const weakTopics = graph
                .filter(g => g.weaknessScore > 50)
                .sort((a, b) => b.weaknessScore - a.weaknessScore)
                .slice(0, 3)
                .map(g => g.topic);

            setPredictedWeakTopics(weakTopics.length > 0 ? weakTopics : ['Data Structures', 'Recursion', 'Pointer Arithmetic']);

            // Analyze mistake patterns
            analyzeMistakePatterns(allProgress);

            // Generate risk alerts
            generateRiskAlerts(graph);

        } catch (error) {
            console.error('Failed to initialize adaptive engine:', error);
            // Use mock data
            setKnowledgeGraph([
                { topic: 'Arrays', strengthScore: 80, weaknessScore: 20, attempts: 2, status: 'strong' },
                { topic: 'Linked Lists', strengthScore: 40, weaknessScore: 60, attempts: 5, status: 'weak' },
                { topic: 'Recursion', strengthScore: 25, weaknessScore: 75, attempts: 8, status: 'weak' },
                { topic: 'Trees', strengthScore: 50, weaknessScore: 50, attempts: 3, status: 'learning' },
            ]);
            setPredictedWeakTopics(['Recursion', 'Linked Lists', 'Tree Traversal']);
            analyzeMistakePatterns([]);
            generateRiskAlerts([]);
        } finally {
            setLoading(false);
        }
    };

    const analyzeMistakePatterns = (progress) => {
        const totalAttempts = progress.reduce((sum, p) => sum + (p.lab_attempts || 0), 0);
        const conceptualErrors = Math.floor((progress.filter(p => p.is_confused).length / progress.length) * 100);
        const carelessErrors = 100 - conceptualErrors;

        setMistakePatterns({
            conceptualErrors,
            carelessErrors,
            repeatedMistakes: progress.filter(p => p.lab_attempts > 3).length,
            totalErrors: totalAttempts,
        });
    };

    const generateRiskAlerts = (graph) => {
        const alerts = [];

        const weakCount = graph.filter(g => g.status === 'weak').length;
        if (weakCount > 2) {
            alerts.push({
                level: 'high',
                message: `You're likely to struggle in ${weakCount} topics if this continues`,
                recommendation: 'Focus on weak topics before moving forward',
            });
        }

        const highAttempts = graph.filter(g => g.attempts > 5);
        if (highAttempts.length > 0) {
            alerts.push({
                level: 'medium',
                message: 'Multiple retry patterns detected',
                recommendation: 'Review fundamental concepts before practicing',
            });
        }

        setRiskAlerts(alerts.length > 0 ? alerts : [
            { level: 'low', message: 'Learning pace is healthy', recommendation: 'Continue current study pattern' }
        ]);
    };

    const startAdaptiveQuiz = () => {
        setQuizActive(true);
        generateAdaptiveQuestion();
    };

    const generateAdaptiveQuestion = () => {
        setQuestionStartTime(Date.now());
        setSelectedAnswer(null);
        setConfidenceLevel(3);
        setAnswerChanges(0);

        // Get difficulty based on recent performance
        const recentCorrect = questionHistory.filter(q => q.correct).length;
        const recentTotal = questionHistory.length;
        const accuracy = recentTotal > 0 ? recentCorrect / recentTotal : 0.5;

        let difficulty;
        if (accuracy > 0.7) difficulty = 'hard';
        else if (accuracy < 0.4) difficulty = 'easy';
        else difficulty = 'medium';

        // Question bank
        const questions = {
            easy: [
                {
                    question: "What is an array?",
                    options: ["A collection of similar data types", "A loop", "A variable", "A function"],
                    correct: 0,
                    topic: "Arrays"
                },
                {
                    question: "What is the time complexity of accessing an array element?",
                    options: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
                    correct: 0,
                    topic: "Arrays"
                },
            ],
            medium: [
                {
                    question: "What is a linked list?",
                    options: [
                        "A linear data structure with nodes",
                        "An array with fixed size",
                        "A tree structure",
                        "A sorting algorithm"
                    ],
                    correct: 0,
                    topic: "Linked Lists"
                },
                {
                    question: "In a recursive function, what prevents infinite recursion?",
                    options: ["Base case", "Loop", "Array", "Variable"],
                    correct: 0,
                    topic: "Recursion"
                },
            ],
            hard: [
                {
                    question: "What is the time complexity of QuickSort in worst case?",
                    options: ["O(n²)", "O(n log n)", "O(n)", "O(log n)"],
                    correct: 0,
                    topic: "Algorithms"
                },
                {
                    question: "Which traversal visits root between left and right subtrees?",
                    options: ["Inorder", "Preorder", "Postorder", "Level order"],
                    correct: 0,
                    topic: "Trees"
                },
            ],
        };

        const questionPool = questions[difficulty];
        const question = questionPool[Math.floor(Math.random() * questionPool.length)];

        setCurrentQuestion({
            ...question,
            difficulty,
            number: questionHistory.length + 1,
        });
    };

    const handleAnswerSelect = (index) => {
        if (selectedAnswer !== null && selectedAnswer !== index) {
            setAnswerChanges(prev => prev + 1);
        }
        setSelectedAnswer(index);
    };

    const submitAnswer = async () => {
        if (selectedAnswer === null) return;

        const timeTaken = (Date.now() - questionStartTime) / 1000; // seconds
        const avgTime = 15; // average time per question
        const isCorrect = selectedAnswer === currentQuestion.correct;

        // Detect hesitation
        const hesitation = timeTaken > avgTime * 1.5 || answerChanges > 2;

        const result = {
            question: currentQuestion.question,
            topic: currentQuestion.topic,
            difficulty: currentQuestion.difficulty,
            correct: isCorrect,
            timeTaken,
            confidence: confidenceLevel,
            hesitation,
            answerChanges,
        };

        setQuestionHistory([...questionHistory, result]);

        // Update knowledge graph
        updateKnowledgeGraph(currentQuestion.topic, isCorrect, confidenceLevel);

        // Update progress in backend
        try {
            await api.post('/progress/update', {
                topic_name: currentQuestion.topic,
                lab_attempts: 1,
                is_completed: isCorrect && confidenceLevel >= 4,
                is_confused: !isCorrect || hesitation || confidenceLevel < 3,
            });
        } catch (error) {
            console.error('Failed to update progress:', error);
        }

        // Show result briefly then next question
        setTimeout(() => {
            generateAdaptiveQuestion();
        }, 2000);
    };

    const updateKnowledgeGraph = (topic, correct, confidence) => {
        setKnowledgeGraph(prev => prev.map(node => {
            if (node.topic === topic) {
                const delta = correct ? 10 : -15;
                const confidenceDelta = (confidence - 3) * 5;

                return {
                    ...node,
                    strengthScore: Math.min(100, Math.max(0, node.strengthScore + delta + confidenceDelta)),
                    weaknessScore: Math.min(100, Math.max(0, node.weaknessScore - delta - confidenceDelta)),
                    attempts: node.attempts + 1,
                    status: node.strengthScore + delta > 70 ? 'strong' :
                        node.strengthScore + delta < 40 ? 'weak' : 'learning',
                };
            }
            return node;
        }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'strong': return 'var(--success)';
            case 'weak': return 'var(--danger)';
            case 'learning': return 'var(--warning)';
            default: return 'var(--text-muted)';
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block', marginBottom: '1rem' }}
                >
                    <Brain size={48} style={{ color: 'var(--primary)' }} />
                </motion.div>
                <div style={{ color: 'var(--text-muted)' }}>Initializing Adaptive Intelligence Engine...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '0.5rem' }}>
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{ marginBottom: '2rem' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Zap size={32} style={{ color: 'var(--primary)' }} />
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                            🔥 Adaptive Exam AI
                        </h1>
                    </div>
                    {!quizActive && (
                        <button
                            className="btn btn-primary"
                            onClick={startAdaptiveQuiz}
                            style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}
                        >
                            <Brain size={20} /> Start Adaptive Quiz
                        </button>
                    )}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    Intelligent exam engine that adapts to your learning patterns
                </p>
            </motion.div>

            {/* Risk Alerts */}
            {riskAlerts.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '2rem' }}
                >
                    {riskAlerts.map((alert, index) => (
                        <div
                            key={index}
                            style={{
                                padding: '1rem',
                                background: alert.level === 'high'
                                    ? 'rgba(239, 68, 68, 0.1)'
                                    : alert.level === 'medium'
                                        ? 'rgba(249, 115, 22, 0.1)'
                                        : 'rgba(16, 185, 129, 0.1)',
                                border: `2px solid ${alert.level === 'high'
                                        ? 'var(--danger)'
                                        : alert.level === 'medium'
                                            ? 'var(--warning)'
                                            : 'var(--success)'
                                    }`,
                                borderRadius: '0.5rem',
                                marginBottom: '0.5rem',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <AlertTriangle size={20} style={{
                                    color: alert.level === 'high' ? 'var(--danger)' :
                                        alert.level === 'medium' ? 'var(--warning)' : 'var(--success)'
                                }} />
                                <strong>{alert.message}</strong>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', paddingLeft: '1.75rem' }}>
                                💡 {alert.recommendation}
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Adaptive Quiz Section */}
            <AnimatePresence>
                {quizActive && currentQuestion && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="card"
                        style={{ marginBottom: '2rem', padding: '2rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <span style={{
                                padding: '0.5rem 1rem',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '0.5rem',
                                fontWeight: '600',
                            }}>
                                Question {currentQuestion.number}
                            </span>
                            <span style={{
                                padding: '0.5rem 1rem',
                                background: currentQuestion.difficulty === 'hard'
                                    ? 'rgba(239, 68, 68, 0.1)'
                                    : currentQuestion.difficulty === 'medium'
                                        ? 'rgba(249, 115, 22, 0.1)'
                                        : 'rgba(16, 185, 129, 0.1)',
                                color: currentQuestion.difficulty === 'hard'
                                    ? 'var(--danger)'
                                    : currentQuestion.difficulty === 'medium'
                                        ? 'var(--warning)'
                                        : 'var(--success)',
                                borderRadius: '0.5rem',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                            }}>
                                {currentQuestion.difficulty}
                            </span>
                        </div>

                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
                            {currentQuestion.question}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            {currentQuestion.options.map((option, index) => (
                                <motion.div
                                    key={index}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleAnswerSelect(index)}
                                    style={{
                                        padding: '1rem 1.5rem',
                                        background: selectedAnswer === index
                                            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1))'
                                            : 'var(--bg-tertiary)',
                                        border: selectedAnswer === index ? '2px solid var(--primary)' : '2px solid transparent',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            border: '2px solid',
                                            borderColor: selectedAnswer === index ? 'var(--primary)' : 'var(--text-muted)',
                                            background: selectedAnswer === index ? 'var(--primary)' : 'transparent',
                                        }}></div>
                                        <span style={{ fontSize: '1.1rem' }}>{option}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                How confident are you? (1-5)
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {[1, 2, 3, 4, 5].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => setConfidenceLevel(level)}
                                        style={{
                                            padding: '0.75rem 1.25rem',
                                            borderRadius: '0.5rem',
                                            border: 'none',
                                            background: confidenceLevel === level
                                                ? 'var(--primary)'
                                                : 'var(--bg-tertiary)',
                                            color: confidenceLevel === level ? 'white' : 'var(--text-primary)',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                1 = Guessing | 5 = Very Confident
                            </div>
                        </div>

                        <button
                            className="btn btn-success"
                            onClick={submitAnswer}
                            disabled={selectedAnswer === null}
                            style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}
                        >
                            <CheckCircle size={20} /> Submit Answer
                        </button>

                        {answerChanges > 0 && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '0.75rem',
                                background: 'rgba(249, 115, 22, 0.1)',
                                borderRadius: '0.5rem',
                                fontSize: '0.9rem',
                                color: 'var(--warning)',
                            }}>
                                ⚠️ Hesitation detected: You changed your answer {answerChanges} time(s)
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
                {/* Knowledge Graph */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card"
                >
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity style={{ color: 'var(--primary)' }} />
                        Knowledge Graph
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {knowledgeGraph.map((node, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                style={{
                                    padding: '1rem',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '0.5rem',
                                    borderLeft: `5px solid ${getStatusColor(node.status)}`,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: '600' }}>{node.topic}</span>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        background: node.status === 'strong'
                                            ? 'rgba(16, 185, 129, 0.1)'
                                            : node.status === 'weak'
                                                ? 'rgba(239, 68, 68, 0.1)'
                                                : 'rgba(249, 115, 22, 0.1)',
                                        color: getStatusColor(node.status),
                                    }}>
                                        {node.status.toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                        <span>Strength</span>
                                        <span style={{ fontWeight: '600' }}>{node.strengthScore}%</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '9999px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${node.strengthScore}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, var(--success), #10b981)',
                                            borderRadius: '9999px',
                                        }}></div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Attempts: {node.attempts}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Predicted Weak Topics */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card"
                >
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Target style={{ color: 'var(--danger)' }} />
                        ⚠️ Predicted Risk Areas
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                        {predictedWeakTopics.map((topic, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                style={{
                                    padding: '1rem',
                                    background: 'rgba(239, 68, 68, 0.05)',
                                    border: '2px solid var(--danger)',
                                    borderRadius: '0.5rem',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
                                    <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{topic}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', paddingLeft: '1.75rem' }}>
                                    High probability of struggle - Immediate focus needed
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Mistake Patterns */}
                    {mistakePatterns && (
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>
                                Mistake Pattern Analysis
                            </h3>
                            <div style={{
                                padding: '1.5rem',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '0.5rem',
                            }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span>Conceptual Errors</span>
                                        <span style={{ fontWeight: '600', color: 'var(--danger)' }}>
                                            {mistakePatterns.conceptualErrors}%
                                        </span>
                                    </div>
                                    <div style={{ height: '12px', background: 'var(--bg-secondary)', borderRadius: '9999px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${mistakePatterns.conceptualErrors}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, var(--danger), #f87171)',
                                            borderRadius: '9999px',
                                        }}></div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span>Careless Errors</span>
                                        <span style={{ fontWeight: '600', color: 'var(--warning)' }}>
                                            {mistakePatterns.carelessErrors}%
                                        </span>
                                    </div>
                                    <div style={{ height: '12px', background: 'var(--bg-secondary)', borderRadius: '9999px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${mistakePatterns.carelessErrors}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, var(--warning), #fb923c)',
                                            borderRadius: '9999px',
                                        }}></div>
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: '1rem',
                                    padding: '0.75rem',
                                    background: 'rgba(99, 102, 241, 0.05)',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.9rem',
                                    borderLeft: '3px solid var(--primary)',
                                }}>
                                    <strong style={{ color: 'var(--primary)' }}>AI Insight: </strong>
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        {mistakePatterns.conceptualErrors > 60
                                            ? "Most errors are conceptual, not syntax. Focus on understanding core concepts."
                                            : "Good conceptual understanding. Focus on reducing careless mistakes."}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Performance Stats */}
                {questionHistory.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card"
                        style={{ gridColumn: '1 / -1' }}
                    >
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Award style={{ color: 'var(--success)' }} />
                            Session Performance
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            <div className="stat-card" style={{
                                padding: '1.5rem',
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
                                borderRadius: '0.5rem',
                                borderTop: '4px solid var(--success)',
                            }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--success)' }}>
                                    {questionHistory.filter(q => q.correct).length}
                                </div>
                                <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Correct Answers</div>
                            </div>

                            <div className="stat-card" style={{
                                padding: '1.5rem',
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
                                borderRadius: '0.5rem',
                                borderTop: '4px solid var(--danger)',
                            }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--danger)' }}>
                                    {questionHistory.filter(q => !q.correct).length}
                                </div>
                                <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Incorrect</div>
                            </div>

                            <div className="stat-card" style={{
                                padding: '1.5rem',
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05))',
                                borderRadius: '0.5rem',
                                borderTop: '4px solid var(--primary)',
                            }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                                    {Math.round((questionHistory.filter(q => q.correct).length / questionHistory.length) * 100)}%
                                </div>
                                <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Accuracy</div>
                            </div>

                            <div className="stat-card" style={{
                                padding: '1.5rem',
                                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0.05))',
                                borderRadius: '0.5rem',
                                borderTop: '4px solid var(--warning)',
                            }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--warning)' }}>
                                    {questionHistory.filter(q => q.hesitation).length}
                                </div>
                                <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Hesitation Detected</div>
                            </div>
                        </div>

                        {/* Recent Questions */}
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>
                            Recent Questions
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {questionHistory.slice(-5).reverse().map((q, index) => (
                                <div
                                    key={index}
                                    style={{
                                        padding: '1rem',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '0.5rem',
                                        borderLeft: `4px solid ${q.correct ? 'var(--success)' : 'var(--danger)'}`,
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: '600' }}>{q.topic}</span>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            {q.correct ? (
                                                <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                                            ) : (
                                                <XCircle size={18} style={{ color: 'var(--danger)' }} />
                                            )}
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {q.timeTaken.toFixed(1)}s
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        {q.question}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                                        <span>Confidence: {q.confidence}/5</span>
                                        <span>Difficulty: {q.difficulty}</span>
                                        {q.hesitation && (
                                            <span style={{ color: 'var(--warning)' }}>⚠️ Hesitation</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default AdaptiveExamAI;
