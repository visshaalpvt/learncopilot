import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, BookOpen, Code, FileText, ChevronDown,
    ChevronUp, File, X, Sparkles, CheckCircle2,
    AlertCircle, Search, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Syllabus() {
    const [documents, setDocuments] = useState([]);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [subjectName, setSubjectName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/rag/subjects');
            // For now, we'll fetch subjects and maybe later list specific docs
            setDocuments(response.data.subjects || []);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
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
            const validTypes = ['.pdf', '.txt', '.md'];
            const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            if (validTypes.includes(ext)) {
                setSelectedFile(file);
            } else {
                alert('Please upload a PDF, TXT or MD file');
            }
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            alert('Please select a file to upload');
            return;
        }

        setLoading(true);
        setUploadSuccess(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            if (subjectName) {
                formData.append('subject_hint', subjectName);
            }

            const response = await api.post('/rag/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setUploadSuccess({
                    message: response.data.message,
                    subject: response.data.subject,
                    chunks: response.data.chunks_created
                });
                setSubjectName('');
                setSelectedFile(null);
                fetchDocuments();

                // Close form after a delay
                setTimeout(() => {
                    setShowUploadForm(false);
                    setUploadSuccess(null);
                }, 3000);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(error.response?.data?.detail || 'Failed to upload document');
        } finally {
            setLoading(false);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fade-in">
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
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem'
                    }}>
                        Knowledge Base
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', maxWidth: '600px' }}>
                        Upload your syllabus, lecture notes, or textbooks. Our AI automatically indexes
                        everything to provide personalized guidance and answers.
                    </p>
                </div>
                <button
                    className={`btn ${showUploadForm ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    style={{ transition: 'all 0.2s ease' }}
                >
                    {showUploadForm ? <X size={18} /> : <Upload size={18} />}
                    {showUploadForm ? 'Close' : 'Add Document'}
                </button>
            </div>

            <AnimatePresence>
                {showUploadForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '2rem',
                            marginBottom: '2.5rem',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
                        }}
                    >
                        {uploadSuccess ? (
                            <div style={{ textAlign: 'center', padding: '1rem' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    background: '#ECFDF5',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.25rem'
                                }}>
                                    <CheckCircle2 size={32} color="#10B981" />
                                </div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                    Document Processed Successfully!
                                </h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    {uploadSuccess.message}
                                </p>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'var(--bg-secondary)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem'
                                }}>
                                    <BookOpen size={14} /> {uploadSuccess.subject} • {uploadSuccess.chunks} Knowledge Chunks
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                                    <div>
                                        <div className="form-group">
                                            <label className="form-label">Subject Label (Optional)</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g., Computer Science, Engineering"
                                                value={subjectName}
                                                onChange={(e) => setSubjectName(e.target.value)}
                                            />
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                                If left blank, our AI will automatically detect the subject.
                                            </p>
                                        </div>

                                        <div style={{ marginTop: '2rem' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '0.75rem',
                                                padding: '1rem',
                                                background: 'var(--primary-light)',
                                                borderRadius: '10px',
                                                border: '1px solid #C7D2FE'
                                            }}>
                                                <Sparkles size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                                    <strong>AI Note:</strong> Our RAG pipeline will extract core concepts,
                                                    labs, and exam patterns from your file to update your learning path.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => !loading && fileInputRef.current?.click()}
                                        style={{
                                            border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border)'}`,
                                            borderRadius: '12px',
                                            padding: '2.5rem',
                                            textAlign: 'center',
                                            cursor: loading ? 'wait' : 'pointer',
                                            background: dragActive ? 'var(--primary-light)' : 'var(--bg-secondary)',
                                            transition: 'all 0.2s ease',
                                            minHeight: '220px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.txt,.md"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                            disabled={loading}
                                        />

                                        {selectedFile ? (
                                            <div style={{ width: '100%' }}>
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    background: 'var(--bg-primary)',
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    margin: '0 auto 1rem',
                                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                                                }}>
                                                    <FileText size={24} style={{ color: 'var(--primary)' }} />
                                                </div>
                                                <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                                    {selectedFile.name}
                                                </p>
                                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                                {!loading && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFile();
                                                        }}
                                                        style={{
                                                            marginTop: '1rem',
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#EF4444',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: '500',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem',
                                                            margin: '1rem auto 0'
                                                        }}
                                                    >
                                                        <X size={14} /> Remove File
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{
                                                    width: '56px',
                                                    height: '56px',
                                                    borderRadius: '50%',
                                                    background: 'var(--bg-primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginBottom: '1rem',
                                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                                                }}>
                                                    <Upload size={24} style={{ color: 'var(--text-muted)' }} />
                                                </div>
                                                <p style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                                                    Click or drag and drop to upload
                                                </p>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                                                    PDF, Text, or Markdown (Max 10MB)
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: '2rem',
                                    paddingTop: '1.5rem',
                                    borderTop: '1px solid var(--border)',
                                    display: 'flex',
                                    justifyContent: 'flex-end'
                                }}>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading || !selectedFile}
                                        style={{ minWidth: '160px' }}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="spinner" style={{ width: '16px', height: '16px' }} />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={18} />
                                                Upload Document
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Document Library Sections */}
            <div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem'
                }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Indexed Subjects
                    </h2>

                    <div style={{ position: 'relative' }}>
                        <Search
                            size={16}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search subjects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '0.5rem 1rem 0.5rem 2.25rem',
                                fontSize: '0.875rem',
                                width: '240px',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                        />
                    </div>
                </div>

                {documents.length === 0 ? (
                    <div style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '4rem 2rem',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem'
                        }}>
                            <FileText size={32} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            Your Knowledge Base is Empty
                        </h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
                            Upload documents to build your personalized AI tutor.
                            Supported types include Course Syllabus, Lecture Notes, and Assignment Handouts.
                        </p>
                        <button className="btn btn-primary" onClick={() => setShowUploadForm(true)}>
                            <Upload size={18} />
                            Upload First Document
                        </button>
                    </div>
                ) : (
                    <div className="dashboard-grid">
                        {documents
                            .filter(sub => sub.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((subject, index) => (
                                <motion.div
                                    key={subject}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    style={{
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '16px',
                                        padding: '1.5rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    whileHover={{
                                        y: -4,
                                        borderColor: 'var(--primary)',
                                        boxShadow: '0 12px 20px -8px rgba(0,0,0,0.08)'
                                    }}
                                    onClick={() => navigate('/app/theory', { state: { subject } })}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '1.25rem'
                                    }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            background: 'var(--primary-light)',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <BookOpen size={20} style={{ color: 'var(--primary)' }} />
                                        </div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: 'var(--primary)',
                                            background: 'var(--primary-light)',
                                            padding: '0.25rem 0.625rem',
                                            borderRadius: '20px'
                                        }}>
                                            Active
                                        </div>
                                    </div>
                                    <h3 style={{ fontSize: '1.0625rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                                        {subject}
                                    </h3>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                                        AI-indexed learning material
                                    </p>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        paddingTop: '1.25rem',
                                        borderTop: '1px solid var(--border)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            <FileText size={14} /> Knowledge Indexed
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                    </div>
                )}
            </div>

            {/* Info Footer */}
            {!showUploadForm && documents.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{
                        marginTop: '4rem',
                        padding: '2rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '2rem',
                        border: '1px solid var(--border)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            background: 'white',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                            flexShrink: 0
                        }}>
                            <Sparkles size={24} color="var(--primary)" />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                Subject-Agnostic Learning
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '500px' }}>
                                Our RAG system doesn't care about the subject. From Quantum Physics to
                                Modern History, it understands and organizes content based on your materials.
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>384</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Embeddings</div>
                        </div>
                        <div style={{ width: '1px', height: '40px', background: 'var(--border)' }} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>100%</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grounded</div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default Syllabus;
