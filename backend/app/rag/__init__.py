"""
==============================================================================
LEARNCOPILOT - RAG SYSTEM
Automated, Subject-Agnostic Retrieval-Augmented Generation
==============================================================================

This package provides the complete RAG pipeline for LearnCopilot:

1. Document Ingestion - Automated PDF/text processing with metadata extraction
2. Vector Store - Embedding generation and metadata-filtered retrieval
3. Query Router - Intelligent routing between RAG, algorithms, and LLM
4. LLM Manager - Multi-provider inference with automatic fallback
5. RAG Executor - Document-grounded response generation with citations

Author: LearnCopilot Team
==============================================================================
"""

from .document_ingestion import (
    DocumentIngestionPipeline,
    DocumentChunk,
    ProcessedDocument,
    DocumentType,
    Difficulty,
    ingestion_pipeline
)

from .vector_store import (
    VectorStore,
    RetrievalResult,
    vector_store
)

from .query_router import (
    QueryRouter,
    QueryRoute,
    QueryIntent,
    RoutingDecision,
    query_router
)

from .llm_manager import (
    LLMManager,
    LLMProvider,
    LLMResponse,
    llm_manager
)

from .rag_executor import (
    RAGExecutor,
    RAGResponse,
    rag_executor
)


__all__ = [
    # Document Ingestion
    "DocumentIngestionPipeline",
    "DocumentChunk", 
    "ProcessedDocument",
    "DocumentType",
    "Difficulty",
    "ingestion_pipeline",
    
    # Vector Store
    "VectorStore",
    "RetrievalResult",
    "vector_store",
    
    # Query Router
    "QueryRouter",
    "QueryRoute",
    "QueryIntent", 
    "RoutingDecision",
    "query_router",
    
    # LLM Manager
    "LLMManager",
    "LLMProvider",
    "LLMResponse",
    "llm_manager",
    
    # RAG Executor
    "RAGExecutor",
    "RAGResponse",
    "rag_executor"
]
