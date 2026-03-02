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
    import pdfplumber
except ImportError:
    pdfplumber = None


class DocumentType(str, Enum):
    """Auto-detected document types"""
    SYLLABUS = "syllabus"
    NOTES = "notes"
    LAB_MANUAL = "lab"
    EXAM = "exam"
    OUTCOMES = "outcomes"
    JOB_DESCRIPTION = "jd"
    TEXTBOOK = "textbook"
    RESEARCH_PAPER = "research"
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
    Advanced document ingestion pipeline.
    High reliability parsing for academic and professional documents.
    """
    
    # Document type detection patterns (Regex for more reliability)
    DOC_TYPE_PATTERNS = {
        DocumentType.SYLLABUS: [r'syllabus', r'course outline', r'course structure', r'grading policy', r'learning objectives'],
        DocumentType.LAB_MANUAL: [r'experiment \d+', r'laboratory manual', r'apparatus', r'procedure', r'observation'],
        DocumentType.EXAM: [r'max marks', r'time allowed', r'question \d+', r'answer all', r'final exam'],
        DocumentType.NOTES: [r'lecture \d+', r'module \d+', r'unit \d+', r'introduction to', r'chapter \d+'],
    }
    
    def __init__(self, chunk_size: int = 1500, chunk_overlap: int = 200):
        """
        Initialize ingestion pipeline.
        
        Args:
            chunk_size: Target size for each chunk (in characters for better precision)
            chunk_overlap: Overlap between consecutive chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def process_pdf(self, file_path: str, user_subject_hint: Optional[str] = None, original_filename: Optional[str] = None) -> ProcessedDocument:
        """Process a PDF with high reliability."""
        import time
        start_time = time.time()
        
        # 1. Extraction with pdfplumber (best for layout preservation)
        pages_text = self._extract_pdf_text(file_path)
        full_text = "\n\n".join(pages_text)
        
        if not full_text.strip():
            # Fallback to PyPDF2 if pdfplumber fails or extract as image (not implemented)
            full_text = "Empty document or error extracting text."
        
        # 2. Metadata Inference
        doc_type = self._detect_document_type(full_text)
        display_name = original_filename or os.path.basename(file_path)
        subject = user_subject_hint or self._infer_subject(full_text, display_name)
        
        # 3. Recursive Semantic Chunking
        chunks = self._recursive_character_chunking(pages_text, display_name, doc_type, subject)
        
        # 4. Final Processing
        doc_id = self._generate_doc_id(file_path, full_text)
        processing_time = time.time() - start_time
        
        return ProcessedDocument(
            doc_id=doc_id,
            filename=display_name,
            doc_type=doc_type,
            subject=subject,
            total_chunks=len(chunks),
            total_pages=len(pages_text),
            chunks=chunks,
            processing_time=processing_time,
            timestamp=datetime.utcnow().isoformat()
        )

    def process_text(self, text: str, filename: str, user_subject_hint: Optional[str] = None) -> ProcessedDocument:
        """Process raw text with same semantic quality."""
        import time
        start_time = time.time()
        
        doc_type = self._detect_document_type(text)
        subject = user_subject_hint or self._infer_subject(text, filename)
        
        # Text is treated as one large page for recursive chunking
        chunks = self._recursive_character_chunking([text], filename, doc_type, subject)
        
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
        """Extract high-quality text using pdfplumber."""
        pages_text = []
        if pdfplumber:
            try:
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        text = page.extract_text()
                        if text:
                            pages_text.append(self._clean_text(text))
            except Exception as e:
                print(f"pdfplumber error: {e}")
        
        # Fallback to PyPDF2 if pdfplumber not available or failed
        if not pages_text:
            try:
                from PyPDF2 import PdfReader
                reader = PdfReader(file_path)
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        pages_text.append(self._clean_text(text))
            except Exception as e:
                print(f"PyPDF2 error: {e}")
                
        return pages_text

    def _clean_text(self, text: str) -> str:
        """Clean text while PRESERVING technical notation."""
        # Fix multi-line word breaks (e.g., hyper-
        # tension)
        text = re.sub(r'(\w+)-\n(\w+)', r'\1\2', text)
        # Normalize whitespace but keep paragraph breaks
        text = re.sub(r'[ \t]+', ' ', text)
        # Keep math symbols, code symbols, and academic notation
        # We only remove non-printable control characters
        text = "".join(ch for ch in text if ch.isprintable() or ch in ['\n', '\t'])
        return text.strip()

    def _recursive_character_chunking(
        self, 
        pages_text: List[str], 
        filename: str, 
        doc_type: DocumentType, 
        subject: str
    ) -> List[DocumentChunk]:
        """
        Splits text recursively by preferred separators to keep context together.
        Order: Page -> Double Newline -> Single Newline -> Sentence -> Character.
        """
        chunks = []
        chunk_idx = 0
        
        # Group pages into a single stream to avoid breaking paragraphs across pages
        full_text = "\n\n".join(pages_text)
        
        separators = ["\n\n", "\n", ". ", " ", ""]
        
        def split_text(text: str, seps: List[str]) -> List[str]:
            if len(text) <= self.chunk_size:
                return [text]
            
            if not seps:
                return [text[i:i+self.chunk_size] for i in range(0, len(text), self.chunk_size)]
            
            sep = seps[0]
            parts = text.split(sep)
            
            final_parts = []
            current_part = ""
            
            for p in parts:
                if len(current_part) + len(p) + len(sep) <= self.chunk_size:
                    current_part += (sep if current_part else "") + p
                else:
                    if current_part:
                        final_parts.append(current_part)
                    
                    # If this part itself is too large, recurse
                    if len(p) > self.chunk_size:
                        final_parts.extend(split_text(p, seps[1:]))
                        current_part = ""
                    else:
                        current_part = p
            
            if current_part:
                final_parts.append(current_part)
            
            return final_parts

        raw_chunks = split_text(full_text, separators)
        
        # Add overlap and metadata
        for i, text in enumerate(raw_chunks):
            # Overlap handling (simplified: add prefix of next chunk)
            if i < len(raw_chunks) - 1:
                overlap_text = raw_chunks[i+1][:self.chunk_overlap]
                text = text + " [Context: " + overlap_text + "]"
            
            # Map back to approximate page number
            page_num = 1
            cumulative_len = 0
            for p_idx, p_text in enumerate(pages_text, 1):
                cumulative_len += len(p_text)
                if cumulative_len >= full_text.find(text[:50]):
                    page_num = p_idx
                    break

            chunks.append(self._create_chunk(text, filename, doc_type, subject, page_num, i))
            
        return chunks

    def _detect_document_type(self, text: str) -> DocumentType:
        """Enhanced regex-based document type detection."""
        text_lower = text.lower()
        for doc_type, patterns in self.DOC_TYPE_PATTERNS.items():
            for p in patterns:
                if re.search(p, text_lower):
                    return doc_type
        return DocumentType.UNKNOWN

    def _infer_subject(self, text: str, filename: str) -> str:
        """Improved subject mapping with broader academic matching."""
        name = os.path.basename(filename).lower()
        
        # Priority mapping for specific subject keywords
        # Use longer keys first to avoid partial matches
        mappings = {
            'data structure': 'Data Structures',
            'operating system': 'Operating Systems',
            'networking': 'Computer Networks',
            'artificial intelligence': 'Artificial Intelligence',
            'machine learning': 'Machine Learning',
            'software engineering': 'Software Engineering',
            'database': 'Database Systems',
            'programming': 'Programming',
            'mathematics': 'Mathematics',
            'physics': 'Physics',
            'chemistry': 'Chemistry',
            'biology': 'Biology',
            'history': 'History',
            'geography': 'Geography',
            'economics': 'Economics'
        }
        
        # 1. Match against known keywords in filename
        for key, full in mappings.items():
            if key in name: return full
            
        # 2. Heuristic: Look for "Subject: ..." or "Course: ..." in first few lines
        lines = text.split('\n')[:50]
        for line in lines:
            line_clean = line.lower().strip()
            if line_clean.startswith(('subject:', 'course:', 'unit:')):
                subject_val = line_clean.split(':', 1)[1].strip().title()
                if 2 < len(subject_val) < 40:
                    return subject_val
        
        # 3. Clean filename (remove extension and common symbols)
        # Avoid generic "Computer Science" unless it's explicitly in the name
        if 'computer science' in name or 'cs' in name.split():
            return 'Computer Science'
            
        clean_name = re.sub(r'[^a-zA-Z0-9 ]', ' ', os.path.splitext(name)[0]).strip().title()
        return clean_name or "General"

    def _create_chunk(self, content: str, filename: str, doc_type: DocumentType, subject: str, page_num: int, idx: int) -> DocumentChunk:
        """Create final chunk dataclass."""
        chunk_id = f"{hashlib.md5(content[:100].encode()).hexdigest()[:8]}_{idx}"
        return DocumentChunk(
            chunk_id=chunk_id,
            content=content,
            subject=subject,
            doc_type=doc_type,
            topic=self._extract_topic(content),
            difficulty=Difficulty.INTERMEDIATE,
            source_file=filename,
            page_number=page_num,
            chunk_index=idx,
            timestamp=datetime.utcnow().isoformat(),
            word_count=len(content.split())
        )

    def _extract_topic(self, text: str) -> str:
        """Extract the most likely heading for this chunk with improved heuristics."""
        lines = text.split('\n')
        
        # Pattern 1: Explicit Unit/Chapter markers
        for line in lines[:5]:  # Check first few lines
            line = line.strip()
            if re.match(r'^(Unit|Module|Chapter|Section|PART)\s+[A-Z0-9]+[:\.-]?\s+', line, re.I):
                return line
                
        # Pattern 2: Numbered headings (e.g., 1.1 Introduction)
        for line in lines:
            line = line.strip()
            if re.match(r'^\d+(\.\d+)*\s+[A-Z]', line):
                if 5 < len(line) < 65:
                    return line
                    
        # Pattern 3: Short, Title Case or Uppercase lines
        for line in lines:
            line = line.strip()
            if 3 < len(line) < 50 and (line.isupper() or line.istitle()):
                # Exclude common noise
                if not any(word in line.upper() for word in ['PAGE', 'CONTINUED', 'NOTE:', 'FIGURE']):
                    return line
                    
        return "General Concept"

    def _generate_doc_id(self, filename: str, content: str) -> str:
        h = hashlib.md5((filename + content[:200]).encode()).hexdigest()[:12]
        return f"doc_{h}"


# Singleton
ingestion_pipeline = DocumentIngestionPipeline()
