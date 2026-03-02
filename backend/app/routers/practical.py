from fastapi import APIRouter, Depends
from app.models import User
from app.schemas import CodeAnalysisRequest, CodeAnalysisResponse
from app.dependencies import get_current_user
from app.content_generator import content_generator

router = APIRouter(prefix="/practical", tags=["Practical Mode"])

# Removed legacy rule-based analysis in favor of await content_generator.analyze_code


@router.post("/analyze", response_model=CodeAnalysisResponse)
async def analyze_code_endpoint(
    request: CodeAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """Analyze code using AI-powered content generator"""
    result = await content_generator.analyze_code(request.code, request.language)
    return result

@router.get("/languages")
def get_supported_languages(current_user: User = Depends(get_current_user)):
    return {
        "languages": ["Python", "C"],
        "default": "Python"
    }
