"""
==============================================================================
LEARNCOPILOT - RAG API ROUTES
API endpoints for the RAG system
==============================================================================
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import tempfile
import os

from ..rag import (
    ingestion_pipeline,
    vector_store,
    query_router,
    rag_executor,
    DocumentType,
    Difficulty
)

router = APIRouter(prefix="/rag", tags=["RAG"])


# ============================================================================
# Request/Response Models
# ============================================================================

class QueryRequest(BaseModel):
    query: str
    subject: Optional[str] = None
    doc_type: Optional[str] = None
    difficulty: Optional[str] = None
    use_cache: bool = True


class QueryResponse(BaseModel):
    answer: str
    citations: List[Dict]
    confidence: float
    route_used: str
    reasoning: str


class DocumentUploadResponse(BaseModel):
    success: bool
    document_id: str
    chunks_created: int
    subject: str
    doc_type: str
    message: str


class SystemStatsResponse(BaseModel):
    vector_store: Dict
    llm_metrics: Dict


# ============================================================================
# Document Upload Endpoints
# ============================================================================

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    subject_hint: Optional[str] = None
):
    """
    Upload and process a document for RAG.
    
    Supports:
    - PDF files (syllabus, notes, lab manuals, etc.)
    - Text files
    
    The system automatically:
    - Detects document type
    - Extracts and cleans text
    - Creates semantic chunks
    - Generates embeddings
    """
    
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    allowed_extensions = ['.pdf', '.txt', '.md']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {allowed_extensions}"
        )
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Process document
        if file_ext == '.pdf':
            processed = ingestion_pipeline.process_pdf(
                file_path=tmp_path,
                user_subject_hint=subject_hint,
                original_filename=file.filename
            )
        else:
            # Text file
            text_content = content.decode('utf-8')
            processed = ingestion_pipeline.process_text(
                text=text_content,
                filename=file.filename,
                user_subject_hint=subject_hint
            )
        
        # Cleanup temp file
        os.unlink(tmp_path)
        
        # Add chunks to vector store
        vector_store.add_chunks(processed.chunks)
        
        return DocumentUploadResponse(
            success=True,
            document_id=processed.doc_id,
            chunks_created=len(processed.chunks),
            subject=processed.subject,
            doc_type=processed.doc_type.value,
            message=f"Successfully processed '{file.filename}' into {len(processed.chunks)} chunks"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")


@router.post("/upload-text")
async def upload_text_content(
    content: str,
    title: str,
    subject: Optional[str] = None,
    doc_type: Optional[str] = None
):
    """
    Upload raw text content for RAG.
    Useful for pasting notes or content directly.
    """
    try:
        processed = ingestion_pipeline.process_text(
            text=content,
            filename=title,
            user_subject_hint=subject
        )
        
        vector_store.add_chunks(processed.chunks)
        
        return {
            "success": True,
            "document_id": processed.doc_id,
            "chunks_created": len(processed.chunks),
            "subject": processed.subject,
            "doc_type": processed.doc_type.value
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Query Endpoints
# ============================================================================

@router.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    """
    Query the RAG system.
    
    The system automatically:
    - Routes query to appropriate handler (RAG, algorithmic, LLM)
    - Retrieves relevant context if using RAG
    - Generates grounded response with citations
    """
    try:
        # Parse filters
        doc_type_filter = None
        if request.doc_type:
            try:
                doc_type_filter = DocumentType(request.doc_type)
            except ValueError:
                pass
        
        difficulty_filter = None
        if request.difficulty:
            try:
                difficulty_filter = Difficulty(request.difficulty)
            except ValueError:
                pass
        
        # Route the query
        routing = query_router.route(
            query=request.query,
            context={
                "current_subject": request.subject
            } if request.subject else None
        )
        
        # Execute based on route
        response = await rag_executor.execute(
            query=request.query,
            routing_decision=routing,
            subject=request.subject,
            doc_type=doc_type_filter,
            difficulty=difficulty_filter
        )
        
        return QueryResponse(
            answer=response.answer,
            citations=response.citations,
            confidence=response.confidence,
            route_used=response.route_used.value,
            reasoning=routing.reasoning
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query error: {str(e)}")


@router.get("/route-preview")
async def preview_routing(query: str, subject: Optional[str] = None):
    """
    Preview how a query would be routed without executing.
    Useful for debugging and understanding the system.
    """
    routing = query_router.route(
        query=query,
        context={"current_subject": subject} if subject else None
    )
    
    return {
        "route": routing.route.value,
        "intent": routing.intent.value,
        "confidence": routing.confidence,
        "reasoning": routing.reasoning,
        "suggested_filters": routing.suggested_filters
    }


# ============================================================================
# System Endpoints
# ============================================================================

@router.get("/stats", response_model=SystemStatsResponse)
async def get_system_stats():
    """Get RAG system statistics and metrics."""
    from ..rag import llm_manager
    
    return SystemStatsResponse(
        vector_store=vector_store.get_stats(),
        llm_metrics=llm_manager.get_metrics()
    )


@router.post("/chat")
async def general_chat(
    query: str,
    subject: Optional[str] = None
):
    """
    General AI chat endpoint with optional RAG context.
    Fulfills the 'website chat' requirement using Groq AI.
    """
    from ..rag import rag_executor, llm_manager, RoutingDecision, QueryRoute, QueryIntent
    
    # 1. Provide Contextual RAG if subject is active
    if subject:
        routing = RoutingDecision(
            route=QueryRoute.RAG,
            intent=QueryIntent.GENERAL_QUERY,
            confidence=1.0,
            reasoning="Answering user query with subject context.",
            suggested_filters={"subject": subject}
        )
        rag_res = await rag_executor.execute(query=query, routing_decision=routing)
        return {
            "answer": rag_res.answer,
            "citations": rag_res.citations,
            "source": "rag"
        }
    
    # 2. Direct LLM Response via Groq
    completion = await llm_manager.generate(
        prompt=query,
        system_prompt="You are Learning Copilot AI. A professional, helpful study assistant. Use a friendly but academic tone.",
        temperature=0.7
    )
    
    return {
        "answer": completion.content,
        "citations": [],
        "source": "groq"
    }


@router.get("/subjects")
async def list_subjects():
    """List all indexed subjects."""
    stats = vector_store.get_stats()
    return {
        "subjects": stats["subjects"],
        "total": stats["total_subjects"]
    }


@router.get("/doc-types")
async def list_document_types():
    """List all indexed document types."""
    stats = vector_store.get_stats()
    return {
        "doc_types": stats["doc_types"],
        "total": stats["total_doc_types"]
    }


@router.get("/documents")
async def list_documents(subject: Optional[str] = None):
    """List all individual documents indexed."""
    docs = []
    # Use a set to avoid duplicates since chunks share doc info
    seen_docs = set()
    
    for chunk in vector_store.chunks.values():
        doc_key = (chunk.source_file, chunk.subject)
        if doc_key not in seen_docs:
            if not subject or chunk.subject.lower() == subject.lower():
                docs.append({
                    "filename": chunk.source_file,
                    "subject": chunk.subject,
                    "type": chunk.doc_type.value if hasattr(chunk.doc_type, "value") else str(chunk.doc_type),
                    "timestamp": chunk.timestamp
                })
                seen_docs.add(doc_key)
    
    return {"documents": docs, "total": len(docs)}


@router.get("/curriculum/{subject}")
async def get_curriculum(subject: str, filename: Optional[str] = None):
    """
    Discover the curriculum (Units/Topics) within a subject based on RAG context.
    Optionally filter by a specific source document.
    """
    # Helper to generate rich, realistic domain chapters for any subject
    def get_domain_curriculum(subj_name: str) -> List[Dict]:
        s = subj_name.lower()
        if "java" in s:
            return [
                {"id": "java_u1", "name": "Unit 1: Java Basics & JVM Architecture"},
                {"id": "java_u2", "name": "Unit 2: OOP Principles (Classes, Inheritance & Polymorphism)"},
                {"id": "java_u3", "name": "Unit 3: Java Collections Framework & Generics"},
                {"id": "java_u4", "name": "Unit 4: Exception Handling & I/O Streams"},
                {"id": "java_u5", "name": "Unit 5: Concurrency, Multithreading & Virtual Threads (SE 21)"},
                {"id": "java_u6", "name": "Unit 6: High-Yield Exam Questions & Code Solutions"}
            ]
        elif "python" in s:
            return [
                {"id": "py_u1", "name": "Unit 1: Python Fundamentals & Data Types"},
                {"id": "py_u2", "name": "Unit 2: Object-Oriented & Functional Programming"},
                {"id": "py_u3", "name": "Unit 3: File Handling, Context Managers & Modules"},
                {"id": "py_u4", "name": "Unit 4: Asynchronous Programming & Web Frameworks"},
                {"id": "py_u5", "name": "Unit 5: Data Analysis with NumPy & Pandas"}
            ]
        elif "data structure" in s or "dsa" in s or "algorithm" in s:
            return [
                {"id": "dsa_u1", "name": "Unit 1: Time & Space Complexity Analysis"},
                {"id": "dsa_u2", "name": "Unit 2: Linear Structures (Stacks, Queues, Linked Lists)"},
                {"id": "dsa_u3", "name": "Unit 3: Trees, BSTs & Balanced AVL Trees"},
                {"id": "dsa_u4", "name": "Unit 4: Graph Algorithms (BFS, DFS, Shortest Paths)"},
                {"id": "dsa_u5", "name": "Unit 5: Dynamic Programming & Greedy Strategies"}
            ]
        elif "dbms" in s or "database" in s or "sql" in s:
            return [
                {"id": "db_u1", "name": "Unit 1: Relational Model & ER Diagrams"},
                {"id": "db_u2", "name": "Unit 2: SQL DDL/DML Queries & Complex Joins"},
                {"id": "db_u3", "name": "Unit 3: Normalization (1NF to BCNF) & Dependency"},
                {"id": "db_u4", "name": "Unit 4: Transaction Processing & ACID Properties"},
                {"id": "db_u5", "name": "Unit 5: Indexing, B-Trees & Query Optimization"}
            ]
        elif "pdd" in s or "chatbot" in s or "app" in s:
            return [
                {"id": "app_u1", "name": "Unit 1: Multi-Tenant Architecture & Ecosystem Overview"},
                {"id": "app_u2", "name": "Unit 2: Business & Admin Platform Engine"},
                {"id": "app_u3", "name": "Unit 3: Consumer Unified Support Interface"},
                {"id": "app_u4", "name": "Unit 4: Database Schema & Real-Time API Gateway"},
                {"id": "app_u5", "name": "Unit 5: Monetization, Scalability & Production Roadmap"}
            ]
        elif "cycle" in s or "energy" in s or "ps7" in s:
            return [
                {"id": "cs_u1", "name": "Unit 1: Biological Cycles & Energy Planning Foundations"},
                {"id": "cs_u2", "name": "Unit 2: Phase Characteristics (Follicular, Ovulation, Luteal)"},
                {"id": "cs_u3", "name": "Unit 3: Energy Logging & Correlation Analysis"},
                {"id": "cs_u4", "name": "Unit 4: Explainable Planning & Task Scheduling Logic"},
                {"id": "cs_u5", "name": "Unit 5: Privacy-First Architecture & Enterprise Safety"}
            ]
        else:
            clean_name = subj_name.replace("_", " ").title()
            return [
                {"id": "gen_u1", "name": f"Unit 1: {clean_name} - Fundamentals & Core Concepts"},
                {"id": "gen_u2", "name": f"Unit 2: {clean_name} - Architecture & Theoretical Models"},
                {"id": "gen_u3", "name": f"Unit 3: {clean_name} - Practical Applications & Case Studies"},
                {"id": "gen_u4", "name": f"Unit 4: {clean_name} - Advanced Techniques & Optimization"},
                {"id": "gen_u5", "name": f"Unit 5: {clean_name} - High-Yield Exam Preparation & Review"}
            ]

    # 1. Try to get topics directly from vector store metadata
    v_topics = vector_store.get_topics(subject)
    
    # Filter by filename if provided
    if filename:
        v_topics = [t for t in v_topics if t.get("source") == filename]
    
    # If we have real topics from ingestion and they look substantial, use them
    if v_topics and len(v_topics) >= 4:
        return {
            "subject": subject,
            "topics": v_topics,
            "source": "metadata"
        }

    # 2. Fallback to LLM extraction if metadata is sparse
    from ..rag import rag_executor, llm_manager, RoutingDecision, QueryRoute, QueryIntent
    import json
    
    routing = RoutingDecision(
        route=QueryRoute.RAG,
        intent=QueryIntent.THEORY_EXPLANATION,
        confidence=1.0,
        reasoning="Extracting curriculum structure from document context.",
        suggested_filters={"subject": subject}
    )
    
    overview_query = f"Provide a comprehensive overview and table of contents for the subject: {subject}. Identify the Units and specific topics."
    
    try:
        rag_res = await rag_executor.execute(query=overview_query, routing_decision=routing, subject=subject)
        
        if rag_res.citations and len(rag_res.citations) >= 2:
            curriculum_prompt = f"""
            Analyze the following academic content for '{subject}' and extract a structured unit-wise curriculum. 
            
            INSTRUCTIONS:
            - Identify specific Units (e.g., Unit 1: Introduction, Unit 2: Linear Data Structures).
            - Under each unit, identify key sub-topics.
            - RETURN ONLY a flat JSON list of objects where names include the Unit label.
            - Example: [ {{"id": "u1", "name": "Unit 1: Introduction to Data Structures"}}, {{"id": "u2", "name": "Unit 2: Linear Structures (Stacks/Queues)"}} ]
            
            CONTENT:
            {rag_res.answer}
            
            JSON:
            """
            
            llm_res = await llm_manager.generate(curriculum_prompt, temperature=0.1)
            json_str = llm_res.content.strip()
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0].strip()
                
            topics = json.loads(json_str)
            if isinstance(topics, list) and len(topics) >= 3:
                return {
                    "subject": subject,
                    "topics": topics,
                    "source": "rag"
                }
    except Exception:
        pass

    # 3. Guaranteed rich domain curriculum fallback (Never returns empty!)
    domain_topics = get_domain_curriculum(subject)
    return {
        "subject": subject,
        "topics": domain_topics,
        "source": "domain_curriculum"
    }


@router.delete("/clear")
async def clear_vector_store():
    """Clear all indexed documents. Use with caution."""
    vector_store.clear()
    return {"success": True, "message": "Vector store cleared"}


# ============================================================================
# Demo Data Endpoint
# ============================================================================

@router.post("/load-demo")
async def load_demo_data():
    """Endpoint preserved for API compatibility but content removed to ensure a clean state."""
    return {
        "success": True,
        "message": "Demo content has been removed. Please upload your own academic materials."
    }
