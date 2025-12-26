import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, BookOpen, Code, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Syllabus() {
    const [syllabi, setSyllabi] = useState([]);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [formData, setFormData] = useState({ subject_name: '', raw_content: '' });
    const [loading, setLoading] = useState(false);
    const [expandedUnits, setExpandedUnits] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        fetchSyllabi();
    }, []);

    const fetchSyllabi = async () => {
        try {
            const response = await api.get('/syllabus/list');
            setSyllabi(response.data);
        } catch (error) {
            console.error('Failed to fetch syllabi:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/syllabus/upload', formData);
            setShowUploadForm(false);
            setFormData({ subject_name: '', raw_content: '' });
            fetchSyllabi();
        } catch (error) {
            alert('Failed to upload syllabus');
        } finally {
            setLoading(false);
        }
    };

    const toggleUnit = (syllabusId, unitIndex) => {
        const key = `${syllabusId}-${unitIndex}`;
        setExpandedUnits(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleLearnTopic = (topic) => {
        navigate('/theory', { state: { topic } });
    };

    const handlePracticeTopic = (topic) => {
        navigate('/practical', { state: { topic } });
    };

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Syllabus</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Upload and manage your course syllabus</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowUploadForm(!showUploadForm)}>
                    <Upload size={18} />
                    {showUploadForm ? 'Cancel' : 'Upload Syllabus'}
                </button>
            </div>

            {/* Upload Form */}
            {showUploadForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="card"
                    style={{ marginBottom: '2rem' }}
                >
                    <h2 className="card-title">Upload New Syllabus</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Subject Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Data Structures and Algorithms"
                                value={formData.subject_name}
                                onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Paste Syllabus Content</label>
                            <textarea
                                className="form-textarea"
                                style={{ minHeight: '200px', fontFamily: 'inherit' }}
                                placeholder={`Paste your syllabus here. Example:

Unit 1: Introduction to Data Structures
- Arrays and Linked Lists
- Stacks and Queues  
- Trees and Graphs

Unit 2: Algorithms
- Sorting Algorithms
- Searching Algorithms
- Dynamic Programming`}
                                value={formData.raw_content}
                                onChange={(e) => setFormData({ ...formData, raw_content: e.target.value })}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Uploading...' : 'Upload Syllabus'}
                        </button>
                    </form>
                </motion.div>
            )}

            {/* Syllabi List */}
            {syllabi.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <FileText size={64} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>No Syllabus Uploaded</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Upload your course syllabus to get started with personalized learning
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowUploadForm(true)}>
                        <Upload size={18} />
                        Upload Your First Syllabus
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {syllabi.map((syllabus, sIndex) => (
                        <motion.div
                            key={syllabus.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: sIndex * 0.1 }}
                            className="card"
                        >
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h2 className="card-title">{syllabus.subject_name}</h2>
                                <p className="card-description">
                                    {syllabus.parsed_data.total_topics} topics • {syllabus.parsed_data.units.length} units
                                </p>
                            </div>

                            {/* Units */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {syllabus.parsed_data.units.map((unit, uIndex) => {
                                    const key = `${syllabus.id}-${uIndex}`;
                                    const isExpanded = expandedUnits[key];

                                    return (
                                        <div
                                            key={uIndex}
                                            style={{
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: '0.5rem',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    padding: '1rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => toggleUnit(syllabus.id, uIndex)}
                                            >
                                                <div style={{ fontWeight: '600' }}>{unit.unit_name}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                        {unit.topics.length} topics
                                                    </span>
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    style={{ padding: '0 1rem 1rem 1rem' }}
                                                >
                                                    {unit.topics.map((topic, tIndex) => (
                                                        <div
                                                            key={tIndex}
                                                            style={{
                                                                padding: '0.75rem',
                                                                background: 'var(--bg-secondary)',
                                                                borderRadius: '0.375rem',
                                                                marginBottom: '0.5rem',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                            }}
                                                        >
                                                            <div style={{ flex: 1 }}>{topic.name}</div>
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <button
                                                                    className="btn btn-sm btn-primary"
                                                                    onClick={() => handleLearnTopic(topic)}
                                                                >
                                                                    <BookOpen size={14} />
                                                                    Learn
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-secondary"
                                                                    onClick={() => handlePracticeTopic(topic)}
                                                                >
                                                                    <Code size={14} />
                                                                    Practice
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Syllabus;
