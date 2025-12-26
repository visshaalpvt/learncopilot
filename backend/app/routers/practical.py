from fastapi import APIRouter, Depends
from app.models import User
from app.schemas import CodeAnalysisRequest, CodeAnalysisResponse
from app.dependencies import get_current_user
from app.content_generator import content_generator

router = APIRouter(prefix="/practical", tags=["Practical Mode"])

def analyze_code(code: str, language: str):
    """Rule-based code analysis - detects common errors"""
    
    language = language.lower()
    has_error = False
    error_type = None
    explanation = None
    hint = None
    suggested_fix = None
    viva_questions = []
    
    if language == "python":
        # Check for common Python errors
        if re.search(r'(if|for|while|def|class).*[^:]$', code, re.MULTILINE):
            has_error = True
            error_type = "syntax_error"
            error_info = mock_data["code_errors"]["python"]["syntax_error"]
            explanation = error_info["explanation"]
            hint = error_info["hint"]
            suggested_fix = "Add a colon (:) at the end of your if/for/while/def/class statement"
            viva_questions = error_info["viva_questions"]
        
        elif re.search(r'^\S', code, re.MULTILINE) and re.search(r'^\s+', code, re.MULTILINE):
            # Mixed indentation detection
            has_error = True
            error_type = "indentation_error"
            error_info = mock_data["code_errors"]["python"]["indentation_error"]
            explanation = error_info["explanation"]
            hint = error_info["hint"]
            suggested_fix = "Use consistent 4-space indentation throughout your code"
            viva_questions = error_info["viva_questions"]
        
        elif re.search(r'\/\s*0', code):
            has_error = True
            error_type = "zero_division"
            error_info = mock_data["code_errors"]["python"]["zero_division"]
            explanation = error_info["explanation"]
            hint = error_info["hint"]
            suggested_fix = "Add a check: if divisor != 0: before division"
            viva_questions = error_info["viva_questions"]
        
        elif re.search(r'\[\s*\d+\s*\]', code) and 'len(' not in code:
            # Potential index error
            has_error = True
            error_type = "index_error"
            error_info = mock_data["code_errors"]["python"]["index_error"]
            explanation = error_info["explanation"]
            hint = error_info["hint"]
            suggested_fix = "Check list length before accessing: if index < len(my_list):"
            viva_questions = error_info["viva_questions"]
        
        else:
            # No obvious error detected
            viva_questions = [
                "What is the time complexity of your solution?",
                "Can you optimize this code further?",
                "What are the edge cases you need to handle?",
                "How would you test this code?"
            ]
    
    elif language == "c":
        # Check for common C errors
        if not re.search(r';', code):
            has_error = True
            error_type = "syntax_error"
            error_info = mock_data["code_errors"]["c"]["syntax_error"]
            explanation = error_info["explanation"]
            hint = error_info["hint"]
            suggested_fix = "Add semicolons (;) at the end of each statement"
            viva_questions = error_info["viva_questions"]
        
        elif re.search(r'\*\w+\s*;.*(?!malloc|calloc)', code) and 'NULL' not in code:
            has_error = True
            error_type = "segmentation_fault"
            error_info = mock_data["code_errors"]["c"]["segmentation_fault"]
            explanation = error_info["explanation"]
            hint = error_info["hint"]
            suggested_fix = "Initialize pointers: int *ptr = NULL; or allocate memory: ptr = malloc(sizeof(int));"
            viva_questions = error_info["viva_questions"]
        
        elif re.search(r'\/\s*0', code):
            has_error = True
            error_type = "zero_division"
            explanation = "Division by zero is undefined and will crash your program."
            hint = "Check if divisor is zero before division"
            suggested_fix = "Add: if (divisor != 0) { result = num / divisor; }"
            viva_questions = [
                "What happens when you divide by zero in C?",
                "How do you handle errors in C?",
                "What is the difference between compile-time and runtime errors?"
            ]
        
        else:
            viva_questions = [
                "What is the difference between malloc and calloc?",
                "Why should you always free allocated memory?",
                "What is a memory leak?",
                "How does pointer arithmetic work?"
            ]
    
    return {
        "has_error": has_error,
        "error_type": error_type,
        "explanation": explanation,
        "hint": hint,
        "suggested_fix": suggested_fix,
        "viva_questions": viva_questions
    }


@router.post("/analyze", response_model=CodeAnalysisResponse)
def analyze_code_endpoint(
    request: CodeAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """Analyze code using content generator"""
    result = content_generator.analyze_code(request.code, request.language)
    return result

@router.get("/languages")
def get_supported_languages(current_user: User = Depends(get_current_user)):
    return {
        "languages": ["Python", "C"],
        "default": "Python"
    }
