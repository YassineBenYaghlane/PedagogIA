from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.skill import Skill
from app.schemas.skill import SkillRead

router = APIRouter(prefix="/skills", tags=["skills"])


def _to_schema(skill: Skill) -> SkillRead:
    return SkillRead(
        id=skill.id,
        label=skill.label,
        grade=skill.grade,
        description=skill.description,
        mastery_threshold=skill.mastery_threshold,
        prerequisite_ids=[p.id for p in skill.prerequisites],
    )


@router.get("", response_model=list[SkillRead])
def list_skills(db: Session = Depends(get_db)):
    skills = db.query(Skill).order_by(Skill.grade, Skill.id).all()
    return [_to_schema(s) for s in skills]


@router.get("/{skill_id}", response_model=SkillRead)
def get_skill(skill_id: str, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return _to_schema(skill)
