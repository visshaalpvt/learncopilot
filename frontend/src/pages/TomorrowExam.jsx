import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, Zap, Target, CheckCircle, Brain } from 'lucide-react';
import MockAI from '../services/mockAI';
import api from '../api';

function TomorrowExam() {
    const [loading, setLoading] = useState(true);
    const [aiGuidance, setAiGuidance] = useState('');
    const [checklist, setChecklist] = useState([]);

    useEffect(() => {
        fetchExamData();
        getAIGuidance();
    }, []);

    const fetchExamData = async () => {
        try {
            // Fetch user progress to identify weak areas
            const response = await api.get('/progress/weak-areas');
            // Mock checklist based on weak areas
            const mockChecklist = [
                { id: 1, topic: 'Data Structures', status: false, priority: 'high' },
                { id: 2, topic: 'Algorithms', status: false, priority: 'high' },
                { id: 3, topic: 'DBMS Normalization', status: false, priority: 'medium' },
                { id: 4, topic: 'SQL Queries', status: false, priority: 'high' },
                { id: 5, topic: 'Object Oriented Programming', status: false, priority: 'medium' },
            ];
            setChecklist(mockChecklist);
        } catch (error) {
            console.error('Failed to fetch exam data:', error);
            // Use fallback data
            setChecklist([
                { id: 1, topic: 'Important Topics Review', status: false, priority: 'high' },
                { id: 2, topic: 'Practice Problems', status: false, priority: 'high' },
                { id: 3, topic: 'Formula Revision', status: false, priority: 'medium' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getAIGuidance = async () => {
        await MockAI.getExamGuidance((text) => {
            setAiGuidance(text);
        });
    };

    const toggleChecklistItem = (id) => {
        setChecklist(checklist.map(item =>
            item.id === id ? { ...item, status: !item.status } : item
        ));
    };

    const mostProbableQuestions = [
        {
            question: "Explain the difference between Stack and Queue data structures",
            reason: "Asked in 8/10 previous exams",
            marks: 10,
            weight: "Very High"
        },
        {
            question: "Write a program to implement Binary Search",
            reason: "Core algorithm, appears yearly",
            marks: 10,
            weight: "Very High"
        },
        {
            question: "Explain ACID properties in DBMS",
            reason: "Fundamental concept, 90% probability",
            marks: 5,
            weight: "High"
        },
        {
            question: "Difference between Abstract Class and Interface",
            reason: "Common OOP question",
            marks: 5,
            weight: "High"
        },
    ];

    const mustRememberDefinitions = [
        "Data Structure: Way of organizing and storing data efficiently",
        "Algorithm: Step-by-step procedure to solve a problem",
        "Time Complexity: Measure of algorithm execution time",
        "Normalization: Process to minimize redundancy in databases",
        "Polymorphism: Ability of objects to take multiple forms",
    ];

    const doNotSkipTopics = [
        { topic: "Arrays and Linked Lists", reason: "Forms basis for all data structures" },
        { topic: "Sorting Algorithms", reason: "Guaranteed to appear" },
        { topic: "SQL Joins", reason: "Practical and theory questions" },
        { topic: "Inheritance in OOP", reason: "Core OOP concept" },
    ];

    const commonMistakes = [
        "Forgetting base cases in recursion",
        "Confusing Stack (LIFO) with Queue (FIFO)",
        "Not handling NULL pointers in C",
        "Ignoring time complexity analysis",
        "Mixing up normalization forms (1NF, 2NF, 3NF)",
    ];

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
                <div style={{ color: 'var(--text-muted)' }}>Loading exam preparation plan...</div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <Clock size={32} style={{ color: 'var(--danger)' }} />
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>🚨 Tomorrow Exam Mode</h1>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    Last-minute preparation guide powered by intelligent analysis
                </p>
            </motion.div>

            {/* AI Guidance Banner */}
            {aiGuidance && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(249, 115, 22, 0.1))',
                        border: '2px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        marginBottom: '2rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Zap size={20} style={{ color: 'var(--danger)' }} />
                        <span style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--danger)' }}>
                            AI Study Plan for Tomorrow
                        </span>
                    </div>
                    <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                        {aiGuidance}
                    </p>
                </motion.div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
                {/* Most Probable Questions */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card"
                >
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Target style={{ color: 'var(--danger)' }} />
                        Most Probable Questions
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {mostProbableQuestions.map((q, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                style={{
                                    padding: '1rem',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '0.5rem',
                                    borderLeft: `4px solid ${q.weight === 'Very High' ? 'var(--danger)' : 'var(--warning)'}`,
                                }}
                            >
                                <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                    {q.question}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                    📊 {q.reason}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--primary)' }}>Marks: {q.marks}</span>
                                    <span style={{ color: q.weight === 'Very High' ? 'var(--danger)' : 'var(--warning)' }}>
                                        Weight: {q.weight}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Fast Revision Checklist */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card"
                >
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle style={{ color: 'var(--success)' }} />
                        Fast Revision Checklist
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {checklist.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => toggleChecklistItem(item.id)}
                                style={{
                                    padding: '1rem',
                                    background: item.status ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    borderLeft: `4px solid ${item.priority === 'high' ? 'var(--danger)' : 'var(--warning)'}`,
                                    transition: 'all 0.2s',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={item.status}
                                    onChange={() => { }}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontWeight: '500',
                                        textDecoration: item.status ? 'line-through' : 'none',
                                        color: item.status ? 'var(--text-muted)' : 'var(--text-primary)'
                                    }}>
                                        {item.topic}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        Priority: {item.priority}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem' }}>
                        <strong>Progress: </strong>
                        {checklist.filter(item => item.status).length} / {checklist.length} topics completed
                    </div>
                </motion.div>

                {/* Must-Remember Definitions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                >
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--primary)' }}>
                        📝 Must-Remember Definitions
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {mustRememberDefinitions.map((def, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                style={{
                                    padding: '0.75rem 1rem',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '0.5rem',
                                    borderLeft: '4px solid var(--primary)',
                                }}
                            >
                                <strong style={{ color: 'var(--primary)' }}>{def.split(':')[0]}:</strong>
                                <span style={{ color: 'var(--text-secondary)' }}> {def.split(':')[1]}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Do NOT Skip Topics */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                >
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle style={{ color: 'var(--danger)' }} />
                        ⚠️ Do NOT Skip These Topics
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {doNotSkipTopics.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                style={{
                                    padding: '1rem',
                                    background: 'rgba(239, 68, 68, 0.05)',
                                    borderRadius: '0.5rem',
                                    borderLeft: '4px solid var(--danger)',
                                }}
                            >
                                <div style={{ fontWeight: '600', color: 'var(--danger)', marginBottom: '0.25rem' }}>
                                    {item.topic}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Why: {item.reason}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Common Mistakes to Avoid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ gridColumn: '1 / -1' }}
                    className="card"
                >
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--warning)' }}>
                        ⚠️ Common Mistakes to Avoid
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                        {commonMistakes.map((mistake, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                style={{
                                    padding: '1rem',
                                    background: 'rgba(249, 115, 22, 0.05)',
                                    borderRadius: '0.5rem',
                                    borderLeft: '4px solid var(--warning)',
                                }}
                            >
                                ❌ {mistake}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default TomorrowExam;
