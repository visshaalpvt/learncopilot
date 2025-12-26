// Mock AI Service - Simulates AI responses without actual AI
// This creates a realistic AI experience using pre-trained responses

const TYPING_SPEED = 30; // ms per character

// Knowledge base with comprehensive responses
const knowledgeBase = {
    greetings: [
        "Hello! 👋 I'm your Learning Copilot AI. How can I help you today?",
        "Hi there! Ready to learn something new? I'm here to assist you!",
        "Welcome back! I'm your AI study companion. What would you like to explore?",
    ],

    topics: {
        'data structures': {
            explanation: "Data Structures are specialized formats for organizing and storing data efficiently. Think of them like different containers - arrays are like numbered boxes in a row, linked lists are like a chain of connected boxes, and trees are like an organizational chart.\n\n📚 **Key Types:**\n• Arrays - Fixed size, fast access by index\n• Linked Lists - Dynamic size, efficient insertions\n• Stacks - LIFO (Last In, First Out)\n• Queues - FIFO (First In, First Out)\n• Trees - Hierarchical organization\n• Hash Tables - Key-value pairs for fast lookup",
            tips: ["Start with arrays and linked lists before moving to trees", "Practice implementing each structure from scratch", "Understand time complexity for each operation"],
            questions: ["Can you explain the difference between arrays and linked lists?", "How does a binary search tree work?", "What is the time complexity of hash table operations?"]
        },
        'algorithms': {
            explanation: "Algorithms are step-by-step procedures for solving problems. They're like recipes in cooking - you follow specific steps in a specific order to achieve a desired result.\n\n🧮 **Categories:**\n• Sorting - Bubble, Quick, Merge, Heap\n• Searching - Linear, Binary, DFS, BFS\n• Dynamic Programming - Breaking problems into subproblems\n• Greedy - Making locally optimal choices\n• Divide and Conquer - Breaking into smaller parts",
            tips: ["Master Big-O notation first", "Solve problems on LeetCode daily", "Focus on patterns, not memorization"],
            questions: ["What's the time complexity of quicksort?", "When should I use dynamic programming?", "Explain the difference between BFS and DFS"]
        },
        'oop': {
            explanation: "Object-Oriented Programming (OOP) organizes code around 'objects' that contain data and behavior. It's like modeling real-world entities in code.\n\n🎯 **Four Pillars:**\n• **Encapsulation** - Bundling data and methods, hiding internals\n• **Abstraction** - Showing only what's necessary\n• **Inheritance** - Creating new classes from existing ones\n• **Polymorphism** - Objects taking multiple forms",
            tips: ["Start by modeling real-world objects", "Use composition over inheritance when possible", "Learn SOLID principles"],
            questions: ["What's the difference between abstract class and interface?", "Can you give a real-world example of polymorphism?", "How does encapsulation improve code security?"]
        },
        'dbms': {
            explanation: "Database Management Systems (DBMS) are software for managing databases. They're like super-organized filing systems that can handle millions of records efficiently.\n\n💾 **Key Concepts:**\n• SQL - Structured Query Language\n• Normalization - Eliminating redundancy (1NF, 2NF, 3NF)\n• ACID Properties - Atomicity, Consistency, Isolation, Durability\n• Indexing - Speed up data retrieval\n• Joins - Combining data from multiple tables",
            tips: ["Practice SQL queries daily", "Understand normalization forms", "Learn about query optimization"],
            questions: ["What is the difference between SQL and NoSQL?", "Explain the different types of joins", "What is database normalization?"]
        },
        'networking': {
            explanation: "Computer Networking is connecting computers to share resources. Think of it like a postal system for digital messages.\n\n🌐 **OSI Model (7 Layers):**\n1. Physical - Cables, signals\n2. Data Link - MAC addresses, switches\n3. Network - IP addressing, routers\n4. Transport - TCP/UDP, ports\n5. Session - Connection management\n6. Presentation - Encryption, formatting\n7. Application - HTTP, FTP, SMTP",
            tips: ["Memorize the OSI model and its functions", "Understand TCP vs UDP differences", "Practice subnetting"],
            questions: ["What's the difference between TCP and UDP?", "How does DNS work?", "Explain the three-way handshake"]
        },
        'python': {
            explanation: "Python is a high-level, interpreted programming language known for its readability and simplicity.\n\n🐍 **Key Features:**\n• Easy to learn syntax\n• Dynamic typing\n• Rich standard library\n• Extensive third-party packages\n• Great for beginners and experts alike",
            tips: ["Practice with small projects", "Use Python for automation tasks", "Learn list comprehensions and generators"],
            questions: ["What is the difference between list and tuple?", "How does Python handle memory?", "Explain decorators in Python"]
        }
    },

    encouragement: [
        "Great question! You're making excellent progress. 🌟",
        "You're on the right track! Keep exploring. 💪",
        "Fantastic curiosity! That's what makes great programmers. 🚀",
        "Love your dedication to learning! Let me help you with that. 📚",
    ],

    studyTips: [
        "💡 **Pro tip:** Break your study sessions into 25-minute focused blocks (Pomodoro Technique).",
        "📝 **Study hack:** Teaching concepts to others solidifies your understanding.",
        "🎯 **Remember:** Consistent daily practice beats weekend cramming every time.",
        "✨ **Tip:** Solve at least 2-3 coding problems daily to maintain momentum.",
    ],

    codeReview: {
        python: {
            positive: ["Clean code structure!", "Good use of functions!", "Nice variable naming!"],
            suggestions: [
                "Consider adding type hints for better readability",
                "You might want to add error handling with try-except",
                "Consider breaking this into smaller functions"
            ]
        },
        c: {
            positive: ["Good memory management!", "Clean logic flow!", "Proper use of pointers!"],
            suggestions: [
                "Don't forget to free allocated memory",
                "Consider checking for NULL before dereferencing",
                "Add comments to explain complex logic"
            ]
        }
    }
};

