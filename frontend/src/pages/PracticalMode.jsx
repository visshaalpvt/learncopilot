import { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Play, AlertTriangle, CheckCircle, Lightbulb, Wrench, Sparkles, Brain, Loader2 } from 'lucide-react';
import api from '../api';
import MockAI from '../services/mockAI';

function PracticalMode() {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('Python');
    const [analysis, setAnalysis] = useState(null);
    const [aiInsight, setAiInsight] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

    const analyzeCode = async () => {
        if (!code.trim()) {
            alert('Please enter some code to analyze');
            return;
        }

        setLoading(true);
        setIsAiAnalyzing(true);
        setAiInsight('');

        try {
            const response = await api.post('/practical/analyze', {
                code,
                language: language.toLowerCase(),
            });
            setAnalysis(response.data);

            // Get AI insight
            const insight = await MockAI.analyzeCode(code, language, response.data);
            setAiInsight(insight);

            // Track lab attempt
            await api.post('/progress/update', {
                topic_id: 'practical_' + Date.now(),
                topic_name: 'Practical Lab',
                labs_attempted: 1,
            });
        } catch (error) {
            console.error('Failed to analyze code:', error);
            // Still provide AI insight even if API fails
            const insight = await MockAI.analyzeCode(code, language, null);
            setAiInsight(insight);
        } finally {
            setLoading(false);
            setIsAiAnalyzing(false);
        }
    };

    const codeExamples = {
        Python: `# Example: Calculate factorial
def factorial(n):
    if n == 0
        return 1
    return n * factorial(n-1)

print(factorial(5))`,
        C: `#include <stdio.h>

int main() {
    int arr[5] = {1, 2, 3, 4, 5};
    printf("%d", arr[10]);
    return 0;
}`,
    };

    const loadExample = () => {
        setCode(codeExamples[language]);
        setAnalysis(null);
        setAiInsight('');
    };

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                        <Code size={32} style={{ color: 'var(--primary)' }} />
                    </motion.div>
                    Practical Mode
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Write code, detect errors, and learn from AI-powered analysis</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Left Panel - Code Editor */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card"
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 className="card-title" style={{ marginBottom: 0 }}>Code Editor</h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                                className="form-select"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                style={{ width: 'auto' }}
                            >
                                <option>Python</option>
                                <option>C</option>
                            </select>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn btn-sm btn-secondary"
                                onClick={loadExample}
                            >
                                Load Example
                            </motion.button>
                        </div>
                    </div>

                    <textarea
                        className="form-textarea code-editor"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={`Write your ${language} code here...`}
                        style={{
                            minHeight: '400px',
                            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                            fontSize: '0.9rem',
                            lineHeight: '1.5',
                        }}
                    />

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn btn-primary"
                        onClick={analyzeCode}
                        disabled={loading}
                        style={{ marginTop: '1rem', width: '100%' }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="spin" />
                                AI is Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Analyze with AI
                            </>
                        )}
                    </motion.button>
                </motion.div>

                {/* Right Panel - Analysis Results */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card"
                >
                    <h2 className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Brain size={20} style={{ color: 'var(--primary)' }} />
                        AI Analysis Results
                    </h2>

                    {analysis ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Error Status */}
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                style={{
                                    padding: '1rem',
                                    background: analysis.has_error
                                        ? 'rgba(239, 68, 68, 0.1)'
                                        : 'rgba(16, 185, 129, 0.1)',
                                    border: `1px solid ${analysis.has_error ? 'var(--danger)' : 'var(--success)'}`,
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                }}
                            >
                                {analysis.has_error ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 0.5, repeat: 2 }}
                                        >
                                            <AlertTriangle size={24} style={{ color: 'var(--danger)' }} />
                                        </motion.div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: 'var(--danger)' }}>Error Detected!</div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                {analysis.error_type?.replace('_', ' ').toUpperCase()}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <CheckCircle size={24} style={{ color: 'var(--success)' }} />
                                        </motion.div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: 'var(--success)' }}>No Obvious Errors</div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Code looks good!</div>
                                        </div>
                                    </>
                                )}
                            </motion.div>

                            {/* AI Insight */}
                            {aiInsight && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        padding: '1rem',
                                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                                        border: '1px solid rgba(99, 102, 241, 0.3)',
                                        borderRadius: '0.5rem',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                                        <span style={{ fontWeight: '500', color: 'var(--primary)' }}>AI Insights</span>
                                        {isAiAnalyzing && <Loader2 size={14} className="spin" />}
                                    </div>
                                    <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                                        {aiInsight}
                                    </p>
                                </motion.div>
                            )}

                            {/* Explanation */}
                            {analysis.explanation && (
                                <div
                                    style={{
                                        padding: '1rem',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '0.5rem',
                                        borderLeft: '4px solid var(--primary)',
                                    }}
                                >
                                    <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <AlertTriangle size={16} />
                                        Explanation
                                    </div>
                                    <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>{analysis.explanation}</p>
                                </div>
                            )}

                            {/* Hint */}
                            {analysis.hint && (
                                <div
                                    style={{
                                        padding: '1rem',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '0.5rem',
                                        borderLeft: '4px solid var(--warning)',
                                    }}
                                >
                                    <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Lightbulb size={16} />
                                        Hint
                                    </div>
                                    <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>{analysis.hint}</p>
                                </div>
                            )}

                            {/* Suggested Fix */}
                            {analysis.suggested_fix && (
                                <div
                                    style={{
                                        padding: '1rem',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '0.5rem',
                                        borderLeft: '4px solid var(--success)',
                                    }}
                                >
                                    <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Wrench size={16} />
                                        Suggested Fix
                                    </div>
                                    <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>{analysis.suggested_fix}</p>
                                </div>
                            )}

                            {/* Viva Questions */}
                            {analysis.viva_questions && analysis.viva_questions.length > 0 && (
                                <div
                                    style={{
                                        padding: '1rem',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '0.5rem',
                                    }}
                                >
                                    <div style={{ fontWeight: '600', marginBottom: '0.75rem' }}>🎯 Lab Viva Questions</div>
                                    <ul style={{ paddingLeft: '1.5rem' }}>
                                        {analysis.viva_questions.map((question, index) => (
                                            <motion.li
                                                key={index}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                style={{
                                                    marginBottom: '0.5rem',
                                                    lineHeight: '1.6',
                                                    color: 'var(--text-secondary)',
                                                }}
                                            >
                                                {question}
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Code size={64} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                            </motion.div>
                            <h3 style={{ marginBottom: '0.5rem' }}>Ready to Analyze</h3>
                            <p>Write your code and click "Analyze with AI" to get intelligent feedback</p>
                        </div>
                    )}
                </motion.div>
            </div>

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

export default PracticalMode;
