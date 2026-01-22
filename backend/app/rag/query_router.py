"""
==============================================================================
LEARNCOPILOT - QUERY ROUTER
Intelligent routing between RAG, Algorithmic Logic, and LLM
==============================================================================

This module handles:
- Query classification
- Route determination
- Context-aware routing decisions

Author: LearnCopilot Team
==============================================================================
"""

from enum import Enum
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import re


class QueryRoute(Enum):
    """Possible query routes"""
    RAG = "rag"                      # Document-grounded retrieval
    ALGORITHMIC = "algorithmic"      # Planning, scheduling, analytics
    REASONING_LLM = "reasoning_llm"  # Complex reasoning (coding, problem-solving)
    HYBRID = "hybrid"                # RAG + LLM reasoning


class QueryIntent(Enum):
    """Detected query intents"""
    # RAG intents
    THEORY_EXPLANATION = "theory_explanation"
    CONCEPT_CLARIFICATION = "concept_clarification"
    DEFINITION_LOOKUP = "definition_lookup"
    EXAMPLE_REQUEST = "example_request"
    LAB_PROCEDURE = "lab_procedure"
    EXAM_QUESTION = "exam_question"
    
    # Algorithmic intents
    SCHEDULE_QUERY = "schedule_query"
    PROGRESS_CHECK = "progress_check"
    ANALYTICS_REQUEST = "analytics_request"
    PLAN_GENERATION = "plan_generation"
    
    # Reasoning intents
    CODE_GENERATION = "code_generation"
    PROBLEM_SOLVING = "problem_solving"
    COMPARISON_ANALYSIS = "comparison_analysis"
    CRITICAL_THINKING = "critical_thinking"
    
    # General
    GENERAL_CHAT = "general_chat"


@dataclass
class RoutingDecision:
    """Result of query routing"""
    route: QueryRoute
    intent: QueryIntent
    confidence: float
    reasoning: str
    suggested_filters: Dict


