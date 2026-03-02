import api from '../api';

const TYPING_SPEED = 15; // Faster for better UX

const typeText = async (text, onUpdate) => {
    let displayed = '';
    // Typing effect for that "premium" AI feel
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
        displayed += (i === 0 ? '' : ' ') + words[i];
        onUpdate(displayed);
        // Vary typing speed slightly for realism
        await new Promise(resolve => setTimeout(resolve, TYPING_SPEED + Math.random() * 10));
    }
    return displayed;
};

export const MockAI = {
    // Real AI Chat via Backend (Groq)
    async chat(message, onTyping) {
        try {
            // Check if we have a current subject in URL to provide context
            const pathParts = window.location.pathname.split('/');
            const subject = pathParts.includes('theory') ? decodeURIComponent(pathParts[pathParts.length - 1]) : null;

            const response = await api.post('/rag/chat', null, {
                params: {
                    query: message,
                    subject: subject
                }
            });

            const answer = response.data.answer;

            if (onTyping) {
                await typeText(answer, onTyping);
            }

            return answer;
        } catch (error) {
            console.error("AI Chat Error:", error);
            const fallback = "I'm having trouble connecting to my neural network. Please check your connection! 🤖";
            if (onTyping) onTyping(fallback);
            return fallback;
        }
    },

    // Get topic explanation (Real RAG)
    async explainTopic(topicName, onTyping) {
        // This is handled by TheoryMode calling /theory/get-content usually
        // but for consistent interface:
        return this.chat(`Explain the topic "${topicName}" in detail.`, onTyping);
    },

    // Real-time recommendations based on progress
    async getRecommendations(progress) {
        try {
            const query = "Analyze my learning progress and give me 3 specific study recommendations.";
            const response = await api.post('/rag/chat', null, { params: { query } });
            return response.data.answer;
        } catch (e) {
            return "Keep studying your marked topics!";
        }
    },

    // Code analysis (AI powered)
    async analyzeCode(code, language) {
        try {
            const response = await api.post('/practical/analyze', { code, language });
            const data = response.data;

            let feedback = `### AI Code Analysis (${language})\n\n`;
            feedback += `**Status:** ${data.has_error ? '⚠️ Issues Detected' : '✅ Looks Good'}\n\n`;
            feedback += `${data.explanation}\n\n`;
            feedback += `**AI Hint:** ${data.hint}\n\n`;

            if (data.viva_questions) {
                feedback += `**Possible Viva Questions:**\n`;
                data.viva_questions.forEach(q => feedback += `• ${q}\n`);
            }

            return feedback;
        } catch (e) {
            return "Code analysis unavailable.";
        }
    },

    getGreeting() {
        const hour = new Date().getHours();
        const name = localStorage.getItem('user_name') || 'Scholar';
        if (hour < 12) return `Good morning, ${name}! 🌅 Ready to level up your knowledge today?`;
        if (hour < 17) return `Good afternoon, ${name}! ☀️ How can I assist with your studies?`;
        return `Good evening, ${name}! 🌙 Perfect time for some deep learning!`;
    }
};

export default MockAI;
