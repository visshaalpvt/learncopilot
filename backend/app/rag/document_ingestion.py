"""
==============================================================================
LEARNCOPILOT - AUTOMATED RAG SYSTEM
Document Ingestion Pipeline
==============================================================================

This module handles automated document processing:
- PDF text extraction
- Document type detection
- Intelligent chunking
- Metadata generation

Author: LearnCopilot Team
==============================================================================
"""

import os
import re
import hashlib
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import json

# PDF Processing
try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None


class DocumentType(str, Enum):
    """Auto-detected document types"""
    SYLLABUS = "syllabus"
    NOTES = "notes"
    LAB_MANUAL = "lab"
    EXAM = "exam"
    OUTCOMES = "outcomes"
    JOB_DESCRIPTION = "jd"
    TEXTBOOK = "textbook"
    UNKNOWN = "unknown"


class Difficulty(str, Enum):
    """Content difficulty levels"""
    INTRO = "intro"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


@dataclass
class DocumentChunk:
    """Represents a processed document chunk with metadata"""
    chunk_id: str
    content: str
    subject: str
    doc_type: DocumentType
    topic: str
    difficulty: Difficulty
    source_file: str
    page_number: Optional[int]
    chunk_index: int
    timestamp: str
    word_count: int
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class ProcessedDocument:
    """Represents a fully processed document"""
    doc_id: str
    filename: str
    doc_type: DocumentType
    subject: str
    total_chunks: int
    total_pages: int
    chunks: List[DocumentChunk]
    processing_time: float
    timestamp: str