// Simulate thinking delay
const thinkingDelay = () => new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

// Simulate typing effect
const typeText = async (text, onUpdate) => {
    let displayed = '';
    for (let i = 0; i < text.length; i++) {
        displayed += text[i];
        onUpdate(displayed);
        await new Promise(resolve => setTimeout(resolve, TYPING_SPEED + Math.random() * 20));
    }
    return displayed;
};

// Find best matching topic
const findTopic = (query) => {
    const lowerQuery = query.toLowerCase();
    for (const [key, value] of Object.entries(knowledgeBase.topics)) {
        if (lowerQuery.includes(key) || key.includes(lowerQuery.replace(/[^a-z]/g, ''))) {
            return { key, ...value };
        }
    }
    return null;
};

// Generate contextual response
const generateResponse = (query) => {
    const lowerQuery = query.toLowerCase();

    // Check for greetings
    if (/^(hi|hello|hey|greetings)/i.test(query)) {
        return knowledgeBase.greetings[Math.floor(Math.random() * knowledgeBase.greetings.length)];
    }

    // Check for help/tips request
    if (/tip|help|advice|suggest/i.test(query)) {
        return knowledgeBase.studyTips[Math.floor(Math.random() * knowledgeBase.studyTips.length)];
    }

    // Check for topic match
    const topic = findTopic(query);
    if (topic) {
        const encouragement = knowledgeBase.encouragement[Math.floor(Math.random() * knowledgeBase.encouragement.length)];
        return `${encouragement}\n\n${topic.explanation}\n\n💡 **Tips:**\n${topic.tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\n❓ **Practice Questions:**\n${topic.questions.map((q, i) => `• ${q}`).join('\n')}`;
    }

    // Default intelligent response
    return `I understand you're asking about "${query}". While I'm still learning about this specific topic, here are some ways I can help:\n\n🎯 **I can assist with:**\n• Data Structures & Algorithms\n• Object-Oriented Programming\n• Database Management Systems\n• Computer Networking\n• Python & C Programming\n\n💡 Try asking me:\n• "Explain data structures"\n• "Give me tips for algorithms"\n• "What is OOP?"\n\n${knowledgeBase.studyTips[Math.floor(Math.random() * knowledgeBase.studyTips.length)]}`;
};

