import React, { useState, useEffect } from 'react';
import api from '../api';
import './EduAgents.css';
import {
    BrainCircuit,
    Users,
    UserCheck,
    Activity,
    Eye,
    Zap,
    MessageSquare,
    ShieldCheck,
    RefreshCw
} from 'lucide-react';

const EduAgents = () => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState([]);

    const fetchAgents = async () => {
        try {
            const response = await api.get('/edu-agents/dashboard');
            setAgents(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch agents', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
        const interval = setInterval(fetchAgents, 5000);
        return () => clearInterval(interval);
    }, []);

    const triggerAction = async (agentId, agentName) => {
        // Optimistic UI update or visual feedback
        addToast(agentName, "Processing autonomous action...");

        try {
            const response = await api.post(`/edu-agents/sim-action/${agentId}`);
            if (response.data.status === 'success') {
                setTimeout(() => {
                    addToast(agentName, response.data.action_taken);
                    fetchAgents(); // Refresh data
                }, 1500); // Fake delay for realism
            }
        } catch (error) {
            addToast(agentName, "Action failed to execute.");
        }
    };

    const addToast = (agent, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, agent, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const getIcon = (id) => {
        switch (id) {
            case 'adaptive_path': return <BrainCircuit size={24} />;
            case 'mentor': return <UserCheck size={24} />;
            case 'peer_collab': return <Users size={24} />;
            case 'engagement': return <Eye size={24} />;
            case 'accessibility': return <ShieldCheck size={24} />;
            default: return <Activity size={24} />;
        }
    };

    const renderMetrics = (metrics) => {
        return Object.entries(metrics).map(([key, value]) => {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            // Handle array or complex object values cleanly
            let displayValue = value;
            if (Array.isArray(value)) displayValue = value.join(', ');

            return (
                <div className="metric-item" key={key}>
                    <span className="metric-key">{label}:</span>
                    <span className="metric-val">{String(displayValue)}</span>
                </div>
            );
        });
    };

    return (
        <div className="edu-agents-dashboard">
            <header className="agents-header">
                <h1 className="agents-title">
                    <Zap size={32} />
                    Autonomous Education Agents
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Real-time orchestration of 5 specialized AI agents managing your learning environment.
                </p>
            </header>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <RefreshCw className="spin" size={32} color="var(--eda-primary)" />
                </div>
            ) : (
                <div className="agents-grid">
                    {agents.map(agent => (
                        <div key={agent.id} className="edu-agent-card">
                            <div className="agent-card-header">
                                <div className="agent-identity">
                                    <div className="agent-icon-box">{getIcon(agent.id)}</div>
                                    <h3 style={{ fontWeight: '600', fontSize: '1.1rem' }}>{agent.name}</h3>
                                </div>
                                <span className={`status-badge status-${agent.status}`}>
                                    {agent.status}
                                </span>
                            </div>

                            <div className="agent-card-body">
                                <p className="agent-description">{agent.description}</p>

                                <div className="agent-metrics">
                                    {renderMetrics(agent.metrics)}
                                </div>

                                <div className="recent-actions">
                                    <div className="action-title">Recent Autonomous Actions</div>
                                    <ul className="action-list">
                                        {agent.recent_actions.map((action, idx) => (
                                            <li key={idx} className="action-item">{action}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="agent-card-footer">
                                <button
                                    className="simulate-btn"
                                    onClick={() => triggerAction(agent.id, agent.name)}
                                >
                                    <Zap size={16} />
                                    Trigger Intervention
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Toast Overlay */}
            <div className="ai-toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className="ai-toast">
                        <MessageSquare size={18} color="#3b82f6" />
                        <div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 'bold' }}>{toast.agent}</div>
                            <div>{toast.message}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EduAgents;