class DocumentIngestionPipeline:
    """
    Automated document ingestion pipeline.
    Handles any academic document without subject-specific configuration.
    """
    
    # Keywords for document type detection
    DOC_TYPE_KEYWORDS = {
        DocumentType.SYLLABUS: [
            'syllabus', 'course outline', 'course structure', 
            'learning objectives', 'course schedule', 'grading scheme',
            'prerequisites', 'course description'
        ],
        DocumentType.NOTES: [
            'lecture', 'notes', 'chapter', 'unit', 'module',
            'introduction to', 'overview of', 'concepts'
        ],
        DocumentType.LAB_MANUAL: [
            'lab', 'laboratory', 'experiment', 'practical',
            'procedure', 'apparatus', 'observation', 'aim'
        ],
        DocumentType.EXAM: [
            'exam', 'examination', 'question paper', 'test',
            'marks', 'answer', 'time:', 'max marks'
        ],
        DocumentType.OUTCOMES: [
            'learning outcomes', 'course outcomes', 'program outcomes',
            'competencies', 'skills acquired', 'objectives'
        ],
        DocumentType.JOB_DESCRIPTION: [
            'job description', 'requirements', 'qualifications',
            'responsibilities', 'experience required', 'skills needed'
        ],
        DocumentType.TEXTBOOK: [
            'chapter', 'section', 'theorem', 'definition',
            'example', 'exercise', 'figure', 'table'
        ]
    }
    
    # Keywords for difficulty detection
    DIFFICULTY_KEYWORDS = {
        Difficulty.INTRO: [
            'introduction', 'basic', 'fundamental', 'overview',
            'beginner', 'simple', 'elementary', 'getting started'
        ],
        Difficulty.INTERMEDIATE: [
            'intermediate', 'moderate', 'application', 'implementation',
            'analysis', 'design', 'develop'
        ],
        Difficulty.ADVANCED: [
            'advanced', 'complex', 'optimization', 'research',
            'thesis', 'dissertation', 'novel', 'state-of-the-art'
        ]
    }
    
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 100):
        """
        Initialize ingestion pipeline.
        
        Args:
            chunk_size: Target size for each chunk (in words)
            chunk_overlap: Overlap between consecutive chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def process_pdf(self, file_path: str, user_subject_hint: Optional[str] = None) -> ProcessedDocument:
        """
        Process a PDF document through the ingestion pipeline.
        
        Args:
            file_path: Path to the PDF file
            user_subject_hint: Optional subject hint from user
            
        Returns:
            ProcessedDocument with all chunks and metadata
        """
        import time
        start_time = time.time()
        
        # Extract text from PDF
        pages_text = self._extract_pdf_text(file_path)
        full_text = "\n\n".join(pages_text)
        
        # Auto-detect document type
        doc_type = self._detect_document_type(full_text)
        
        # Auto-detect or use provided subject
        subject = user_subject_hint or self._infer_subject(full_text, file_path)
        
        # Generate chunks with semantic awareness
        chunks = self._create_semantic_chunks(pages_text, file_path, doc_type, subject)
        
        # Generate document ID
        doc_id = self._generate_doc_id(file_path, full_text)
        
        processing_time = time.time() - start_time
        
        return ProcessedDocument(
            doc_id=doc_id,
            filename=os.path.basename(file_path),
            doc_type=doc_type,
            subject=subject,
            total_chunks=len(chunks),
            total_pages=len(pages_text),
            chunks=chunks,
            processing_time=processing_time,
            timestamp=datetime.utcnow().isoformat()
        )
    
    def process_text(self, text: str, filename: str, user_subject_hint: Optional[str] = None) -> ProcessedDocument:
        """
        Process raw text through the ingestion pipeline.
        
        Args:
            text: Raw text content
            filename: Original filename
            user_subject_hint: Optional subject hint
            
        Returns:
            ProcessedDocument with all chunks and metadata
        """
        import time
        start_time = time.time()
        
        # Auto-detect document type
        doc_type = self._detect_document_type(text)
        
        # Auto-detect or use provided subject
        subject = user_subject_hint or self._infer_subject(text, filename)
        
        # Split into pages (use paragraphs as pseudo-pages)
        pages_text = [text]
        
        # Generate chunks
        chunks = self._create_semantic_chunks(pages_text, filename, doc_type, subject)
        
        # Generate document ID
        doc_id = self._generate_doc_id(filename, text)
        
        processing_time = time.time() - start_time
        
        return ProcessedDocument(
            doc_id=doc_id,
            filename=filename,
            doc_type=doc_type,
            subject=subject,
            total_chunks=len(chunks),
            total_pages=1,
            chunks=chunks,
            processing_time=processing_time,
            timestamp=datetime.utcnow().isoformat()
        )
    
    def _extract_pdf_text(self, file_path: str) -> List[str]:
        """Extract text from each page of a PDF."""
        if PdfReader is None:
            raise ImportError("PyPDF2 is required for PDF processing")
        
        pages_text = []
        reader = PdfReader(file_path)
        
        for page in reader.pages:
            text = page.extract_text() or ""
            # Clean the extracted text
            text = self._clean_text(text)
            if text.strip():
                pages_text.append(text)
        
        return pages_text
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters that might cause issues
        text = re.sub(r'[^\w\s.,;:!?()-]', '', text)
        # Normalize quotes
        text = text.replace('"', '"').replace('"', '"')
        text = text.replace(''', "'").replace(''', "'")
        return text.strip()
    
    def _detect_document_type(self, text: str) -> DocumentType:
        """Auto-detect document type based on content analysis."""
        text_lower = text.lower()
        
        # Count keyword matches for each document type
        scores = {}
        for doc_type, keywords in self.DOC_TYPE_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            scores[doc_type] = score
        
        # Return type with highest score
        if max(scores.values()) > 0:
            return max(scores, key=scores.get)
        return DocumentType.UNKNOWN
    
    def _detect_difficulty(self, text: str) -> Difficulty:
        """Auto-detect content difficulty level."""
        text_lower = text.lower()
        
        scores = {}
        for difficulty, keywords in self.DIFFICULTY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            scores[difficulty] = score
        
        if max(scores.values()) > 0:
            return max(scores, key=scores.get)
        return Difficulty.INTERMEDIATE  # Default
    
    def _infer_subject(self, text: str, filename: str) -> str:
        """
        Infer subject from document content and filename.
        Uses frequency analysis of domain-specific terms.
        """
        # Extract potential subject from filename
        filename_clean = os.path.splitext(os.path.basename(filename))[0]
        filename_clean = re.sub(r'[_-]', ' ', filename_clean)
        
        # Common academic domains for quick matching
        domains = [
            'computer science', 'computer networks', 'data structures',
            'algorithms', 'database', 'operating systems', 'machine learning',
            'artificial intelligence', 'physics', 'chemistry', 'biology',
            'mathematics', 'calculus', 'statistics', 'economics', 'management',
            'engineering', 'electronics', 'electrical', 'mechanical', 'civil',
            'medicine', 'anatomy', 'pharmacology', 'law', 'history', 'psychology'
        ]
        
        text_lower = text.lower()
        filename_lower = filename_clean.lower()
        
        # Check filename first
        for domain in domains:
            if domain in filename_lower:
                return domain.title()
        
        # Check document content
        for domain in domains:
            if domain in text_lower[:5000]:  # Check first 5000 chars
                return domain.title()
        
        # If no match, use filename as subject
        return filename_clean.title() if filename_clean else "General"
    
    def _infer_topic(self, chunk_text: str, subject: str) -> str:
        """Infer topic from chunk content."""
        # Look for section headers or topic indicators
        lines = chunk_text.split('\n')
        for line in lines[:3]:  # Check first 3 lines
            line = line.strip()
            if len(line) > 5 and len(line) < 100:
                # Likely a heading
                if line.isupper() or line.istitle():
                    return line[:50]
        
        # Fall back to first meaningful phrase
        words = chunk_text.split()[:10]
        return ' '.join(words)[:50] if words else subject
    
    def _create_semantic_chunks(
        self, 
        pages_text: List[str], 
        filename: str,
        doc_type: DocumentType,
        subject: str
    ) -> List[DocumentChunk]:
        """
        Create semantically-aware chunks from document pages.
        Uses structural cues (headings, paragraphs) for intelligent splitting.
        """
        chunks = []
        chunk_index = 0
        
        for page_num, page_text in enumerate(pages_text, 1):
            # Split by paragraphs first
            paragraphs = re.split(r'\n\n+', page_text)
            
            current_chunk = []
            current_word_count = 0
            
            for paragraph in paragraphs:
                words = paragraph.split()
                para_word_count = len(words)
                
                if current_word_count + para_word_count <= self.chunk_size:
                    current_chunk.append(paragraph)
                    current_word_count += para_word_count
                else:
                    # Save current chunk if not empty
                    if current_chunk:
                        chunk_text = '\n\n'.join(current_chunk)
                        chunk = self._create_chunk(
                            chunk_text, filename, doc_type, subject,
                            page_num, chunk_index
                        )
                        chunks.append(chunk)
                        chunk_index += 1
                    
                    # Handle large paragraphs
                    if para_word_count > self.chunk_size:
                        # Split large paragraph into smaller chunks
                        for i in range(0, len(words), self.chunk_size - self.chunk_overlap):
                            sub_words = words[i:i + self.chunk_size]
                            chunk_text = ' '.join(sub_words)
                            chunk = self._create_chunk(
                                chunk_text, filename, doc_type, subject,
                                page_num, chunk_index
                            )
                            chunks.append(chunk)
                            chunk_index += 1
                        current_chunk = []
                        current_word_count = 0
                    else:
                        current_chunk = [paragraph]
                        current_word_count = para_word_count
            
            # Don't forget the last chunk of the page
            if current_chunk:
                chunk_text = '\n\n'.join(current_chunk)
                chunk = self._create_chunk(
                    chunk_text, filename, doc_type, subject,
                    page_num, chunk_index
                )
                chunks.append(chunk)
                chunk_index += 1
        
        return chunks
    
    def _create_chunk(
        self,
        content: str,
        filename: str,
        doc_type: DocumentType,
        subject: str,
        page_num: int,
        chunk_index: int
    ) -> DocumentChunk:
        """Create a single document chunk with all metadata."""
        chunk_id = f"{hashlib.md5((filename + content[:100]).encode()).hexdigest()[:12]}_{chunk_index}"
        
        return DocumentChunk(
            chunk_id=chunk_id,
            content=content,
            subject=subject,
            doc_type=doc_type,
            topic=self._infer_topic(content, subject),
            difficulty=self._detect_difficulty(content),
            source_file=os.path.basename(filename),
            page_number=page_num,
            chunk_index=chunk_index,
            timestamp=datetime.utcnow().isoformat(),
            word_count=len(content.split())
        )
    
    def _generate_doc_id(self, filename: str, content: str) -> str:
        """Generate unique document ID."""
        content_hash = hashlib.sha256(content.encode()).hexdigest()[:16]
        return f"doc_{content_hash}"


# Singleton instance
ingestion_pipeline = DocumentIngestionPipeline()
