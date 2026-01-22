"""
==============================================================================
LEARNCOPILOT - RAG EXECUTOR
Document-Grounded Response Generation
==============================================================================

This module handles:
- Context retrieval and formatting
- Prompt engineering for RAG
- Response generation with citations
- Strict grounding enforcement

Author: LearnCopilot Team
==============================================================================
"""

from typing import List, Dict, Optional
from dataclasses import dataclass

from .vector_store import vector_store, RetrievalResult
from .query_router import QueryRoute, QueryIntent, RoutingDecision
from .llm_manager import llm_manager, LLMResponse
from .document_ingestion import DocumentType, Difficulty


@dataclass
class RAGResponse:
    """Complete RAG response with citations"""
    answer: str
    citations: List[Dict]
    confidence: float
    route_used: QueryRoute
    retrieval_results: List[RetrievalResult]
    llm_response: Optional[LLMResponse]


class RAGExecutor:
    """
    RAG Executor for document-grounded responses.
    
    Enforces:
    - Strict grounding to retrieved documents
    - Proper citation of sources
    - Academic accuracy
    - Clear "I don't know" when context is insufficient
    """
    
    def __init__(self):
        self.min_retrieval_score = 0.3
        self.max_context_chunks = 5
    
    async def execute(
        self,
        query: str,
        routing_decision: RoutingDecision,
        subject: Optional[str] = None,
        doc_type: Optional[DocumentType] = None,
        difficulty: Optional[Difficulty] = None
    ) -> RAGResponse:
        """
        Execute RAG pipeline for a query.
        
        Args:
            query: User query
            routing_decision: Result from query router
            subject: Optional subject filter
            doc_type: Optional document type filter
            difficulty: Optional difficulty filter
            
        Returns:
            RAGResponse with grounded answer and citations
        """
        
        # Use suggested filters from routing if not provided
        if not subject and 'subject' in routing_decision.suggested_filters:
            subject = routing_decision.suggested_filters['subject']
        
        # Retrieve relevant chunks
        retrieval_results = vector_store.retrieve(
            query=query,
            top_k=self.max_context_chunks,
            subject_filter=subject,
            doc_type_filter=doc_type,
            difficulty_filter=difficulty,
            min_score=self.min_retrieval_score
        )
        
        # Check if we have sufficient context
        if not retrieval_results:
            return self._insufficient_context_response(query, routing_decision)
        
        # Format context for LLM
        context = self._format_context(retrieval_results)
        
        # Build prompt based on intent
        system_prompt = self._build_system_prompt(routing_decision.intent)
        user_prompt = self._build_user_prompt(query, context, routing_decision.intent)
        
        # Generate response
        llm_response = await llm_manager.generate(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.3  # Lower temperature for factual accuracy
        )
        
        # Build citations
        citations = self._build_citations(retrieval_results)
        
        # Calculate confidence
        confidence = self._calculate_confidence(retrieval_results, llm_response)
        
        return RAGResponse(
            answer=llm_response.content,
            citations=citations,
            confidence=confidence,
            route_used=routing_decision.route,
            retrieval_results=retrieval_results,
            llm_response=llm_response
        )
    
    def _format_context(self, results: List[RetrievalResult]) -> str:
        """Format retrieved chunks into LLM context."""
        context_parts = []
        
        for i, result in enumerate(results, 1):
            chunk = result.chunk
            context_parts.append(f"""
[Source {i}]
Subject: {chunk.subject}
Topic: {chunk.topic}
Type: {chunk.doc_type.value if hasattr(chunk.doc_type, 'value') else chunk.doc_type}
Content:
{chunk.content}
---""")
        
        return "\n".join(context_parts)
    
    def _build_system_prompt(self, intent: QueryIntent) -> str:
        """Build system prompt based on query intent."""
        
        base_prompt = """You are LearnCopilot, an academic AI assistant. Your role is to help students learn and understand their course materials.

CRITICAL RULES:
1. ONLY use information from the provided context/sources
2. If the context doesn't contain the answer, say "I don't have information about this in your study materials"
3. ALWAYS cite sources using [Source N] format
4. Be academically accurate and educational
5. Explain concepts clearly for student understanding"""
        
        intent_additions = {
            QueryIntent.THEORY_EXPLANATION: """
For theory explanations:
- Start with a clear definition
- Explain the underlying principles
- Use the exact terminology from the sources
- Add examples if present in the context""",
            
            QueryIntent.CONCEPT_CLARIFICATION: """
For concept clarification:
- Break down complex ideas into simpler parts
- Use analogies if helpful
- Connect to related concepts mentioned in sources""",
            
            QueryIntent.DEFINITION_LOOKUP: """
For definitions:
- Provide the exact definition from sources
- Keep it concise and precise
- Mention the source explicitly""",
            
            QueryIntent.EXAMPLE_REQUEST: """
For examples:
- Provide examples exactly as given in sources
- Add step-by-step explanation if appropriate
- Use proper formatting for code/formulas""",
            
            QueryIntent.LAB_PROCEDURE: """
For lab procedures:
- List steps clearly and in order
- Include safety precautions
- Mention required materials
- Follow the exact procedure from sources""",
            
            QueryIntent.EXAM_QUESTION: """
For exam questions:
- Present questions as they appear in sources
- Include mark weightage if mentioned
- Provide answer hints if available in context"""
        }
        
        return base_prompt + intent_additions.get(intent, "")
    
    def _build_user_prompt(self, query: str, context: str, intent: QueryIntent) -> str:
        """Build user prompt with context."""
        
        prompt_template = """Based on the following study materials, answer the student's question.

STUDY MATERIALS:
{context}

STUDENT'S QUESTION:
{query}

INSTRUCTIONS:
- Answer using ONLY information from the study materials above
- Cite sources using [Source N] format
- If information is not in the materials, explicitly say so
- Be educational and helpful

YOUR RESPONSE:"""
        
        return prompt_template.format(context=context, query=query)
    
    def _build_citations(self, results: List[RetrievalResult]) -> List[Dict]:
        """Build citation metadata from retrieval results."""
        citations = []
        
        for i, result in enumerate(results, 1):
            chunk = result.chunk
            citations.append({
                "source_id": i,
                "subject": chunk.subject,
                "topic": chunk.topic,
                "doc_type": chunk.doc_type.value if hasattr(chunk.doc_type, 'value') else str(chunk.doc_type),
                "score": round(result.score, 3),
                "chunk_id": chunk.chunk_id
            })
        
        return citations
    
    def _calculate_confidence(
        self, 
        results: List[RetrievalResult], 
        llm_response: LLMResponse
    ) -> float:
        """Calculate confidence score for the response."""
        if not results:
            return 0.0
        
        # Based on retrieval scores
        avg_score = sum(r.score for r in results) / len(results)
        
        # Adjust based on number of sources
        source_factor = min(len(results) / 3, 1.0)  # More sources = higher confidence
        
        # Combined confidence
        confidence = (avg_score * 0.7 + source_factor * 0.3)
        
        return round(min(confidence, 1.0), 2)
    
    def _insufficient_context_response(
        self, 
        query: str, 
        routing_decision: RoutingDecision
    ) -> RAGResponse:
        """Handle case when no relevant context is found."""
        return RAGResponse(
            answer="""I couldn't find relevant information in your uploaded study materials to answer this question.

This could mean:
1. You haven't uploaded materials covering this topic yet
2. The topic might be named differently in your materials
3. This might be outside the scope of your current subjects

**What you can do:**
- Upload relevant PDFs, notes, or textbooks covering this topic
- Try rephrasing your question with different keywords
- Specify the subject you're asking about

Would you like me to help with something else from your existing materials?""",
            citations=[],
            confidence=0.0,
            route_used=routing_decision.route,
            retrieval_results=[],
            llm_response=None
        )


# Singleton instance
rag_executor = RAGExecutor()
