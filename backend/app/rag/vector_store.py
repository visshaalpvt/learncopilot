import os
import json
import hashlib
import time
import re
from typing import List, Dict, Optional, Tuple, Set
from dataclasses import dataclass
import numpy as np

from .document_ingestion import DocumentChunk, DocumentType, Difficulty


@dataclass
class RetrievalResult:
    """Result from vector retrieval"""
    chunk: DocumentChunk
    score: float
    rank: int


class HybridEmbedder:
    """
    Enhanced Hybrid Embedder using TF-IDF and Keyword Frequency.
    """
    
    def __init__(self, dimension: int = 512):
        self.dimension = dimension
        self.vocab: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.is_fitted = False
    
    def fit(self, chunks: List[DocumentChunk]):
        """Fit on provided chunks."""
        if not chunks: return
        
        texts = [c.content.lower() for c in chunks]
        word_doc_count = {}
        for text in texts:
            words = set(re.findall(r'\w+', text))
            for word in words:
                word_doc_count[word] = word_doc_count.get(word, 0) + 1
        
        num_docs = len(texts)
        self.idf = {
            word: np.log((num_docs + 1) / (count + 0.5))
            for word, count in word_doc_count.items()
        }
        
        # Select top features
        sorted_vocab = sorted(self.idf.items(), key=lambda x: -x[1])
        self.vocab = {word: idx for idx, (word, _) in enumerate(sorted_vocab[:self.dimension])}
        self.is_fitted = True

    def embed(self, text: str) -> np.ndarray:
        """Generate high-quality vector."""
        vector = np.zeros(self.dimension)
        words = re.findall(r'\w+', text.lower())
        if not words: return vector
        
        counts = {}
        for w in words: counts[w] = counts.get(w, 0) + 1
        
        for word, count in counts.items():
            if word in self.vocab:
                idx = self.vocab[word]
                tf = count / len(words)
                vector[idx] = tf * self.idf.get(word, 1.0)
        
        # Unit normalization
        norm = np.linalg.norm(vector)
        if norm > 0: vector = vector / norm
        return vector