// Main AI interface
export const MockAI = {
    // Chat with AI (with typing effect)
    async chat(message, onTyping) {
        await thinkingDelay();
        const response = generateResponse(message);

        if (onTyping) {
            await typeText(response, onTyping);
        }

        return response;
    },

    // Get topic explanation
    async explainTopic(topicName, onTyping) {
        await thinkingDelay();
        const topic = findTopic(topicName);

        if (!topic) {
            const fallback = `Let me explain ${topicName} for you...\n\n${topicName} is an important concept in computer science. Understanding it well will help you in both academics and interviews.\n\n📖 I recommend exploring the Theory Mode for detailed content on this topic.`;
            if (onTyping) await typeText(fallback, onTyping);
            return fallback;
        }

        const response = topic.explanation;
        if (onTyping) await typeText(response, onTyping);
        return response;
    },

    // Get study recommendations
    async getRecommendations(progress) {
        await thinkingDelay();

        const weakAreas = progress?.filter(p => p.is_confused) || [];
        const inProgress = progress?.filter(p => !p.is_completed && !p.is_confused) || [];

        let recommendations = "🤖 **AI Study Recommendations:**\n\n";

        if (weakAreas.length > 0) {
            recommendations += `⚠️ **Priority Review:** You marked ${weakAreas.length} topic(s) as confusing. Let's revisit:\n`;
            weakAreas.forEach(w => {
                recommendations += `• ${w.topic_name}\n`;
            });
            recommendations += "\n";
        }

        if (inProgress.length > 0) {
            recommendations += `📚 **Continue Learning:**\n`;
            inProgress.slice(0, 3).forEach(p => {
                recommendations += `• ${p.topic_name}\n`;
            });
            recommendations += "\n";
        }

        recommendations += knowledgeBase.studyTips[Math.floor(Math.random() * knowledgeBase.studyTips.length)];

        return recommendations;
    },

    // Code analysis with AI-like feedback
    async analyzeCode(code, language, existingAnalysis) {
        await thinkingDelay();

        const lang = language.toLowerCase();
        const review = knowledgeBase.codeReview[lang] || knowledgeBase.codeReview.python;

        let aiInsight = "🤖 **AI Code Insights:**\n\n";

        if (existingAnalysis?.has_error) {
            aiInsight += `⚠️ I detected a potential issue. ${existingAnalysis.explanation || ''}\n\n`;
            aiInsight += `💡 **Suggestion:** ${existingAnalysis.suggested_fix || review.suggestions[0]}\n\n`;
        } else {
            aiInsight += `✅ ${review.positive[Math.floor(Math.random() * review.positive.length)]}\n\n`;
        }

        aiInsight += `📝 **Remember:**\n• ${review.suggestions[Math.floor(Math.random() * review.suggestions.length)]}\n`;

        return aiInsight;
    },

    // Generate exam prep guidance
    async getExamGuidance(topicName) {
        await thinkingDelay();

        const topic = findTopic(topicName);

        let guidance = `📖 **Exam Preparation Guide for ${topicName}:**\n\n`;

        if (topic) {
            guidance += `**Key Points to Remember:**\n${topic.tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\n`;
            guidance += `**Likely Exam Questions:**\n${topic.questions.map(q => `• ${q}`).join('\n')}\n\n`;
        }

        guidance += `🎯 **Exam Strategy:**\n`;
        guidance += `• Review 2-mark definitions first\n`;
        guidance += `• Practice writing 10-mark answers in 15 minutes\n`;
        guidance += `• Focus on examples and diagrams\n`;

        return guidance;
    },

    // Quick greeting
    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning! 🌅 Ready to learn something new today?";
        if (hour < 17) return "Good afternoon! ☀️ Let's continue your learning journey!";
        return "Good evening! 🌙 Great time for a focused study session!";
    }
};

export default MockAI;
