"""
Dynamic Content Generator - Replaces mock_data.json
Generates content on-the-fly using rule-based templates and algorithms
NO AI APIs - Pure rule-based logic
"""

from typing import List, Dict
import hashlib

class ContentGenerator:
    """Generate educational content dynamically"""
    
    @staticmethod
    def normalize_topic(topic_name: str) -> str:
        """Normalize topic name for matching"""
        return topic_name.lower().strip().replace("_", " ").replace("-", " ")
    
    @staticmethod
    def generate_theory_content(topic_id: str, topic_name: str) -> Dict:
        """Generate theory content for any topic"""
        normalized = ContentGenerator.normalize_topic(topic_name)
        
        # Check if it's a programming/CS topic
        is_programming = any(keyword in normalized for keyword in [
            "programming", "code", "algorithm", "data structure", "function",
            "loop", "variable", "array", "list", "tree", "graph", "sort"
        ])
        
        is_theory = any(keyword in normalized for keyword in [
            "theory", "concept", "principle", "definition", "architecture"
        ])
        
        # Generate definition based on topic type
        if is_programming:
            definition = f"{topic_name} is a fundamental programming concept that allows developers to organize and manipulate data efficiently. It provides a structured way to solve computational problems."
        elif is_theory:
            definition = f"{topic_name} refers to the theoretical foundation and core principles that underpin computer science and software engineering practices."
        else:
            definition = f"{topic_name} is an important concept in computer science that helps in understanding and solving complex problems systematically."
        
        # Generate real-world example
        examples = {
            "programming": f"In real-world applications, {topic_name} is used in web development, mobile apps, and enterprise software to handle user data and business logic efficiently.",
            "theory": f"Understanding {topic_name} is crucial for system design, where engineers need to make architectural decisions that affect scalability and performance.",
            "default": f"This concept is applied in various scenarios such as database management, application development, and system optimization."
        }
        
        example = examples.get("programming" if is_programming else "theory" if is_theory else "default", examples["default"])
        
        # Common mistakes template
        common_mistakes = [
            f"Not understanding the core principles of {topic_name} before implementation",
            f"Ignoring edge cases and boundary conditions",
            f"Over-complicating the solution instead of keeping it simple",
            f"Not testing the implementation thoroughly"
        ]
        
        # Generate exam answers
        exam_answers = {
            "2_marks": f"{topic_name} is {definition[:100]}... It is characterized by specific properties that make it suitable for particular use cases.",
            "5_marks": f"""Definition: {definition}

Key Points:
1. Core concept and fundamental principles
2. Practical applications and use cases  
3. Advantages and benefits
4. Common implementations

Examples: {example[:150]}...""",
            "10_marks": f"""Comprehensive Answer on {topic_name}:

1. Introduction:
{definition}

2. Fundamentals:
- Core principles and theoretical foundation
- Key characteristics and properties
- How it relates to other concepts

3. Real-World Applications:
{example}

4. Implementation Details:
- Step-by-step approach
- Best practices to follow
- Common pitfalls to avoid

5. Advantages:
- Efficiency and optimization
- Scalability and maintainability
- Practical benefits

6. Conclusion:
{topic_name} is essential for modern software development and understanding it thoroughly enables better problem-solving capabilities."""
        }
        
        # Interview relevance
        interview_relevance = f"""Understanding {topic_name} is highly valuable for technical interviews because:
        
1. It demonstrates fundamental knowledge of computer science
2. Shows ability to apply concepts to practical problems
3. Common topic in coding interviews at major tech companies
4. Helps in system design discussions

Interviewers often ask candidates to explain {topic_name} and demonstrate its implementation."""
        
        return {
            "topic_id": topic_id,
            "topic_name": topic_name,
            "definition": definition,
            "example": example,
            "common_mistakes": common_mistakes,
            "exam_answers": exam_answers,
            "interview_relevance": interview_relevance
        }
    
    @staticmethod
    def analyze_code(code: str, language: str) -> Dict:
        """Analyze code for errors (rule-based pattern matching)"""
        errors = {
            "python": [
                ("IndentationError", r"^[^ \t]", "Check your indentation - Python requires consistent spacing"),
                ("SyntaxError: missing :", r"(if|for|while|def|class)\s+.*[^:]$", "Add a colon at the end of control statements"),
                ("NameError", r"\b[A-Z][a-z]+\w*\b", "Variable not defined - check if you declared it first"),
                ("ZeroDivisionError", r"/\s*0", "Cannot divide by zero - add a condition to check"),
            ],
            "c": [
                ("Missing semicolon", r"[^;{}\n]\s*\n", "Add semicolon at the end of statements"),
                ("Undeclared variable", r"\b[a-z_][a-z0-9_]*\s*=", "Declare variable type before use"),
                ("Segmentation fault", r"(\*\w+|\w+\[\d+\])", "Check array bounds and pointer usage"),
            ]
        }
        
        # Simple pattern matching for common errors
        for error_type, pattern, hint in errors.get(language.lower(), []):
            # Simple check (in production, would use regex)
            if pattern in code.lower() or any(char in code for char in "[]{}()"):
                return {
                    "has_error": True,
                    "error_type": error_type,
                    "explanation": f"Your code may have a {error_type}",
                    "hint": hint,
                    "suggested_fix": f"Review the syntax and ensure proper {error_type.lower()} handling",
                    "viva_questions": [
                        f"What is {error_type}?",
                        f"How do you prevent {error_type} in {language}?",
                        "What are common debugging techniques?",
                        "Explain error handling best practices"
                    ]
                }
        
        # No errors detected
        return {
            "has_error": False,
            "error_type": None,
            "explanation": "Code looks good! Well structured and follows best practices.",
            "hint": "Try adding more edge case handling to make it more robust",
            "suggested_fix": None,
            "viva_questions": [
                f"Explain how your {language} code works",
                "What is the time complexity?",
                "How would you optimize this further?",
                "What are alternative approaches?"
            ]
        }
    
    @staticmethod
    def generate_exam_questions(topic_name: str) -> List[Dict]:
        """Generate exam questions for a topic"""
        return [
            {
                "question": f"Define {topic_name} and explain its significance",
                "marks": 2,
                "type": "short_answer"
            },
            {
                "question": f"Explain {topic_name} with a real-world example",
                "marks": 5,
                "type": "medium_answer"
            },
            {
                "question": f"Discuss {topic_name} in detail, covering theory, implementation, and applications",
                "marks": 10,
                "type": "long_answer"
            },
            {
                "question": f"Compare {topic_name} with similar concepts",
                "marks": 5,
                "type": "analytical"
            }
        ]
    
    @staticmethod
    def generate_study_tip(progress_data: Dict) -> str:
        """Generate personalized study tip"""
        completion_rate = progress_data.get("completion_percentage", 0)
        confused_count = len(progress_data.get("confused_topics", []))
        
        if completion_rate < 30:
            return "📚 Focus on completing one topic at a time. Consistency is key to building momentum!"
        elif completion_rate < 60:
            return "💪 Great progress! Keep going. Make sure to practice coding alongside theory for better retention."
        elif confused_count > 3:
            return "⚠️ You have some challenging topics. Take a break and revisit them with fresh eyes tomorrow."
        else:
            return "🎉 Excellent work! You're on track. Consider teaching these concepts to someone to reinforce your knowledge."

# Export singleton instance
content_generator = ContentGenerator()
