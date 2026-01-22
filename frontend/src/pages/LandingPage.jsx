import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './LandingPage.css';

const LandingPage = () => {
    const fadeInUp = {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const staggerContainer = {
        animate: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const features = [
        {
            icon: "🎯",
            title: "AI-Personalized Learning Paths",
            description: "Smart algorithms adapt to your learning style and pace for maximum efficiency."
        },
        {
            icon: "⚡",
            title: "Real-Time Practice Feedback",
            description: "Get instant insights on your performance with detailed analytics."
        },
        {
            icon: "📊",
            title: "Progress Analytics",
            description: "Track your growth with beautiful dashboards and actionable metrics."
        },
        {
            icon: "🧠",
            title: "5 Autonomous AI Agents",
            description: "Specialized AI assistants for tutoring, mentoring, and exam preparation."
        },
        {
            icon: "📚",
            title: "Smart Syllabus Management",
            description: "Upload your syllabus and let AI create your personalized study plan."
        },
        {
            icon: "🎮",
            title: "Gamified Learning",
            description: "Earn XP, unlock achievements, and stay motivated with streaks."
        }
    ];

    const steps = [
        {
            number: "01",
            title: "Upload Your Syllabus",
            description: "Simply upload your course PDF and our AI extracts topics instantly."
        },
        {
            number: "02",
            title: "Get Personalized Path",
            description: "AI creates a custom learning roadmap based on your goals and timeline."
        },
        {
            number: "03",
            title: "Learn & Master",
            description: "Study with AI assistance, practice with feedback, and track your progress."
        }
    ];

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-container">
                    <Link to="/" className="nav-logo">
                        <span className="logo-icon">🎓</span>
                        <span className="logo-text">LearnCopilot</span>
                    </Link>
                    <div className="nav-links">
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How It Works</a>
                    </div>
                    <div className="nav-actions">
                        <Link to="/login" className="btn-ghost">Sign In</Link>
                        <Link to="/register" className="btn-primary">Get Started Free</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-bg-gradient"></div>
                <div className="hero-container">
                    <motion.div
                        className="hero-content"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="hero-badge">
                            <span className="badge-dot"></span>
                            Powered by Advanced AI
                        </div>
                        <h1 className="hero-title">
                            Build Smarter.<br />
                            <span className="gradient-text">Learn Faster.</span><br />
                            Succeed Confidently.
                        </h1>
                        <p className="hero-subtitle">
                            The AI-powered learning platform that adapts to you.
                            Get personalized study paths, instant feedback, and
                            autonomous AI agents that guide you to mastery.
                        </p>
                        <div className="hero-ctas">
                            <Link to="/register" className="btn-primary btn-lg">
                                Get Started Free
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </Link>
                            <a href="#how-it-works" className="btn-secondary btn-lg">
                                See How It Works
                            </a>
                        </div>
                    </motion.div>
                    <motion.div
                        className="hero-visual"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="mockup-container">
                            <div className="mockup-window">
                                <div className="mockup-header">
                                    <div className="mockup-dots">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                                <div className="mockup-content">
                                    <div className="mockup-sidebar">
                                        <div className="sidebar-item active"></div>
                                        <div className="sidebar-item"></div>
                                        <div className="sidebar-item"></div>
                                        <div className="sidebar-item"></div>
                                    </div>
                                    <div className="mockup-main">
                                        <div className="mockup-card large"></div>
                                        <div className="mockup-cards-row">
                                            <div className="mockup-card small"></div>
                                            <div className="mockup-card small"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="floating-card card-1">
                                <span className="floating-icon">🎯</span>
                                <span>AI Tutor Active</span>
                            </div>
                            <div className="floating-card card-2">
                                <span className="floating-icon">📈</span>
                                <span>Track Progress</span>
                            </div>
                            <div className="floating-card card-3">
                                <span className="floating-icon">⭐</span>
                                <span>Earn Rewards</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section" id="features">
                <div className="section-container">
                    <motion.div
                        className="section-header"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="section-badge">Features</span>
                        <h2 className="section-title">Everything you need to excel</h2>
                        <p className="section-subtitle">
                            Powerful tools designed to transform how you learn,
                            practice, and achieve your academic goals.
                        </p>
                    </motion.div>
                    <motion.div
                        className="features-grid"
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                    >
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                className="feature-card"
                                variants={fadeInUp}
                            >
                                <div className="feature-icon">{feature.icon}</div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works-section" id="how-it-works">
                <div className="section-container">
                    <motion.div
                        className="section-header"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="section-badge">How It Works</span>
                        <h2 className="section-title">Start learning in 3 simple steps</h2>
                        <p className="section-subtitle">
                            Get up and running in minutes. No complex setup required.
                        </p>
                    </motion.div>
                    <div className="steps-container">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                className="step-card"
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.2 }}
                            >
                                <div className="step-number">{step.number}</div>
                                <h3 className="step-title">{step.title}</h3>
                                <p className="step-description">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="cta-section">
                <div className="cta-container">
                    <motion.div
                        className="cta-content"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="cta-title">Ready to transform your learning?</h2>
                        <p className="cta-subtitle">
                            Start your journey with AI-powered study tools today.
                        </p>
                        <Link to="/register" className="btn-primary btn-xl">
                            Start Learning Free Today
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                        <p className="cta-note">No credit card required • Free to use</p>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-container">
                    <div className="footer-main">
                        <div className="footer-brand">
                            <Link to="/" className="footer-logo">
                                <span className="logo-icon">🎓</span>
                                <span className="logo-text">LearnCopilot</span>
                            </Link>
                            <p className="footer-tagline">
                                AI-powered learning platform for students.
                            </p>
                        </div>
                        <div className="footer-links">
                            <div className="footer-column">
                                <h4>Product</h4>
                                <a href="#features">Features</a>
                                <a href="#how-it-works">How It Works</a>
                            </div>
                            <div className="footer-column">
                                <h4>Get Started</h4>
                                <Link to="/register">Sign Up</Link>
                                <Link to="/login">Sign In</Link>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>© 2026 LearnCopilot. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
