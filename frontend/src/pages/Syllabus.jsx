import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, BookOpen, Code, FileText, ChevronDown, ChevronUp, File, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Syllabus() {
    const [syllabi, setSyllabi] = useState([]);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [subjectName, setSubjectName] = useState('');
    const [pdfFile, setPdfFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expandedUnits, setExpandedUnits] = useState({});
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);
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

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'application/pdf') {
                setPdfFile(file);
            } else {
                alert('Please upload a PDF file only');
            }
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPdfFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!pdfFile || !subjectName) {
            alert('Please provide both subject name and PDF file');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('subject_name', subjectName);
            formData.append('pdf_file', pdfFile);

            await api.post('/syllabus/upload-pdf', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setShowUploadForm(false);
            setSubjectName('');
            setPdfFile(null);
            fetchSyllabi();
        } catch (error) {
            console.error('Upload error:', error);
            alert(error.response?.data?.detail || 'Failed to upload syllabus');
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

    const removeFile = () => {
        setPdfFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Syllabus</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Upload and manage your course syllabus (PDF format)</p>
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
                    <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={24} style={{ color: 'var(--accent-primary)' }} />
                        Upload New Syllabus (PDF)
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Subject Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Data Structures and Algorithms"
                                value={subjectName}
                                onChange={(e) => setSubjectName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Upload Syllabus PDF</label>
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: `2px dashed ${dragActive ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                    borderRadius: '12px',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: dragActive ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-tertiary)',
                                    transition: 'all 0.3s ease',
                                    minHeight: '180px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '1rem',
                                }}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />

                                {pdfFile ? (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem 1.5rem',
                                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))',
                                        borderRadius: '10px',
                                        border: '1px solid var(--accent-primary)',
                                    }}>
                                        <File size={40} style={{ color: 'var(--accent-primary)' }} />
                                        <div style={{ textAlign: 'left' }}>
                                            <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{pdfFile.name}</p>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile();
                                            }}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.2)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                padding: '0.5rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <X size={18} style={{ color: '#ef4444' }} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Upload size={36} style={{ color: 'white' }} />
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                                                Drag & Drop your PDF here
                                            </p>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                or click to browse files
                                            </p>
                                        </div>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--text-muted)',
                                            background: 'var(--bg-secondary)',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                        }}>
                                            PDF files only • Max 10MB
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !pdfFile || !subjectName}
                            style={{ marginTop: '1rem' }}
                        >
                            {loading ? (
                                <>
                                    <span style={{
                                        width: '18px',
                                        height: '18px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: 'white',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                    }} />
                                    Processing PDF...
                                </>
                            ) : (
                                <>
                                    <Upload size={18} />
                                    Upload Syllabus
                                </>
                            )}
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
