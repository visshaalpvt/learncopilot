"""
==============================================================================
LEARNCOPILOT - AUTOMATED RAG SYSTEM
Vector Store with Metadata-Driven Retrieval
==============================================================================

This module handles:
- Embedding generation
- Vector storage
- Metadata-filtered retrieval
- Subject-agnostic indexing

Author: LearnCopilot Team
==============================================================================
"""

import os
import json
import hashlib
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import numpy as np

from .document_ingestion import DocumentChunk, DocumentType, Difficulty


@dataclass
class RetrievalResult:
    """Result from vector retrieval"""
    chunk: DocumentChunk
    score: float
    rank: int


class SimpleEmbedding:
    """
    Simple TF-IDF based embedding for demo/development.
    In production, replace with sentence-transformers or OpenAI embeddings.
    """
    
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.vocab = {}
        self.idf = {}
        self.is_fitted = False
    
    def fit(self, documents: List[str]):
        """Build vocabulary from documents."""
        # Build vocabulary
        word_doc_count = {}
        for doc in documents:
            words = set(doc.lower().split())
            for word in words:
                word_doc_count[word] = word_doc_count.get(word, 0) + 1
        
        # Calculate IDF
        num_docs = len(documents)
        self.idf = {
            word: np.log(num_docs / (count + 1))
            for word, count in word_doc_count.items()
        }
        
        # Build vocab (top words by IDF)
        sorted_words = sorted(self.idf.items(), key=lambda x: -x[1])
        self.vocab = {word: idx for idx, (word, _) in enumerate(sorted_words[:self.dimension])}
        self.is_fitted = True
    
    def embed(self, text: str) -> np.ndarray:
        """Generate embedding for text."""
        if not self.is_fitted:
            # Simple fallback if not fitted
            return self._hash_embed(text)
        
        vector = np.zeros(self.dimension)
        words = text.lower().split()
        word_count = {}
        for word in words:
            word_count[word] = word_count.get(word, 0) + 1
        
        for word, count in word_count.items():
            if word in self.vocab:
                idx = self.vocab[word]
                tf = count / len(words)
                idf = self.idf.get(word, 0)
                vector[idx] = tf * idf
        
        # Normalize
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        
        return vector
    
    def _hash_embed(self, text: str) -> np.ndarray:
        """Fallback hash-based embedding."""
        vector = np.zeros(self.dimension)
        for i, word in enumerate(text.lower().split()):
            h = int(hashlib.md5(word.encode()).hexdigest(), 16)
            idx = h % self.dimension
            vector[idx] += 1
        
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector


