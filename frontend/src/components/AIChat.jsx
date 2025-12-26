import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import MockAI from '../services/mockAI';

function AIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [currentTypingText, setCurrentTypingText] = useState('');
    const messagesEndRef = useRef(null);

    // Initialize with greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: 1,
                type: 'ai',
                text: MockAI.getGreeting(),
                timestamp: new Date()
            }]);
        }
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, currentTypingText]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const messageText = input;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            text: messageText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);
        setCurrentTypingText('');

        let finalResponse = '';

        try {
            finalResponse = await MockAI.chat(messageText, (text) => {
                setCurrentTypingText(text);
            });

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'ai',
                text: finalResponse,
                timestamp: new Date()
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'ai',
                text: "I'm sorry, I encountered an issue. Please try again! 🤖",
                timestamp: new Date()
            }]);
        }

        setIsTyping(false);
        setCurrentTypingText('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickPrompts = [
        "Explain data structures",
        "Give me study tips",
        "What is OOP?",
        "Help with algorithms"
    ];

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        style={{
                            position: 'fixed',
                            bottom: '2rem',
                            right: '2rem',
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
                            zIndex: 1000,
                        }}
                    >
                        <Sparkles size={28} color="white" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.8 }}
                        style={{
                            position: 'fixed',
                            bottom: '2rem',
                            right: '2rem',
                            width: '380px',
                            height: '520px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '1rem',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            zIndex: 1000,
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Bot size={24} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', color: 'white' }}>Learning Copilot AI</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                                        Online · Ready to help
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <X size={18} color="white" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div style={{
                            flex: 1,
                            overflow: 'auto',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                        }}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        alignItems: 'flex-start',
                                        flexDirection: msg.type === 'user' ? 'row-reverse' : 'row',
                                    }}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: msg.type === 'user' ? 'var(--primary)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        {msg.type === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="white" />}
                                    </div>
                                    <div style={{
                                        maxWidth: '80%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '1rem',
                                        background: msg.type === 'user' ? 'var(--primary)' : 'var(--bg-tertiary)',
                                        color: msg.type === 'user' ? 'white' : 'var(--text-primary)',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.5',
                                        whiteSpace: 'pre-wrap',
                                    }}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing indicator */}
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <Bot size={16} color="white" />
                                    </div>
                                    <div style={{
                                        maxWidth: '80%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '1rem',
                                        background: 'var(--bg-tertiary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.5',
                                        whiteSpace: 'pre-wrap',
                                    }}>
                                        {currentTypingText || (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Loader2 size={16} className="spin" />
                                                <span style={{ color: 'var(--text-muted)' }}>Thinking...</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Prompts */}
                        {messages.length <= 1 && !isTyping && (
                            <div style={{
                                padding: '0.5rem 1rem',
                                display: 'flex',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                            }}>
                                {quickPrompts.map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setInput(prompt)}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            fontSize: '0.8rem',
                                            background: 'var(--bg-tertiary)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '999px',
                                            color: 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = 'var(--primary)'}
                                        onMouseLeave={(e) => e.target.style.background = 'var(--bg-tertiary)'}
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div style={{
                            padding: '1rem',
                            borderTop: '1px solid var(--border)',
                            display: 'flex',
                            gap: '0.5rem',
                        }}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask me anything..."
                                disabled={isTyping}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1rem',
                                    background: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping}
                                style={{
                                    padding: '0.75rem',
                                    background: input.trim() && !isTyping ? 'var(--primary)' : 'var(--bg-tertiary)',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Send size={18} color={input.trim() && !isTyping ? 'white' : 'var(--text-muted)'} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </>
    );
}

export default AIChat;
