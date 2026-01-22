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

    const testimonials = [
        {
            name: "Priya Sharma",
            role: "Computer Science Student",
            avatar: "PS",
            rating: 5,
            text: "LearnCopilot transformed how I study. The AI agents are like having personal tutors available 24/7."
        },
        {
            name: "Rahul Verma",
            role: "Engineering Graduate",
            avatar: "RV",
            rating: 5,
            text: "The exam preparation features helped me score in the top 5% of my class. Absolutely game-changing!"
        },
        {
            name: "Dr. Anita Patel",
            role: "University Professor",
            avatar: "AP",
            rating: 5,
            text: "I recommend LearnCopilot to all my students. The analytics help me understand where they need support."
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
                        <a href="#testimonials">Testimonials</a>
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
                        <div className="hero-stats">
                            <div className="stat-item">
                                <span className="stat-number">10K+</span>
                                <span className="stat-label">Active Learners</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <span className="stat-number">50+</span>
                                <span className="stat-label">Institutions</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <span className="stat-number">95%</span>
                                <span className="stat-label">Success Rate</span>
                            </div>
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
                                <span>+23% Progress</span>
                            </div>
                            <div className="floating-card card-3">
                                <span className="floating-icon">⭐</span>
                                <span>New Achievement!</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="trust-section">
                <div className="trust-container">
                    <p className="trust-label">Trusted by learners and institutions worldwide</p>
                    <div className="trust-logos">
                        <div className="trust-logo">🏛️ University Partners</div>
                        <div className="trust-logo">🏢 EdTech Leaders</div>
                        <div className="trust-logo">🌍 Global Reach</div>
                        <div className="trust-logo">🏆 Award Winning</div>
                    </div>
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

            {/* Testimonials Section */}
            <section className="testimonials-section" id="testimonials">
                <div className="section-container">
                    <motion.div
                        className="section-header"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="section-badge">Testimonials</span>
                        <h2 className="section-title">Loved by thousands of learners</h2>
                        <p className="section-subtitle">
                            See what our users have to say about their learning journey.
                        </p>
                    </motion.div>
                    <div className="testimonials-grid">
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={index}
                                className="testimonial-card"
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.15 }}
                            >
                                <div className="testimonial-rating">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <span key={i} className="star">⭐</span>
                                    ))}
                                </div>
                                <p className="testimonial-text">"{testimonial.text}"</p>
                                <div className="testimonial-author">
                                    <div className="author-avatar">{testimonial.avatar}</div>
                                    <div className="author-info">
                                        <span className="author-name">{testimonial.name}</span>
                                        <span className="author-role">{testimonial.role}</span>
                                    </div>
                                </div>
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
                            Join thousands of learners who are already achieving more with AI-powered study tools.
                        </p>
                        <Link to="/register" className="btn-primary btn-xl">
                            Start Learning Free Today
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                        <p className="cta-note">No credit card required • Free forever for individuals</p>
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
                                AI-powered learning platform for the next generation of learners.
                            </p>
                        </div>
                        <div className="footer-links">
                            <div className="footer-column">
                                <h4>Product</h4>
                                <a href="#features">Features</a>
                                <a href="#how-it-works">How It Works</a>
                                <a href="#testimonials">Testimonials</a>
                            </div>
                            <div className="footer-column">
                                <h4>Company</h4>
                                <a href="#">About Us</a>
                                <a href="#">Careers</a>
                                <a href="#">Contact</a>
                            </div>
                            <div className="footer-column">
                                <h4>Legal</h4>
                                <a href="#">Privacy Policy</a>
                                <a href="#">Terms of Service</a>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>© 2026 LearnCopilot. All rights reserved.</p>
                        <div className="footer-social">
                            <a href="#" aria-label="Twitter">𝕏</a>
                            <a href="#" aria-label="LinkedIn">in</a>
                            <a href="#" aria-label="GitHub">⚙</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