class QueryRouter:
    """
    Intelligent query router for LearnCopilot.
    
    Decides whether to:
    - Use RAG for document-grounded answers
    - Use algorithmic logic for planning/analytics
    - Use reasoning LLM for complex problem-solving
    - Use hybrid approach for comprehensive answers
    """
    
    def __init__(self):
        # Intent patterns
        self.rag_patterns = [
            # Theory/Concept patterns
            (r'\b(what is|define|explain|describe)\b.*\b(concept|theory|principle|law)\b', QueryIntent.THEORY_EXPLANATION),
            (r'\b(what are|list|give)\b.*\b(types|kinds|categories|examples)\b', QueryIntent.THEORY_EXPLANATION),
            (r'\bexplain\b', QueryIntent.CONCEPT_CLARIFICATION),
            (r'\bwhat is\b', QueryIntent.DEFINITION_LOOKUP),
            (r'\bdefine\b', QueryIntent.DEFINITION_LOOKUP),
            (r'\bmeaning of\b', QueryIntent.DEFINITION_LOOKUP),
            
            # Example patterns
            (r'\b(give|show|provide)\b.*\bexample', QueryIntent.EXAMPLE_REQUEST),
            (r'\bfor example\b', QueryIntent.EXAMPLE_REQUEST),
            (r'\billustrate\b', QueryIntent.EXAMPLE_REQUEST),
            
            # Lab patterns
            (r'\b(procedure|steps|how to)\b.*\b(lab|experiment|practical)\b', QueryIntent.LAB_PROCEDURE),
            (r'\blab\b.*\b(manual|procedure|experiment)\b', QueryIntent.LAB_PROCEDURE),
            (r'\bpractical\b.*\b(steps|procedure)\b', QueryIntent.LAB_PROCEDURE),
            
            # Exam patterns
            (r'\b(exam|test|quiz)\b.*\bquestion', QueryIntent.EXAM_QUESTION),
            (r'\bprevious year\b', QueryIntent.EXAM_QUESTION),
            (r'\bimportant questions\b', QueryIntent.EXAM_QUESTION),
            (r'\bmark\s*question', QueryIntent.EXAM_QUESTION),
        ]
        
        self.algorithmic_patterns = [
            (r'\b(schedule|plan|organize)\b.*\b(study|learning|exam)\b', QueryIntent.PLAN_GENERATION),
            (r'\bmy progress\b', QueryIntent.PROGRESS_CHECK),
            (r'\bhow much\b.*\b(completed|done|learned)\b', QueryIntent.PROGRESS_CHECK),
            (r'\banalyze\b.*\b(performance|score|grade)\b', QueryIntent.ANALYTICS_REQUEST),
            (r'\bstatistics\b', QueryIntent.ANALYTICS_REQUEST),
            (r'\bwhen should\b.*\bstudy\b', QueryIntent.SCHEDULE_QUERY),
            (r'\btime management\b', QueryIntent.SCHEDULE_QUERY),
        ]
        
        self.reasoning_patterns = [
            (r'\b(write|generate|create)\b.*\bcode\b', QueryIntent.CODE_GENERATION),
            (r'\b(implement|program)\b', QueryIntent.CODE_GENERATION),
            (r'\bsolve\b.*\b(problem|equation|exercise)\b', QueryIntent.PROBLEM_SOLVING),
            (r'\bcalculate\b', QueryIntent.PROBLEM_SOLVING),
            (r'\b(compare|contrast|difference)\b.*\bbetween\b', QueryIntent.COMPARISON_ANALYSIS),
            (r'\b(pros and cons|advantages|disadvantages)\b', QueryIntent.COMPARISON_ANALYSIS),
            (r'\bwhy\b.*\b(better|worse|important)\b', QueryIntent.CRITICAL_THINKING),
            (r'\bwhat if\b', QueryIntent.CRITICAL_THINKING),
            (r'\banalyze\b.*\b(critically|deeply)\b', QueryIntent.CRITICAL_THINKING),
        ]
        
        # Subject keywords for filter suggestions
        self.subject_keywords = {
            'computer science': ['algorithm', 'programming', 'data structure', 'software', 'code', 'database', 'network'],
            'physics': ['force', 'energy', 'motion', 'wave', 'electricity', 'magnetic', 'quantum', 'thermodynamics'],
            'chemistry': ['reaction', 'element', 'compound', 'organic', 'inorganic', 'acid', 'base', 'bond'],
            'mathematics': ['equation', 'formula', 'theorem', 'proof', 'calculus', 'algebra', 'geometry'],
            'biology': ['cell', 'organism', 'gene', 'evolution', 'ecosystem', 'anatomy', 'protein'],
            'electronics': ['circuit', 'transistor', 'amplifier', 'signal', 'digital', 'analog', 'microprocessor'],
        }
    
    def route(self, query: str, context: Optional[Dict] = None) -> RoutingDecision:
        """
        Route a query to the appropriate handler.
        
        Args:
            query: User query
            context: Optional context (current subject, user preferences, etc.)
            
        Returns:
            RoutingDecision with route, intent, and filters
        """
        query_lower = query.lower().strip()
        context = context or {}
        
        # Detect intent and route
        intent, route, confidence = self._classify_query(query_lower)
        
        # Generate reasoning
        reasoning = self._generate_reasoning(intent, route)
        
        # Suggest filters for RAG queries
        filters = self._suggest_filters(query_lower, context)
        
        return RoutingDecision(
            route=route,
            intent=intent,
            confidence=confidence,
            reasoning=reasoning,
            suggested_filters=filters
        )
    
    def _classify_query(self, query: str) -> Tuple[QueryIntent, QueryRoute, float]:
        """Classify query intent and determine route."""
        
        # Check RAG patterns
        for pattern, intent in self.rag_patterns:
            if re.search(pattern, query, re.IGNORECASE):
                return intent, QueryRoute.RAG, 0.85
        
        # Check algorithmic patterns
        for pattern, intent in self.algorithmic_patterns:
            if re.search(pattern, query, re.IGNORECASE):
                return intent, QueryRoute.ALGORITHMIC, 0.80
        
        # Check reasoning patterns
        for pattern, intent in self.reasoning_patterns:
            if re.search(pattern, query, re.IGNORECASE):
                # Problem-solving and comparison might need RAG context
                if intent in [QueryIntent.PROBLEM_SOLVING, QueryIntent.COMPARISON_ANALYSIS]:
                    return intent, QueryRoute.HYBRID, 0.75
                return intent, QueryRoute.REASONING_LLM, 0.80
        
        # Default: Check if query seems academic
        academic_indicators = ['learn', 'study', 'understand', 'concept', 'topic', 'chapter', 'subject']
        if any(ind in query for ind in academic_indicators):
            return QueryIntent.CONCEPT_CLARIFICATION, QueryRoute.RAG, 0.60
        
        # Fallback to general chat
        return QueryIntent.GENERAL_CHAT, QueryRoute.REASONING_LLM, 0.50
    
    def _generate_reasoning(self, intent: QueryIntent, route: QueryRoute) -> str:
        """Generate human-readable reasoning for the routing decision."""
        
        reasoning_map = {
            (QueryIntent.THEORY_EXPLANATION, QueryRoute.RAG): 
                "Query asks for academic theory - using document retrieval for accurate, grounded answer.",
            (QueryIntent.CONCEPT_CLARIFICATION, QueryRoute.RAG):
                "Query seeks concept clarification - retrieving relevant study materials.",
            (QueryIntent.DEFINITION_LOOKUP, QueryRoute.RAG):
                "Query is a definition request - searching indexed documents.",
            (QueryIntent.EXAMPLE_REQUEST, QueryRoute.RAG):
                "Query asks for examples - retrieving from study materials.",
            (QueryIntent.LAB_PROCEDURE, QueryRoute.RAG):
                "Query about lab procedure - retrieving from lab manuals.",
            (QueryIntent.EXAM_QUESTION, QueryRoute.RAG):
                "Query about exam questions - searching question banks.",
            (QueryIntent.SCHEDULE_QUERY, QueryRoute.ALGORITHMIC):
                "Query about scheduling - using algorithmic planning.",
            (QueryIntent.PROGRESS_CHECK, QueryRoute.ALGORITHMIC):
                "Query about progress - computing from user analytics.",
            (QueryIntent.ANALYTICS_REQUEST, QueryRoute.ALGORITHMIC):
                "Query requests analytics - computing statistics.",
            (QueryIntent.PLAN_GENERATION, QueryRoute.ALGORITHMIC):
                "Query for study plan - using planning algorithms.",
            (QueryIntent.CODE_GENERATION, QueryRoute.REASONING_LLM):
                "Query requires code generation - using reasoning LLM.",
            (QueryIntent.PROBLEM_SOLVING, QueryRoute.HYBRID):
                "Query requires problem solving - combining documents with reasoning.",
            (QueryIntent.COMPARISON_ANALYSIS, QueryRoute.HYBRID):
                "Query requires comparison - retrieving facts then analyzing.",
            (QueryIntent.CRITICAL_THINKING, QueryRoute.REASONING_LLM):
                "Query requires critical analysis - using reasoning LLM.",
            (QueryIntent.GENERAL_CHAT, QueryRoute.REASONING_LLM):
                "General query - using conversational LLM.",
        }
        
        return reasoning_map.get(
            (intent, route), 
            f"Routing to {route.value} based on query analysis."
        )
    
    def _suggest_filters(self, query: str, context: Dict) -> Dict:
        """Suggest metadata filters for RAG retrieval."""
        filters = {}
        
        # Use context if available
        if 'current_subject' in context:
            filters['subject'] = context['current_subject']
        else:
            # Try to detect subject from query
            for subject, keywords in self.subject_keywords.items():
                if any(kw in query for kw in keywords):
                    filters['subject'] = subject
                    break
        
        # Detect document type hints
        if any(word in query for word in ['lab', 'practical', 'experiment']):
            filters['doc_type'] = 'lab_manual'
        elif any(word in query for word in ['exam', 'question', 'previous year']):
            filters['doc_type'] = 'exam_paper'
        elif any(word in query for word in ['theory', 'concept', 'principle']):
            filters['doc_type'] = 'theory'
        
        # Use context for topic if available
        if 'current_topic' in context:
            filters['topic'] = context['current_topic']
        
        return filters


# Singleton instance
query_router = QueryRouter()
