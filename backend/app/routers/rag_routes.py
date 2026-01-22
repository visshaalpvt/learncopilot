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
                user_subject_hint=subject_hint
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
    """
    Load sample academic content for demonstration.
    """
    demo_content = [
        {
            "title": "Data Structures - Introduction",
            "subject": "Computer Science",
            "content": """
Data Structures: Introduction

A data structure is a specialized format for organizing, processing, retrieving and storing data. 
It provides a means to manage large amounts of data efficiently for uses such as large databases and internet indexing services.

Types of Data Structures:

1. Arrays
An array is a collection of items stored at contiguous memory locations. The idea is to store multiple items of the same type together.
Time Complexity: Access O(1), Search O(n), Insertion O(n), Deletion O(n)

2. Linked Lists  
A linked list is a linear data structure where each element is a separate object called a node. Each node contains data and a reference to the next node.
Types: Singly Linked List, Doubly Linked List, Circular Linked List

3. Stacks
A stack is a linear data structure that follows the Last In First Out (LIFO) principle.
Operations: Push (add), Pop (remove), Peek (view top)
Applications: Expression evaluation, Backtracking, Function call management

4. Queues
A queue is a linear data structure that follows the First In First Out (FIFO) principle.
Operations: Enqueue (add), Dequeue (remove), Front (view first)
Applications: CPU scheduling, Disk scheduling, Breadth-first search

5. Trees
A tree is a hierarchical data structure with a root value and subtrees of children with a parent node.
Types: Binary Tree, Binary Search Tree, AVL Tree, B-Tree
"""
        },
        {
            "title": "Database Management Systems - SQL",
            "subject": "Computer Science", 
            "content": """
SQL (Structured Query Language)

SQL is a standard language for managing and manipulating relational databases.

Basic SQL Commands:

SELECT Statement:
SELECT column1, column2 FROM table_name WHERE condition;

Example:
SELECT name, age FROM students WHERE age > 20;

INSERT Statement:
INSERT INTO table_name (column1, column2) VALUES (value1, value2);

UPDATE Statement:
UPDATE table_name SET column1 = value1 WHERE condition;

DELETE Statement:
DELETE FROM table_name WHERE condition;

JOIN Operations:

1. INNER JOIN - Returns records with matching values in both tables
2. LEFT JOIN - Returns all records from left table and matched records from right
3. RIGHT JOIN - Returns all records from right table and matched records from left
4. FULL OUTER JOIN - Returns all records when there is a match in either table

Example of JOIN:
SELECT orders.id, customers.name 
FROM orders 
INNER JOIN customers ON orders.customer_id = customers.id;

Normalization:
Process of organizing data to reduce redundancy
- 1NF: Eliminate repeating groups
- 2NF: Remove partial dependencies
- 3NF: Remove transitive dependencies
"""
        },
        {
            "title": "Physics - Laws of Motion",
            "subject": "Physics",
            "content": """
Newton's Laws of Motion

First Law (Law of Inertia):
An object at rest stays at rest, and an object in motion stays in motion with the same speed 
and in the same direction, unless acted upon by an unbalanced force.

Mathematical expression: If F = 0, then a = 0 (or v = constant)

Second Law (Law of Acceleration):
The acceleration of an object depends on the mass of the object and the amount of force applied.

Formula: F = ma
Where:
- F = Force (in Newtons)
- m = Mass (in kilograms)
- a = Acceleration (in m/s²)

Third Law (Action-Reaction):
For every action, there is an equal and opposite reaction.

If object A exerts a force on object B, then object B exerts an equal and opposite force on object A.
F(A on B) = -F(B on A)

Applications:
1. Rocket propulsion - exhaust gases push down, rocket goes up
2. Walking - foot pushes ground backward, ground pushes foot forward
3. Swimming - hands push water backward, water pushes body forward

Example Problems:
Q1: A 5 kg object accelerates at 2 m/s². What is the net force?
A1: F = ma = 5 × 2 = 10 N

Q2: A force of 20 N is applied to a 4 kg mass. Find acceleration.
A2: a = F/m = 20/4 = 5 m/s²
"""
        }
    ]
    
    chunks_created = 0
    
    for demo in demo_content:
        processed = ingestion_pipeline.process_text(
            text=demo["content"],
            filename=demo["title"],
            user_subject_hint=demo["subject"]
        )
        vector_store.add_chunks(processed.chunks)
        chunks_created += len(processed.chunks)
    
    return {
        "success": True,
        "documents_loaded": len(demo_content),
        "chunks_created": chunks_created,
        "subjects": list(set(d["subject"] for d in demo_content)),
        "message": "Demo data loaded successfully. You can now query the RAG system."
    }
