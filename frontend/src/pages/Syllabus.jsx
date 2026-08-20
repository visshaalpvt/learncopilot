import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, BookOpen, FileText, ChevronDown,
    ChevronUp, File, X, Sparkles, CheckCircle2,
    Search, RefreshCw, Layers, Database, Target,
    Download, ExternalLink, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Syllabus() {
    const [subjects, setSubjects] = useState([]);
    const [allDocuments, setAllDocuments] = useState([]);
    const [expandedSubject, setExpandedSubject] = useState(null);
    const [subjectCurriculum, setSubjectCurriculum] = useState({});
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [subjectName, setSubjectName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [systemStats, setSystemStats] = useState({ vector_store: { total_chunks: 0, total_retrievals: 0 } });
    const [selectedDocumentBySubject, setSelectedDocumentBySubject] = useState({});
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const [uploadError, setUploadError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch subjects
            const subRes = await api.get('/rag/subjects');
            setSubjects(subRes.data.subjects || []);

            // Fetch all documents
            const docRes = await api.get('/rag/documents');
            setAllDocuments(docRes.data.documents || []);

            // Fetch full stats
            const statsRes = await api.get('/rag/stats');
            setSystemStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    const fetchCurriculum = async (subject) => {
        if (subjectCurriculum[subject]) return;
        try {
            const response = await api.get(`/rag/curriculum/${encodeURIComponent(subject)}`);
            setSubjectCurriculum(prev => ({
                ...prev,
                [subject]: response.data.topics || []
            }));
        } catch (error) {
            console.error(`Failed to fetch curriculum for ${subject}:`, error);
        }
    };

    const toggleSubject = (subject) => {
        if (expandedSubject === subject) {
            setExpandedSubject(null);
        } else {
            setExpandedSubject(subject);
            fetchCurriculum(subject);
        }
    };

    const selectDocument = async (subject, filename) => {
        const key = `${subject}_${filename}`;
        if (selectedDocumentBySubject[subject] === filename) {
            // Deselect: show all curriculum for subject
            setSelectedDocumentBySubject(prev => ({ ...prev, [subject]: null }));
            fetchCurriculum(subject);
        } else {
            setSelectedDocumentBySubject(prev => ({ ...prev, [subject]: filename }));
            // Fetch curriculum with filename filter
            try {
                const response = await api.get(`/rag/curriculum/${encodeURIComponent(subject)}?filename=${encodeURIComponent(filename)}`);
                setSubjectCurriculum(prev => ({
                    ...prev,
                    [subject]: response.data.topics || []
                }));
            } catch (error) {
                console.error(`Failed to fetch filtered curriculum:`, error);
            }
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === "dragenter" || e.type === "dragover");
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file) => {
        setUploadError(null);
        const validTypes = ['.pdf', '.txt', '.md'];
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (validTypes.includes(ext)) {
            setSelectedFile(file);
        } else {
            setUploadError('Please upload a PDF, TXT or MD file.');
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!selectedFile) return;

        setLoading(true);
        setUploadSuccess(null);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            if (subjectName.trim()) {
                formData.append('subject_hint', subjectName.trim());
            }

            const response = await api.post('/rag/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                const newSubject = response.data.subject;
                setUploadSuccess({
                    message: response.data.message,
                    subject: newSubject,
                    chunks: response.data.chunks_created
                });
                setSubjectName('');
                setSelectedFile(null);
                await fetchData();
                if (newSubject) {
                    setExpandedSubject(newSubject);
                    fetchCurriculum(newSubject);
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            const detail = error.response?.data?.detail || error.message || 'Failed to upload and process document';
            setUploadError(typeof detail === 'string' ? detail : JSON.stringify(detail));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ paddingBottom: '4rem' }}>
            {/* Header */}
            <div style={{
                marginBottom: '2.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        Knowledge Library
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '650px' }}>
                        Manage your study materials. Our AI indexes your PDFs and identifies chapters,
                        topics, and key concepts to build your personalized learning path.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={fetchData} style={{ padding: '0.5rem 0.75rem' }} title="Refresh">
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    </button>
                    <button
                        className={`btn ${showUploadForm ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => {
                            setShowUploadForm(!showUploadForm);
                            setUploadError(null);
                            setUploadSuccess(null);
                        }}
                        style={{ height: '42px', padding: '0 1.5rem' }}
                    >
                        {showUploadForm ? <X size={18} /> : <Upload size={18} />}
                        {showUploadForm ? 'Close' : 'Upload Material'}
                    </button>
                </div>
            </div>

            {/* Upload Area */}
            <AnimatePresence>
                {showUploadForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden', marginBottom: '2.5rem' }}
                    >
                        <div style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '20px',
                            padding: '2rem',
                            boxShadow: '0 20px 40px -20px rgba(0,0,0,0.1)'
                        }}>
                            {uploadSuccess ? (
                                <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                                    <div style={{ width: '64px', height: '64px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                        <CheckCircle2 size={32} color="#10B981" />
                                    </div>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.5rem' }}>Document Indexed Successfully!</h3>
                                    <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>{uploadSuccess.message}</p>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                                        <div className="badge badge-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
                                            Subject: <strong>{uploadSuccess.subject}</strong>
                                        </div>
                                        <div className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
                                            {uploadSuccess.chunks} Knowledge Chunks
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.75rem' }}>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setUploadSuccess(null);
                                                setSelectedFile(null);
                                            }}
                                        >
                                            Upload Another Document
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => navigate('/app/theory', { state: { subject: uploadSuccess.subject } })}
                                        >
                                            <Sparkles size={16} /> Study This Subject Now
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                Subject Category <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(Optional - AI will auto-detect)</span>
                                            </label>
                                            <input
                                                className="form-input"
                                                placeholder="e.g. Java Programming, Database Systems..."
                                                value={subjectName}
                                                onChange={(e) => setSubjectName(e.target.value)}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '12px', display: 'flex', gap: '0.75rem' }}>
                                            <Sparkles size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-primary)', lineHeight: '1.4' }}>
                                                <strong>AI Neural Ingestion:</strong> Our engine will extract text, segment units, build vector embeddings, and generate a curriculum automatically.
                                            </p>
                                        </div>

                                        {uploadError && (
                                            <div style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                borderRadius: '12px',
                                                padding: '0.85rem 1rem',
                                                color: '#ef4444',
                                                fontSize: '0.875rem',
                                                fontWeight: '600'
                                            }}>
                                                ⚠️ {uploadError}
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        onDragOver={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => {
                                            if (!selectedFile && !loading && fileInputRef.current) {
                                                fileInputRef.current.click();
                                            }
                                        }}
                                        style={{
                                            border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border)'}`,
                                            borderRadius: '16px',
                                            padding: '2.5rem',
                                            textAlign: 'center',
                                            cursor: selectedFile || loading ? 'default' : 'pointer',
                                            background: dragActive ? 'rgba(99, 102, 241, 0.05)' : 'rgba(0,0,0,0.02)',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.txt,.md"
                                            style={{ display: 'none' }}
                                            onChange={handleFileSelect}
                                        />
                                        {selectedFile ? (
                                            <div
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ width: '100%' }}
                                            >
                                                <FileText size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                                                <div style={{ fontWeight: '700', fontSize: '1rem', wordBreak: 'break-word' }}>{selectedFile.name}</div>
                                                <div style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '0.25rem' }}>
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </div>
                                                
                                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', width: '100%' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        style={{ flex: 1, height: '42px' }}
                                                        disabled={loading}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedFile(null);
                                                            setUploadError(null);
                                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                                        }}
                                                    >
                                                        Change File
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary"
                                                        style={{ flex: 2, height: '42px' }}
                                                        disabled={loading}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                    >
                                                        {loading ? (
                                                            <>
                                                                <RefreshCw size={16} className="spin" />
                                                                Processing & Indexing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Sparkles size={16} />
                                                                Start Indexing
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                                                <div style={{ fontWeight: '600', fontSize: '1rem' }}>Drop your PDF or Notes here</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Click to browse files (PDF, TXT, MD up to 25MB)</div>
                                            </>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Knowledge Base Content */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Your Managed Subjects</h2>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        className="form-input"
                        placeholder="Search subjects or topics..."
                        style={{ paddingLeft: '2.5rem' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {subjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
                    <Database size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                    <h3>No Data Indexed Yet</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Upload your course PDF or syllabus to start learning with AI.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {subjects
                        .filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(subject => (
                            <div key={subject} style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                transition: 'all 0.3s'
                            }}>
                                {/* Subject Header Card */}
                                <div
                                    onClick={() => toggleSubject(subject)}
                                    style={{
                                        padding: '1.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        background: expandedSubject === subject ? 'rgba(99, 102, 241, 0.03)' : 'transparent'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                        <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, var(--primary), #818cf8)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800' }}>
                                            <BookOpen size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>{subject}</h3>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><File size={14} /> {allDocuments.filter(d => d.subject === subject).length} Documents</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Layers size={14} /> {subjectCurriculum[subject]?.length || '?'} Topics Detected</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); navigate('/app/theory', { state: { subject } }) }}>
                                            Study Now <Target size={16} />
                                        </button>
                                        {expandedSubject === subject ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                {/* Expanded View: Documents & Topics */}
                                <AnimatePresence>
                                    {expandedSubject === subject && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{ borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)' }}
                                        >
                                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '0' }}>
                                                {/* Files Column */}
                                                <div style={{ padding: '1.5rem', borderRight: '1px solid var(--border)' }}>
                                                    <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Source Documents</h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                        {allDocuments.filter(d => d.subject === subject).map((doc, idx) => (
                                                            <div
                                                                key={idx}
                                                                onClick={() => selectDocument(subject, doc.filename)}
                                                                style={{
                                                                    padding: '0.85rem',
                                                                    background: selectedDocumentBySubject[subject] === doc.filename ? 'var(--primary-light)' : 'white',
                                                                    border: selectedDocumentBySubject[subject] === doc.filename ? '1px solid var(--primary)' : '1px solid var(--border)',
                                                                    borderRadius: '10px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '80%' }}>
                                                                    <div style={{ color: 'var(--primary)', flexShrink: 0 }}><FileText size={20} /></div>
                                                                    <div style={{
                                                                        fontSize: '0.9rem',
                                                                        fontWeight: '600',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                        color: selectedDocumentBySubject[subject] === doc.filename ? 'var(--primary)' : 'inherit'
                                                                    }}>{doc.filename}</div>
                                                                </div>
                                                                {selectedDocumentBySubject[subject] === doc.filename ? (
                                                                    <CheckCircle2 size={16} color="var(--primary)" />
                                                                ) : (
                                                                    <button title="View Document" style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                                        <ExternalLink size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Topics Column */}
                                                <div style={{ padding: '1.5rem' }}>
                                                    <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Identified Curriculum / Chapters</h4>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                        {subjectCurriculum[subject] ? (
                                                            subjectCurriculum[subject].map((topic, idx) => (
                                                                <div key={idx} style={{
                                                                    padding: '0.75rem 1rem',
                                                                    background: 'rgba(99, 102, 241, 0.05)',
                                                                    borderRadius: '10px',
                                                                    fontSize: '0.875rem',
                                                                    color: 'var(--text-primary)',
                                                                    borderLeft: '4px solid var(--primary)',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem',
                                                                    transition: 'all 0.2s ease',
                                                                }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                                                                        <div style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%', flexShrink: 0 }}></div>
                                                                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic.name}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                                                                        <button
                                                                            onClick={() => navigate('/app/theory', { state: { subject, topic } })}
                                                                            title="Learn with AI Tutor"
                                                                            style={{
                                                                                padding: '0.25rem 0.6rem',
                                                                                fontSize: '0.75rem',
                                                                                borderRadius: '6px',
                                                                                border: 'none',
                                                                                background: 'var(--primary)',
                                                                                color: 'white',
                                                                                cursor: 'pointer',
                                                                                fontWeight: 600,
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '0.25rem'
                                                                            }}
                                                                        >
                                                                            <Sparkles size={12} /> Learn
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1rem', opacity: 0.5 }}>
                                                                Analyzing chapters...
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                </div>
            )}

            {/* Metrics Bar */}
            <div style={{
                position: 'fixed',
                bottom: '2rem',
                left: '20rem',
                right: '2rem',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '1rem 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--text-primary)',
                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(79, 70, 229, 0.05)',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', background: 'var(--primary-light)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Layers size={18} color="var(--primary)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Knowledge Chunks</div>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{systemStats.vector_store.total_chunks}</div>
                        </div>
                    </div>
                    <div style={{ width: '1px', height: '30px', background: 'var(--border)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Target size={18} color="#10b981" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Subjects Indexed</div>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{subjects.length}</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }}></div>
                    AI Ingestion Engine: <span style={{ fontWeight: '700', color: '#10b981' }}>OPTIMAL</span>
                </div>
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

export default Syllabus;
