import random

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.skill import ExerciseTemplate
from src.schemas.exercise import ExerciseResponse
from src.services.exercise_gen import instantiate

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.get("/generate", response_model=ExerciseResponse)
def generate_exercise(
    skill_id: str,
    difficulty: int | None = Query(default=None, ge=1, le=3),
    db: Session = Depends(get_db),
):
    """Generate a concrete exercise from a random template for the given skill."""
    query = db.query(ExerciseTemplate).filter(ExerciseTemplate.skill_id == skill_id)
    if difficulty is not None:
        query = query.filter(ExerciseTemplate.difficulty == difficulty)

    templates = query.all()
    if not templates:
        raise HTTPException(status_code=404, detail="No templates found for this skill")

    template = random.choice(templates)
    exercise = instantiate(template.template)

    return ExerciseResponse(
        template_id=template.id,
        skill_id=template.skill_id,
        difficulty=template.difficulty,
        type=template.template["type"],
        prompt=exercise["prompt"],
        answer=exercise["answer"],
        params=exercise["params"],
    )
