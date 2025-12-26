import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Star, CheckSquare, Sparkles, Brain, Target, Zap } from 'lucide-react';
import MockAI from '../services/mockAI';

function ExamPrep() {
    const [checkedItems, setCheckedItems] = useState({});
    const [aiGuidance, setAiGuidance] = useState('');
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [isLoadingGuidance, setIsLoadingGuidance] = useState(false);

    const importantTopics = [
        { name: 'Data Structures - Arrays and Linked Lists', frequency: 'Very High', difficulty: 'Medium', key: 'data structures' },
        { name: 'Algorithms - Sorting and Searching', frequency: 'Very High', difficulty: 'Medium', key: 'algorithms' },
        { name: 'Object Oriented Programming - Inheritance', frequency: 'High', difficulty: 'Medium', key: 'oop' },
        { name: 'DBMS - Normalization', frequency: 'High', difficulty: 'Hard', key: 'dbms' },
        { name: 'Networking - OSI Model', frequency: 'Medium', difficulty: 'Easy', key: 'networking' },
    ];

    const frequentlyAsked = [
        'What is the difference between stack and queue?',
        'Explain the four pillars of OOP with examples',
        'What is normalization and why is it important?',
        'Difference between TCP and UDP protocols',
        'Time complexity of quick sort and merge sort',
        'Explain inheritance with a real-world example',
        'What is a primary key and foreign key?',
        'Difference between compiler and interpreter',
    ];

    const examChecklist = [
        'Review all 2-mark questions from theory mode',
        'Practice at least 5 coding problems per topic',
        'Revise common mistakes for each topic',
        'Go through all exam answer templates',
        'Complete weak areas identified in progress',
        'Review lab viva questions',
        'Practice writing 10-mark answers in 15 minutes',
        'Revise interview-relevant topics',
    ];

    const handleTopicClick = async (topic) => {
        setSelectedTopic(topic);
        setIsLoadingGuidance(true);

        const guidance = await MockAI.getExamGuidance(topic.key);
        setAiGuidance(guidance);
        setIsLoadingGuidance(false);
    };

    const toggleCheck = (index) => {
        setCheckedItems(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const completedCount = Object.values(checkedItems).filter(Boolean).length;
    const progressPercentage = (completedCount / examChecklist.length) * 100;

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Target size={32} style={{ color: 'var(--warning)' }} />
                    </motion.div>
                    Exam Preparation
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>AI-powered exam guidance and high-priority topic recommendations</p>
            </div>

            {/* AI Guidance Panel */}
            {(selectedTopic || aiGuidance) && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        marginBottom: '2rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        >
                            <Sparkles size={24} style={{ color: 'var(--primary)' }} />
                        </motion.div>
                        <h3 style={{ margin: 0, color: 'var(--primary)' }}>
                            AI Exam Guide: {selectedTopic?.name || 'Select a topic'}
                        </h3>
                    </div>
                    {isLoadingGuidance ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                                <Brain size={20} />
                            </motion.div>
                            AI is preparing your exam guidance...
                        </div>
                    ) : (
                        <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                            {aiGuidance}
                        </p>
                    )}
                </motion.div>
            )}

            {/* Prep Progress */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '0.75rem',
                    padding: '1rem 1.5rem',
                    marginBottom: '1.5rem',
                    border: '1px solid var(--border)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '500' }}>Preparation Progress</span>
                    <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{completedCount}/{examChecklist.length} tasks</span>
                </div>
                <div className="progress-bar">
                    <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {/* Important Topics */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card"
                >
                    <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Star size={20} style={{ color: 'var(--warning)' }} />
                        Important Topics
                    </h2>
                    <p className="card-description" style={{ marginBottom: '1.5rem' }}>
                        Click a topic to get AI exam guidance
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {importantTopics.map((topic, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02, x: 5 }}
                                onClick={() => handleTopicClick(topic)}
                                style={{
                                    padding: '1rem',
                                    background: selectedTopic?.key === topic.key ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-tertiary)',
                                    borderRadius: '0.5rem',
                                    borderLeft: `4px solid ${topic.frequency === 'Very High' ? 'var(--danger)' : topic.frequency === 'High' ? 'var(--warning)' : 'var(--primary)'
                                        }`,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <div style={{ fontWeight: '500', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {topic.name}
                                    {selectedTopic?.key === topic.key && <Sparkles size={14} style={{ color: 'var(--primary)' }} />}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    <span>📊 Frequency: {topic.frequency}</span>
                                    <span>•</span>
                                    <span>📈 Difficulty: {topic.difficulty}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Frequently Asked Questions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card"
                >
                    <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BookOpen size={20} style={{ color: 'var(--primary)' }} />
                        Frequently Asked Questions
                    </h2>
                    <p className="card-description" style={{ marginBottom: '1.5rem' }}>
                        Questions commonly appearing in exams
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {frequentlyAsked.map((question, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + index * 0.05 }}
                                whileHover={{ x: 5 }}
                                style={{
                                    padding: '0.75rem',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '0.375rem',
                                    display: 'flex',
                                    alignItems: 'start',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <span style={{ color: 'var(--primary)', fontWeight: '600', minWidth: '24px' }}>
                                    {index + 1}.
                                </span>
                                <span style={{ color: 'var(--text-secondary)' }}>{question}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Exam Tomorrow Checklist */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card"
                style={{ marginTop: '1.5rem' }}
            >
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={20} style={{ color: 'var(--warning)' }} />
                    "Exam Tomorrow" Checklist
                </h2>
                <p className="card-description" style={{ marginBottom: '1.5rem' }}>
                    Last-minute preparation guide to ensure you're ready
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                    {examChecklist.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleCheck(index)}
                            style={{
                                padding: '0.75rem',
                                background: checkedItems[index] ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)',
                                border: checkedItems[index] ? '1px solid var(--success)' : '1px solid transparent',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                background: checkedItems[index] ? 'var(--success)' : 'var(--bg-secondary)',
                                border: checkedItems[index] ? 'none' : '2px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                {checkedItems[index] && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                    >
                                        <CheckSquare size={16} color="white" />
                                    </motion.div>
                                )}
                            </div>
                            <span style={{
                                color: checkedItems[index] ? 'var(--success)' : 'var(--text-secondary)',
                                textDecoration: checkedItems[index] ? 'line-through' : 'none',
                            }}>
                                {item}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

export default ExamPrep;