class VectorStore:
    """
    Reliable Hybrid Vector Store with Persistence.
    Uses BM25-inspired keyword matching combined with Vector Similarity.
    """
    
    def __init__(self, storage_path: str = "vector_store.json"):
        self.storage_path = storage_path
        self.embedder = HybridEmbedder()
        
        # Storage
        self.chunks: Dict[str, DocumentChunk] = {}
        self.embeddings: Dict[str, np.ndarray] = {}
        
        # Indexes
        self.by_subject: Dict[str, List[str]] = {}
        
        # Metrics
        self.total_retrievals = 0
        
        # Load from disk if exists
        self.load()

    def add_chunks(self, chunks: List[DocumentChunk]):
        """Add chunks and persist to disk."""
        # Update embedder if needed
        all_chunks = list(self.chunks.values()) + chunks
        if len(all_chunks) > 5:
            self.embedder.fit(all_chunks)
            # Re-index existing if embedder changed significantly
            for cid, chunk in self.chunks.items():
                self.embeddings[cid] = self.embedder.embed(chunk.content)
        
        for chunk in chunks:
            self.chunks[chunk.chunk_id] = chunk
            self.embeddings[chunk.chunk_id] = self.embedder.embed(chunk.content)
            
            # Indexing (Title Case for readable display)
            subj_display = chunk.subject.strip().title()
            if subj_display not in self.by_subject: self.by_subject[subj_display] = []
            if chunk.chunk_id not in self.by_subject[subj_display]:
                self.by_subject[subj_display].append(chunk.chunk_id)
        
        self.save()

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        subject_filter: Optional[str] = None,
        doc_type_filter: Optional[DocumentType] = None,
        difficulty_filter: Optional[Difficulty] = None,
        min_score: float = 0.05,
        **kwargs
    ) -> List[RetrievalResult]:
        """Hybrid Retrieval: Vector Similarity + Keyword Match with Metadata Filtering."""
        self.total_retrievals += 1
        query_vec = self.embedder.embed(query)
        query_words = set(re.findall(r'\w+', query.lower()))
        
        # Filter candidates by subject
        candidates = list(self.chunks.keys())
        if subject_filter:
            target = subject_filter.strip().title()
            candidates = self.by_subject.get(target, [])
            if not candidates:
                for s, cids in self.by_subject.items():
                    if s.lower() == subject_filter.lower().strip():
                        candidates = cids
                        break
            # Fallback to all candidates if subject not found in index
            if not candidates:
                candidates = list(self.chunks.keys())

        # Filter by doc_type if specified
        if doc_type_filter:
            candidates = [
                cid for cid in candidates
                if self.chunks[cid].doc_type == doc_type_filter
            ] or candidates

        # Filter by difficulty if specified
        if difficulty_filter:
            candidates = [
                cid for cid in candidates
                if self.chunks[cid].difficulty == difficulty_filter
            ] or candidates
            
        results = []
        for cid in candidates:
            # 1. Vector Score
            vec_score = float(np.dot(query_vec, self.embeddings[cid])) if cid in self.embeddings else 0.0
            
            # 2. Keyword Boost
            chunk_words = set(re.findall(r'\w+', self.chunks[cid].content.lower()))
            common = query_words.intersection(chunk_words)
            keyword_score = len(common) / max(1, len(query_words))
            
            # Hybrid Score (Weighted)
            final_score = (vec_score * 0.7) + (keyword_score * 0.3)
            
            if final_score >= min_score:
                results.append((cid, final_score))
        
        results.sort(key=lambda x: -x[1])
        
        return [
            RetrievalResult(chunk=self.chunks[cid], score=float(s), rank=i+1)
            for i, (cid, s) in enumerate(results[:top_k])
        ]

    def save(self):
        """Persist to disk."""
        try:
            data = {
                "chunks": {cid: c.to_dict() for cid, c in self.chunks.items()},
                "vocab": self.embedder.vocab,
                "idf": self.embedder.idf
            }
            with open(self.storage_path, "w") as f:
                json.dump(data, f)
        except Exception as e:
            print(f"Save error: {e}")

    def load(self):
        """Load from disk."""
        if not os.path.exists(self.storage_path): return
        try:
            with open(self.storage_path, "r") as f:
                data = json.load(f)
            
            # Reconstruct chunks
            for cid, cdict in data["chunks"].items():
                # Correctly handle Enum types that were saved as strings
                if "doc_type" in cdict and isinstance(cdict["doc_type"], str):
                    try:
                        cdict["doc_type"] = DocumentType(cdict["doc_type"])
                    except ValueError:
                        cdict["doc_type"] = DocumentType.UNKNOWN
                
                if "difficulty" in cdict and isinstance(cdict["difficulty"], str):
                    try:
                        cdict["difficulty"] = Difficulty(cdict["difficulty"])
                    except ValueError:
                        cdict["difficulty"] = Difficulty.INTERMEDIATE
                        
                self.chunks[cid] = DocumentChunk(**cdict)
            
            # Reconstruct embedder
            self.embedder.vocab = data.get("vocab", {})
            self.embedder.idf = data.get("idf", {})
            self.embedder.is_fitted = True
            
            # Re-generate embeddings (don't store raw numpy in JSON)
            for cid, chunk in self.chunks.items():
                self.embeddings[cid] = self.embedder.embed(chunk.content)
                # Legacy/Heal: If subject is empty, try to derive from filename
                if not chunk.subject:
                    name = os.path.basename(chunk.source_file or "").lower()
                    if "data structure" in name:
                        chunk.subject = "Data Structures"
                    else:
                        chunk.subject = "General"
                
                subj = chunk.subject.strip().title()
                if subj not in self.by_subject: self.by_subject[subj] = []
                self.by_subject[subj].append(cid)
                
        except Exception as e:
            print(f"Load error: {e}")

    def get_stats(self) -> Dict:
        doc_types = sorted(list(set(c.doc_type.value for c in self.chunks.values() if hasattr(c.doc_type, "value"))))
        return {
            "total_chunks": len(self.chunks),
            "total_subjects": len(self.by_subject),
            "subjects": sorted(list(self.by_subject.keys())),
            "total_retrievals": self.total_retrievals,
            "doc_types": doc_types,
            "total_doc_types": len(doc_types)
        }

    def get_subjects(self) -> List[str]:
        """Returns the list of all indexed subjects."""
        return sorted(list(self.by_subject.keys()))

    def get_topics(self, subject: str) -> List[Dict[str, str]]:
        """Extract unique topics from chunks of a specific subject."""
        # Find the correct key (case-insensitive)
        target_subject = subject.strip().title()
        chunk_ids = self.by_subject.get(target_subject, [])
        
        # Fallback to search if direct match fails
        if not chunk_ids:
            for s in self.by_subject:
                if s.lower() == subject.lower():
                    chunk_ids = self.by_subject[s]
                    break
                    
        unique_topics = set()
        topics_list = []
        
        for cid in chunk_ids:
            chunk = self.chunks.get(cid)
            if chunk and chunk.topic and chunk.topic != "General Concept":
                # Create a composite key to handle same topic in different sources if needed
                # However, for the simple list we just include the source
                if chunk.topic not in unique_topics:
                    unique_topics.add(chunk.topic)
                    topics_list.append({
                        "id": f"topic_{len(topics_list)}",
                        "name": chunk.topic,
                        "source": chunk.source_file
                    })
        
        return topics_list

    def clear(self):
        self.chunks.clear()
        self.embeddings.clear()
        self.by_subject.clear()
        if os.path.exists(self.storage_path):
            os.remove(self.storage_path)


# Singleton
vector_store = VectorStore()