class VectorStore:
    """
    In-memory vector store with metadata filtering.
    
    Features:
    - Automatic embedding generation
    - Metadata-driven filtering
    - Subject isolation
    - Document type routing
    """
    
    def __init__(self, embedding_dimension: int = 384):
        self.dimension = embedding_dimension
        self.embedder = SimpleEmbedding(dimension=embedding_dimension)
        
        # Storage
        self.chunks: Dict[str, DocumentChunk] = {}
        self.embeddings: Dict[str, np.ndarray] = {}
        
        # Indexes for fast filtering
        self.by_subject: Dict[str, List[str]] = {}
        self.by_doc_type: Dict[str, List[str]] = {}
        self.by_topic: Dict[str, List[str]] = {}
        
        # Metrics
        self.total_retrievals = 0
        self.avg_latency = 0
    
    def add_chunks(self, chunks: List[DocumentChunk]):
        """
        Add document chunks to the vector store.
        Automatically generates embeddings and indexes metadata.
        """
        # Fit embedder on new content if we have enough documents
        if len(chunks) > 10:
            texts = [c.content for c in chunks]
            self.embedder.fit(texts)
        
        for chunk in chunks:
            chunk_id = chunk.chunk_id
            
            # Store chunk
            self.chunks[chunk_id] = chunk
            
            # Generate and store embedding
            embedding = self.embedder.embed(chunk.content)
            self.embeddings[chunk_id] = embedding
            
            # Update indexes
            subject = chunk.subject.lower()
            if subject not in self.by_subject:
                self.by_subject[subject] = []
            self.by_subject[subject].append(chunk_id)
            
            doc_type = chunk.doc_type.value if isinstance(chunk.doc_type, DocumentType) else chunk.doc_type
            if doc_type not in self.by_doc_type:
                self.by_doc_type[doc_type] = []
            self.by_doc_type[doc_type].append(chunk_id)
            
            topic = chunk.topic.lower()
            if topic not in self.by_topic:
                self.by_topic[topic] = []
            self.by_topic[topic].append(chunk_id)
    
    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        subject_filter: Optional[str] = None,
        doc_type_filter: Optional[DocumentType] = None,
        difficulty_filter: Optional[Difficulty] = None,
        min_score: float = 0.0
    ) -> List[RetrievalResult]:
        """
        Retrieve relevant chunks based on query with optional filters.
        
        Args:
            query: User query
            top_k: Number of results to return
            subject_filter: Filter by subject
            doc_type_filter: Filter by document type
            difficulty_filter: Filter by difficulty level
            min_score: Minimum similarity score
            
        Returns:
            List of RetrievalResult sorted by relevance
        """
        import time
        start_time = time.time()
        
        # Generate query embedding
        query_embedding = self.embedder.embed(query)
        
        # Get candidate chunk IDs based on filters
        candidates = self._get_filtered_candidates(
            subject_filter, doc_type_filter, difficulty_filter
        )
        
        # Calculate similarities
        results = []
        for chunk_id in candidates:
            if chunk_id not in self.embeddings:
                continue
            
            chunk_embedding = self.embeddings[chunk_id]
            score = self._cosine_similarity(query_embedding, chunk_embedding)
            
            if score >= min_score:
                results.append((chunk_id, score))
        
        # Sort by score
        results.sort(key=lambda x: -x[1])
        
        # Build result objects
        retrieval_results = []
        for rank, (chunk_id, score) in enumerate(results[:top_k], 1):
            retrieval_results.append(RetrievalResult(
                chunk=self.chunks[chunk_id],
                score=float(score),
                rank=rank
            ))
        
        # Update metrics
        latency = time.time() - start_time
        self.total_retrievals += 1
        self.avg_latency = (self.avg_latency * (self.total_retrievals - 1) + latency) / self.total_retrievals
        
        return retrieval_results
    
    def _get_filtered_candidates(
        self,
        subject_filter: Optional[str],
        doc_type_filter: Optional[DocumentType],
        difficulty_filter: Optional[Difficulty]
    ) -> List[str]:
        """Get chunk IDs matching all filters."""
        # Start with all chunks
        candidates = set(self.chunks.keys())
        
        # Apply subject filter
        if subject_filter:
            subject_key = subject_filter.lower()
            subject_chunks = set(self.by_subject.get(subject_key, []))
            candidates = candidates.intersection(subject_chunks)
        
        # Apply document type filter
        if doc_type_filter:
            doc_type_key = doc_type_filter.value if isinstance(doc_type_filter, DocumentType) else doc_type_filter
            type_chunks = set(self.by_doc_type.get(doc_type_key, []))
            candidates = candidates.intersection(type_chunks)
        
        # Apply difficulty filter
        if difficulty_filter:
            diff_chunks = set()
            for chunk_id, chunk in self.chunks.items():
                chunk_diff = chunk.difficulty.value if isinstance(chunk.difficulty, Difficulty) else chunk.difficulty
                filter_diff = difficulty_filter.value if isinstance(difficulty_filter, Difficulty) else difficulty_filter
                if chunk_diff == filter_diff:
                    diff_chunks.add(chunk_id)
            candidates = candidates.intersection(diff_chunks)
        
        return list(candidates)
    
    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors."""
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        return dot_product / (norm_a * norm_b)
    
    def get_stats(self) -> Dict:
        """Get vector store statistics."""
        return {
            "total_chunks": len(self.chunks),
            "total_subjects": len(self.by_subject),
            "total_doc_types": len(self.by_doc_type),
            "subjects": list(self.by_subject.keys()),
            "doc_types": list(self.by_doc_type.keys()),
            "total_retrievals": self.total_retrievals,
            "avg_latency_ms": round(self.avg_latency * 1000, 2)
        }
    
    def clear(self):
        """Clear all stored data."""
        self.chunks.clear()
        self.embeddings.clear()
        self.by_subject.clear()
        self.by_doc_type.clear()
        self.by_topic.clear()


# Singleton instance
vector_store = VectorStore()
